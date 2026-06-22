import { db, paymentVerifications } from "../db/schema.ts";
import { eq, and } from "drizzle-orm";

export async function checkAndApplyGracePeriod(user: any) {
  if (!user) return user;
  if (user.subscription_status === 'active') {
    return user; // Already active
  }

  try {
    // Check if they have a pending manual payment verification submitted in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pendingVerifications = await db.select()
      .from(paymentVerifications)
      .where(and(
        eq(paymentVerifications.user_id, user.id),
        eq(paymentVerifications.status, 'pending')
      ));

    // Filter in JS to avoid parsing issues with SQLite/Postgres timestamp types across various database adapters
    const activePending = pendingVerifications.find(pv => {
      const createdAt = new Date(pv.created_at);
      return createdAt > oneDayAgo;
    });

    if (activePending) {
      const endsAt = new Date(new Date(activePending.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString();
      const plan = activePending.plan || 'pro';
      return {
        ...user,
        subscription_status: 'active',
        subscription_plan: plan,
        is_grace_period: true,
        grace_period_plan: plan,
        grace_period_expires: endsAt,
        credits: activePending.type === 'payment'
          ? Math.max(user.credits, plan === 'bundle' ? 3 : plan === 'premium' ? 5 : 1)
          : user.credits
      };
    }
  } catch (err) {
    console.error("Error evaluating grace period:", err);
  }

  return user;
}
