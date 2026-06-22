import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db, users, resumes, transactions, resumeVersions } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middleware/auth.ts";
import { sendApiError, handleGlobalError } from "../src/lib/api-errors.ts";
import { env } from "../src/lib/env.ts";
import { getAppConfig } from "../src/lib/app-config.ts";
import logger from "../src/lib/logger.ts";
import { errorCounter } from "../src/lib/metrics.ts";
import { signToken } from "../src/lib/jwt.ts";
import { safeRedisSetEx, safeRedisGet, safeRedisDel } from "../src/lib/redis.ts";
import { sendPasswordResetEmail, sendEmail } from "../src/services/emailService.ts";
import { checkAndApplyGracePeriod } from "./graceHelper.ts";
import { broadcastNotification } from "../src/lib/notifications.ts";
import { escapeHtml } from "../src/lib/sanitizer.ts";
import { validatePassword } from "../src/lib/password-policy.ts";


const router = Router();

const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referrer: z.string().optional(),
  name: z.string().optional(),
});

router.post("/auth/signup", async (req, res) => {
  try {
    const { email, password, referrer, name } = AuthSchema.parse(req.body);
    
    // Enforce Password Policy Check
    const policyResult = validatePassword(password, false);
    if (!policyResult.valid) {
      return sendApiError(res, 400, 'WEAK_PASSWORD', policyResult.message || 'Password does not meet complexity requirements');
    }
    
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return sendApiError(res, 400, 'USER_EXISTS', 'User already exists');
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const referralCode = crypto.randomBytes(4).toString('hex');
    
    let referredById: string | null = null;
    let initialCredits = 1;
    if (referrer) {
        const referrerRows = await db.select().from(users).where(eq(users.referral_code, referrer));
        if (referrerRows.length > 0) {
            referredById = referrerRows[0].id;
            initialCredits = 2; // Bonus credit!
            // Give reward to referrer
            await db.update(users).set({ credits: sql`credits + 1` }).where(eq(users.id, referredById));
        }
    }
    
    const userDisplayName = name || email.split('@')[0];
    await db.insert(users).values({
      id: userId,
      email,
      password_hash: passwordHash,
      subscription_status: 'inactive',
      subscription_plan: 'none',
      credits: initialCredits,
      is_admin: 0,
      name: userDisplayName,
      created_at: new Date(),
      referral_code: referralCode,
      referred_by: referredById,
    });

    try {
      broadcastNotification(
        "signup",
        "New User Registered 👤",
        `User ${userDisplayName} (${email}) has just joined the platform.`,
        { id: userId, email, name: userDisplayName, created_at: new Date() }
      );
    } catch (wsErr: any) {
      logger.warn("WebSocket notification failed for signup, resuming execution", { error: wsErr.message });
    }
    
    const token = await signToken(userId, email);
    res.json({ token, user: { id: userId, email } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return sendApiError(res, 400, 'INVALID_INPUT', `Invalid input: ${msg}`, error.issues);
    }
    logger.error("Signup error", { error: error.message, stack: error.stack, fullError: error });
    errorCounter.inc({ type: 'auth_error', code: 'signup_failed' });
    handleGlobalError(res, error, 'INTERNAL_SERVER_ERROR', 'Signup failed');
  }
});

router.post("/auth/signin", async (req, res) => {
  try {
    const { email, password } = AuthSchema.parse(req.body);
    
    const userRows = await db.select().from(users).where(eq(users.email, email));
    const user = userRows[0];
    
    if (!user || !user.password_hash) {
      return sendApiError(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return sendApiError(res, 401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    }

    if (user.is_suspended) {
      return sendApiError(res, 403, 'SUSPENDED_ACCOUNT', 'Your account has been suspended. Please contact support.');
    }
    
    await db.update(users).set({ last_login: new Date() }).where(eq(users.id, user.id));
    
    const token = await signToken(user.id, user.email!);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return sendApiError(res, 400, 'INVALID_INPUT', `Invalid input: ${msg}`, error.issues);
    }
    logger.error("Signin error", { error: error.message });
    errorCounter.inc({ type: 'auth_error', code: 'signin_failed' });
    handleGlobalError(res, error, 'INTERNAL_SERVER_ERROR', 'Signin failed');
  }
});

router.get("/linkedin/callback", async (req, res) => {
  res.status(404).send('LinkedIn OAuth is disabled');
});
router.get("/user", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const email = req.user!.email!;
  
  try {
    let userRows = await db.select().from(users).where(eq(users.id, userId));
    let user = userRows[0];
    
    if (!user) {
      return sendApiError(res, 401, 'UNAUTHORIZED', 'Unauthorized: User not found');
    }

    await db.update(users).set({ last_login: new Date() }).where(eq(users.id, userId));
    userRows = await db.select().from(users).where(eq(users.id, userId));
    user = userRows[0];
    
    const userWithGrace = await checkAndApplyGracePeriod(user);
    res.json(userWithGrace);
  } catch (error: any) {
    const requestId = req.headers['x-request-id'];
    logger.error("Failed to get user", {
      error: error.message,
      stack: error.stack,
      requestId,
      userId,
      email
    });
    handleGlobalError(res, error, 'INTERNAL_SERVER_ERROR', 'Failed to get user');
  }
});

const PutUserSchema = z.object({
  name: z.string().min(1).max(100).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  avatar_url: z.string().optional().nullable()
});

router.put("/user", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const parsed = PutUserSchema.parse(req.body);
    
    const updates: Record<string, any> = {};
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.email !== undefined) updates.email = parsed.email;
    if (parsed.avatar_url !== undefined) updates.avatar_url = parsed.avatar_url;
    
    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, userId));
    }
    
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    const userWithGrace = await checkAndApplyGracePeriod(userRows[0]);
    res.json(userWithGrace);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendApiError(res, 400, 'INVALID_INPUT', 'Invalid input', error.issues);
    }
    
    const requestId = req.headers['x-request-id'];
    logger.error("Failed to update user", {
      error: error.message,
      stack: error.stack,
      requestId,
      userId
    });
    
    handleGlobalError(res, error, 'INTERNAL_SERVER_ERROR', 'Failed to update user');
  }
});

router.get("/user/export", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    const userResumes = await db.select().from(resumes).where(eq(resumes.user_id, userId));
    const userTransactions = await db.select().from(transactions).where(eq(transactions.user_id, userId));
    
    // Parse data safely for transport
    const resumesData = userResumes.map(r => ({
      ...r,
      data: (typeof r.data === 'string' && r.data.startsWith('{')) ? JSON.parse(r.data) : r.data
    }));

    let profile = null;
    if (userRows[0]) {
      const { password_hash, stripe_customer_id, ...rest } = userRows[0];
      profile = rest;
    }

    const exportData = {
      profile,
      resumes: resumesData,
      financials: userTransactions,
      exportedAt: new Date().toISOString()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="my_data_export.json"');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error: any) {
    logger.error("Failed to export user data", { error: error.message, userId });
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to export data');
  }
});

router.delete("/user", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  try {
    // Delete all user data to comply with privacy regulations
    
    // First, delete related resumes versions
    await db.delete(resumeVersions)
      .where(
        sql`resume_id IN (SELECT id FROM resumes WHERE user_id = ${userId})`
      );
      
    // Delete resumes
    await db.delete(resumes).where(eq(resumes.user_id, userId));
    
    // Delete transactions
    await db.delete(transactions).where(eq(transactions.user_id, userId));
    
    // Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    res.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    const requestId = req.headers['x-request-id'];
    logger.error("Failed to delete user", {
      error: error.message,
      stack: error.stack,
      requestId,
      userId
    });
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to delete user data');
  }
});

router.put("/auth/password", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  
  try {
    const { currentPassword, password } = z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      password: z.string().min(6, "New password must be at least 6 characters")
    }).parse(req.body);

    const userRows = await db.select().from(users).where(eq(users.id, userId));
    const user = userRows[0];
    if (!user || !user.password_hash) {
      return sendApiError(res, 401, 'UNAUTHORIZED', 'User not found or password not configured');
    }

    // Enforce Password Policy Check, checking if the updating user is an administrator
    const policyResult = validatePassword(password, user.is_admin === 1);
    if (!policyResult.valid) {
      return sendApiError(res, 400, 'WEAK_PASSWORD', policyResult.message || 'Password does not meet complexity requirements');
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) {
      return sendApiError(res, 400, 'INCORRECT_PASSWORD', 'The current password you entered is incorrect');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.update(users).set({ password_hash: passwordHash }).where(eq(users.id, userId));
    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return sendApiError(res, 400, 'INVALID_INPUT', `Invalid data provided: ${msg}`, error.issues);
    }
    logger.error("Password update error", { error: error.message });
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Password update failed');
  }
});

router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const userRows = await db.select().from(users).where(eq(users.email, email));
    
    if (userRows.length === 0) {
      // Return 200 to prevent user enumeration
      return res.json({ success: true });
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    await safeRedisSetEx(`reset:${tokenHash}`, 3600, userRows[0].id);
    
    const appUrl = (await getAppConfig('APP_URL')) || env.APP_URL || 'http://localhost:3000';
    const resetLink = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    await sendPasswordResetEmail(email, resetLink);
    
    res.json({ success: true });
  } catch (error) {
    logger.error("Forgot password error", { error });
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to process request');
  }
});

router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, email, password } = z.object({ 
      token: z.string(), 
      email: z.string().email(),
      password: z.string().min(8)
    }).parse(req.body);
    
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { value: userId, error } = await safeRedisGet(`reset:${tokenHash}`);
    
    if (error || !userId) {
      return sendApiError(res, 400, 'INVALID_TOKEN', 'Invalid or expired token');
    }
    
    const userRows = await db.select().from(users).where(eq(users.id, userId));
    if (userRows.length === 0 || userRows[0].email !== email) {
      return sendApiError(res, 400, 'INVALID_TOKEN', 'Invalid token');
    }
    
    const user = userRows[0];
    // Enforce Password Policy Check
    const policyResult = validatePassword(password, user.is_admin === 1);
    if (!policyResult.valid) {
      return sendApiError(res, 400, 'WEAK_PASSWORD', policyResult.message || 'Password does not meet complexity requirements');
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    await db.update(users).set({ password_hash: passwordHash }).where(eq(users.id, userId));
    
    // Explicitly delete the reset token from Redis immediately after a successful password reset
    await safeRedisDel(`reset:${tokenHash}`);
    
    res.json({ success: true });
  } catch (error) {
    logger.error("Reset password error", { error });
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to reset password');
  }
});

const ContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message is required"),
});

router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = ContactSchema.parse(req.body);

    logger.info("New contact submission received", { name, email, subject });

    const supportEmail = process.env.EMAIL_TO || "support@careercraft.example";
    
    // Create direct plain text representation to bypass html entirely if client prefers it
    const plainTextBody = [
      `NEW CONTACT FORM SUBMISSION`,
      `============================`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      `============================`,
      `Message:`,
      message,
      `============================`,
      `This email was generated automatically by the CareerCraft contact form subsystem.`
    ].join('\n');

    await sendEmail({
      to: supportEmail,
      subject: `[CareerCraft Contact] ${subject}`,
      text: plainTextBody,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">New Support / Contact Submission</h2>
          <p style="margin-top: 20px;"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #4f46e5;">
            <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
          </div>
          <p style="margin-top: 30px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            This email was generated automatically by the CareerCraft contact form subsystem.
          </p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "Thank you! Your message has been sent successfully. Our support desk will reply within 24 hours.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendApiError(res, 400, 'VALIDATION_ERROR', error.issues[0].message);
    }
    logger.error("Contact submission error occurred", { error });
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to submit contact message. Please try again.');
  }
});

export default router;
