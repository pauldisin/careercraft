import { Router } from "express";
import { z } from "zod";
import Stripe from "stripe";
import { db, users, transactions, paymentVerifications } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../middleware/auth.ts";
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getStripe } from "../src/lib/stripe.ts";
import { broadcastNotification } from "../src/lib/notifications.ts";
import logger from "../src/lib/logger.ts";
import { errorCounter, stripeWebhookCounter } from "../src/lib/metrics.ts";
import { trackError } from "../src/lib/alerts.ts";
import { performReceiptOCR } from "../src/lib/paymentOcr.ts";

const router = Router();

// OCR endpoint to dynamically analyze receipt screenshots during checkout
router.post(["/payments/ocr", "/payments/manual/ocr"], requireAuth, async (req: AuthRequest, res) => {
  try {
    const { screenshotUrl } = z.object({ screenshotUrl: z.string().min(1) }).parse(req.body);
    const ocrResult = await performReceiptOCR(screenshotUrl);
    res.json(ocrResult);
  } catch (error: any) {
    logger.error("OCR API route error:", { error: error.message });
    res.status(500).json({ error: "Failed to perform receipt scanning." });
  }
});

// User transactions
router.get("/user/transactions", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const userTransactions = await db.select().from(transactions).where(eq(transactions.user_id, userId)).orderBy(desc(transactions.created_at));
    res.json(userTransactions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

const PostCheckoutSchema = z.object({
  plan: z.enum(["basic", "bundle", "premium", "pro", "unlimited"]),
  type: z.enum(["payment", "subscription"])
});

router.post("/checkout", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const { plan, type } = PostCheckoutSchema.parse(req.body);
    const stripe = await getStripe();
    
    // Determine price based on plan
    let priceAmount = 0;
    let productName = "";
    let mode: "payment" | "subscription" = "payment";

    if (type === "subscription") {
      mode = "subscription";
      if (plan === "unlimited") {
        priceAmount = 44900; // K449.00
        productName = "Annual Pro";
      } else if (plan === "pro") {
        priceAmount = 7500; // K75.00
        productName = "Monthly Pro";
      }
    } else {
      mode = "payment";
      if (plan === "basic") {
        priceAmount = 1900; // K19.00
        productName = "Basic Resume";
      } else if (plan === "bundle") {
        priceAmount = 3900; // K39.00
        productName = "Resume + Cover Letter";
      } else if (plan === "premium") {
        priceAmount = 5900; // K59.00
        productName = "Premium Templates";
      }
    }

    if (priceAmount === 0) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "pgk",
            product_data: {
              name: productName,
            },
            unit_amount: priceAmount,
            ...(mode === "subscription" ? { recurring: { interval: plan === "unlimited" ? "year" : "month" } } : {}),
          },
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/success`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/cancel`,
      client_reference_id: userId,
      metadata: {
        plan,
        type
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.issues });
    }
    logger.error("Checkout error:", { error: error.message, stack: error.stack, userId });
    trackError('payment_error', 'checkout_failed', error);
    res.status(500).json({ error: error.message });
  }
});

const PostManualPaymentSchema = z.object({
  plan: z.enum(["basic", "bundle", "premium", "pro", "unlimited"]),
  type: z.enum(["payment", "subscription"]),
  method: z.enum(["wantok", "sms", "mobile_banking", "internet_banking"]),
  receiptNumber: z.string().min(1, "Receipt number is required"),
  amountStr: z.string().min(1, "Amount is required"),
  screenshotUrl: z.string().optional()
});

router.post(["/manual", "/payments/manual"], requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const { plan, type, method, receiptNumber, amountStr, screenshotUrl } = PostManualPaymentSchema.parse(req.body);
    
    // Convert amount string to integer
    const amount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;

    let ocrOutputJson: string | null = null;
    if (screenshotUrl) {
      try {
        logger.info(`[Payments Route] Starting background OCR scanned evaluation for user ${userId}`);
        const scanResult = await performReceiptOCR(screenshotUrl);
        ocrOutputJson = JSON.stringify(scanResult);
      } catch (ocrErr: any) {
        logger.error("[Payments Route] Automatic inline OCR scan failed:", ocrErr);
      }
    }

    const verificationId = uuidv4();

    await db.insert(paymentVerifications).values({
      id: verificationId,
      user_id: userId,
      method: method,
      receipt_number: receiptNumber,
      amount: amount,
      currency: "PGK",
      screenshot_url: screenshotUrl || null,
      status: "pending",
      plan: plan,
      type: type,
      ocr_data: ocrOutputJson,
    });

    // Extract user email for notifications
    const userRows = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
    const userEmail = userRows[0]?.email || "Unknown User";

    // Broadcast instant real-time admin notification & trigger Slack webhook
    broadcastNotification(
      "purchase",
      "Manual Payment Uploaded! 📥",
      `User ${userEmail} uploaded PNG/JPG receipt of ${amountStr} PGK. Receipt Reference: ${receiptNumber}. Target Plan: ${plan} (${type}).`,
      {
        id: verificationId,
        user_id: userId,
        email: userEmail,
        receiptNumber,
        amountText: amountStr,
        plan,
        type,
        method,
        ocrExtracted: ocrOutputJson ? JSON.parse(ocrOutputJson) : null
      }
    );

    res.json({ success: true, message: "Payment verification submitted successfully." });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input", details: error.issues });
    }
    logger.error("Manual Payment Error:", { error: error.message, stack: error.stack, userId });
    res.status(500).json({ error: "Failed to submit payment verification." });
  }
});

router.post("/billing-portal", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    const user = userRows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const stripe = await getStripe();
    let customerId = user.stripe_customer_id;

    if (!customerId) {
      // Lazily create a Stripe customer if it doesn't exist yet
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;
      // Persist the customer ID to the database so we reuse it
      await db.update(users).set({ stripe_customer_id: customerId }).where(eq(users.id, userId));
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.APP_URL || 'http://localhost:3000'}/account`,
      });
      res.json({ url: session.url });
    } catch (portalError: any) {
      // If Stripe complains about active subscriptions or settings
      logger.warn("Stripe billing portal session creation direct failure, mapping to user-friendly offline message", { error: portalError.message, customerId });
      if (user.subscription_status === 'active') {
        return res.status(200).json({ 
          url: null, 
          message: "You have a manual or offline active subscription. No online management on Stripe is required." 
        });
      }
      throw portalError;
    }
  } catch (error: any) {
    logger.error("Billing portal error:", { error: error.message, stack: error.stack, userId });
    trackError('payment_error', 'billing_portal_failed', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper for retrying DB operations in webhooks
async function retryDbOperation<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryDbOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Stripe Webhook
router.post("/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET is missing from environment. Stripe webhook requests will be rejected as unauthorized since signature verification cannot be performed.");
    return res.status(400).send("Webhook Error: STRIPE_WEBHOOK_SECRET is not configured on the server.");
  }

  if (!sig) {
    logger.error("Missing stripe-signature header.");
    return res.status(400).send("Webhook Error: stripe-signature-header-missing");
  }

  let event;

  try {
    const stripe = await getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    logger.error("Stripe Webhook signature verification failed", { error: err.message, stack: err.stack });
    trackError('webhook_error', 'signature_verification_failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const plan = session.metadata?.plan || 'unknown';
        const type = session.metadata?.type || 'unknown';

        if (userId) {
          const customerId = session.customer as string;
          
          await retryDbOperation(async () => {
            // Record transaction
            await db.insert(transactions).values({
              id: session.id,
              user_id: userId,
              amount: session.amount_total || 0,
              currency: session.currency || 'pgk',
              status: 'completed',
              plan: plan,
              type: type
            });

            if (type === 'subscription') {
              await db.update(users).set({
                subscription_status: 'active',
                subscription_plan: plan,
                stripe_customer_id: customerId
              }).where(eq(users.id, userId));
            } else if (type === 'payment') {
              let creditsToAdd = 1;
              if (plan === 'bundle') creditsToAdd = 3;
              if (plan === 'premium') creditsToAdd = 5;
              
              const userRows = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId));
              if (userRows.length > 0) {
                await db.update(users).set({
                  credits: userRows[0].credits + creditsToAdd,
                  stripe_customer_id: customerId
                }).where(eq(users.id, userId));
              }
            }
          });

          try {
            const userProfile = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId));
            const userEmail = userProfile[0]?.email || "Unknown User";
            const userName = userProfile[0]?.name || userEmail;

            if (type === 'subscription' && (plan === 'pro' || plan === 'unlimited')) {
              const formattedAmt = (session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00") + " PGK";
              const planLabel = plan === 'unlimited' ? 'Annual Pro (Unlimited)' : 'Monthly Pro';
              broadcastNotification(
                "purchase",
                "High-Value Subscription Purchased! 💎",
                `User ${userName} (${userEmail}) purchased high-value subscription plan: ${planLabel} for ${formattedAmt}.`,
                { userId, email: userEmail, plan, amount: session.amount_total, type }
              );
            }
          } catch (wsErr: any) {
            logger.warn("WebSocket notification failed for subscription completed checkout session", { error: wsErr.message });
          }
        }
        stripeWebhookCounter.inc({ event_type: event.type, status: 'success' });
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        logger.error(`Payment failed for invoice`, { invoiceId: invoice.id, customerId });
        trackError('payment_error', 'invoice_payment_failed', new Error(`Invoice payment failed: customer ${customerId}, invoice ${invoice.id}`));
        
        await retryDbOperation(async () => {
          await db.update(users).set({
            subscription_status: 'past_due'
          }).where(eq(users.stripe_customer_id, customerId));
        });
        stripeWebhookCounter.inc({ event_type: event.type, status: 'success' });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        await retryDbOperation(async () => {
          await db.update(users).set({
            subscription_status: 'inactive',
            subscription_plan: 'none'
          }).where(eq(users.stripe_customer_id, customerId));
        });
        logger.info(`Subscription deleted for customer`, { customerId });
        stripeWebhookCounter.inc({ event_type: event.type, status: 'success' });
        break;
      }
      default:
        logger.info(`Unhandled Stripe event type`, { eventType: event.type });
        stripeWebhookCounter.inc({ event_type: event.type, status: 'unhandled' });
    }
  } catch (error: any) {
    logger.error(`Error processing webhook event`, { eventType: event.type, error: error.message, stack: error.stack });
    stripeWebhookCounter.inc({ event_type: event.type, status: 'error' });
    trackError('webhook_error', 'event_processing_failed', error);
    return res.status(500).send('Event processing failed');
  }

  res.json({ received: true });
});

export default router;
