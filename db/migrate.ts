import { db, sql, client, users } from "./schema.ts";
import { env } from "../src/lib/env.ts";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";

async function verifyConnection(maxRetries = 8, backoffMs = 1500): Promise<boolean> {
  console.log(`[Database Migration] Verifying connection to database (Env: ${env.NODE_ENV})...`);
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (env.DATABASE_URL) {
        await sql`SELECT 1`;
      } else if (client) {
        await client.query("SELECT 1");
      }
      console.log(`[Database Migration] Connection verified successfully on attempt ${attempt}.`);
      return true;
    } catch (err: any) {
      console.warn(`[Database Migration] Connection attempt ${attempt}/${maxRetries} failed: ${err?.message || err}`);
      if (attempt === maxRetries) {
        return false;
      }
      const delay = backoffMs * Math.pow(1.5, attempt - 1);
      console.log(`[Database Migration] Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

async function runMigrations() {
  const migrationsFolder = path.join(process.cwd(), "db/drizzle");
  console.log(`[Database Migration] Starting schema migration using folder: ${migrationsFolder}`);
  
  // 1. Verify connectivity with retry and backoff
  const isConnected = await verifyConnection();
  if (!isConnected) {
    console.error("❌ [Database Migration] FATAL: Failed to connect to the database after several retries.");
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return;
  }

  // 2. Deploy migrations, coordinating multiple instances via postgres advisory locking
  try {
    if (env.DATABASE_URL) {
      console.log("[Database Migration] PostgreSQL detected. Acquiring session-level advisory lock...");
      
      // We use a unique BigInt '142857' as our application migration namespace key
      await sql`SELECT pg_advisory_lock(142857)`;
      console.log("[Database Migration] Distributed advisory lock acquired successfully.");

      try {
        const { migrate } = await import("drizzle-orm/postgres-js/migrator");
        await migrate(db as any, { migrationsFolder });
        console.log("✅ [Database Migration] Schema migrated successfully under advisory lock.");
      } finally {
        console.log("[Database Migration] Releasing distributed advisory lock...");
        await sql`SELECT pg_advisory_unlock(142857)`;
        console.log("[Database Migration] Advisory lock released.");
      }

      // Close database connection safe exit
      await sql.end();
    } else {
      console.log("[Database Migration] PGlite development database detected. Running local migrations...");
      const { migrate } = await import("drizzle-orm/pglite/migrator");
      await migrate(db as any, { migrationsFolder });
      console.log("✅ [Database Migration] PGlite migrations completed successfully.");
    }
    
    // Ensure the analytics_events table is bootstrapped correctly
    try {
      console.log("[Database Migration] Ensuring analytics_events table exists...");
      const analyticsQuery = `CREATE TABLE IF NOT EXISTS "analytics_events" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text,
        "session_id" text NOT NULL,
        "event_name" text NOT NULL,
        "path" text,
        "referrer" text,
        "device_type" text NOT NULL,
        "browser" text,
        "os" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`;
      if (env.DATABASE_URL) {
        await sql.unsafe(analyticsQuery);
      } else if (client) {
        await client.query(analyticsQuery);
      }
      console.log("✅ [Database Migration] analytics_events table verified ready.");
    } catch (tableErr) {
      console.error("⚠️ [Database Migration] Failed to bootstrap analytics_events table:", tableErr);
    }

    // Ensure the audit_logs table is bootstrapped correctly
    try {
      console.log("[Database Migration] Ensuring audit_logs table exists...");
      const auditQuery = `CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" text PRIMARY KEY NOT NULL,
        "admin_id" text NOT NULL,
        "admin_email" text NOT NULL,
        "action_type" text NOT NULL,
        "target_id" text,
        "details" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )`;
      if (env.DATABASE_URL) {
        await sql.unsafe(auditQuery);
      } else if (client) {
        await client.query(auditQuery);
      }
      console.log("✅ [Database Migration] audit_logs table verified ready.");
    } catch (tableErr) {
      console.error("⚠️ [Database Migration] Failed to bootstrap audit_logs table:", tableErr);
    }

    // Ensure settings table is bootstrapped correct
    try {
      console.log("[Database Migration] Ensuring settings table exists...");
      const settingsQuery = `CREATE TABLE IF NOT EXISTS "settings" (
        "key" text PRIMARY KEY NOT NULL,
        "value" text NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )`;
      if (env.DATABASE_URL) {
        await sql.unsafe(settingsQuery);
      } else if (client) {
        await client.query(settingsQuery);
      }
      console.log("✅ [Database Migration] settings table verified ready.");
    } catch (tableErr) {
      console.error("⚠️ [Database Migration] Failed to bootstrap settings table:", tableErr);
    }

    // Ensure payment_verifications table is bootstrapped correctly
    try {
      console.log("[Database Migration] Ensuring payment_verifications table exists...");
      const paymentQuery = `CREATE TABLE IF NOT EXISTS "payment_verifications" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "method" text NOT NULL,
        "receipt_number" text,
        "amount" integer,
        "currency" text DEFAULT 'PGK',
        "screenshot_url" text,
        "status" text DEFAULT 'pending',
        "notes" text,
        "reviewed_by" text,
        "plan" text NOT NULL,
        "type" text NOT NULL,
        "ocr_data" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )`;
      if (env.DATABASE_URL) {
        await sql.unsafe(paymentQuery);
      } else if (client) {
        await client.query(paymentQuery);
      }
      console.log("✅ [Database Migration] payment_verifications table verified ready.");
    } catch (tableErr) {
      console.error("⚠️ [Database Migration] Failed to bootstrap payment_verifications table:", tableErr);
    }

    // Ensure columns exist on users and payment_verifications
    try {
      console.log("[Database Migration] Ensuring necessary schema columns are present...");
      
      const alters = [
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" text`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by" text`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_suspended" integer DEFAULT 0 NOT NULL`,
        `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text`,
        `ALTER TABLE "payment_verifications" ADD COLUMN IF NOT EXISTS "ocr_data" text`
      ];

      for (const alterQuery of alters) {
        if (env.DATABASE_URL) {
          await sql.unsafe(alterQuery);
        } else if (client) {
          await client.query(alterQuery);
        }
      }
      console.log("✅ [Database Migration] Columns verified ready.");
    } catch (err: any) {
      console.error("⚠️ [Database Migration] Failed to ensure newer columns are present:", err?.message || err);
    }

    // Auto-seed/sync the admin user credentials
    try {
      console.log("[Database Seeding] Ensuring default administrator credentials exist...");
      const adminEmail = "admin@careercraft.com";
      const adminPassword = "CareerAdmin#2026";
      const adminName = "System Administrator";

      const normalizedEmail = adminEmail.trim().toLowerCase();
      
      const existingUserRows = await db.select().from(users).where(eq(users.email, normalizedEmail));
      const existingUser = existingUserRows[0];

      const passwordHash = await bcrypt.hash(adminPassword, 10);

      if (existingUser) {
        console.log(`[Database Seeding] Admin user '${normalizedEmail}' already exists. Syncing credentials...`);
        await db.update(users).set({
          is_admin: 1,
          password_hash: passwordHash,
          name: adminName,
          subscription_status: 'active',
          subscription_plan: 'lifetime',
          credits: 9999,
          is_suspended: 0,
        }).where(eq(users.id, existingUser.id));
        console.log("✅ [Database Seeding] Admin user updated successfully.");
      } else {
        console.log(`[Database Seeding] Admin user '${normalizedEmail}' not found. Creating brand new admin user...`);
        const userId = crypto.randomUUID();
        const referralCode = crypto.randomBytes(4).toString('hex');

        await db.insert(users).values({
          id: userId,
          email: normalizedEmail,
          password_hash: passwordHash,
          name: adminName,
          is_admin: 1,
          subscription_status: 'active',
          subscription_plan: 'lifetime',
          credits: 9999,
          referral_code: referralCode,
          is_suspended: 0,
        });
        console.log("✅ [Database Seeding] Admin user created successfully.");
      }
    } catch (seedErr: any) {
      console.error("⚠️ [Database Seeding] Failed to seed default administrator:", seedErr?.message || seedErr);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ [Database Migration] Critical migration failure:", error);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

runMigrations();
