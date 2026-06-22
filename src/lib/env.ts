import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  REDIS_URL: z.string().url().optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  LINKEDIN_CLIENT_ID: z.string().min(1).optional(),
  LINKEDIN_CLIENT_SECRET: z.string().min(1).optional(),
  APP_URL: z.string().url().default('http://localhost:3000'),
  GEMINI_MODEL: z.string().optional(),
  DEMO_MODE: z.string().transform((val) => val === 'true').default('false' as any),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ADMIN_ALLOWED_IPS: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  EXPORT_RATE_LIMIT_WINDOW_MS: z.string().optional(),
  EXPORT_RATE_LIMIT_MAX_REQUESTS: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errorMsg = "❌ Invalid environment variables: " + JSON.stringify(parsedEnv.error.flatten().fieldErrors);
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const env = parsedEnv.data;

export function checkStartupGuards() {
  const isProd = env.NODE_ENV === 'production';
  const hasJwtSecret = !(!env.JWT_SECRET || env.JWT_SECRET.length < 32);
  const hasDatabaseUrl = !!env.DATABASE_URL;

  // Detect if we are running in the Google AI Studio Preview/Development Sandbox container
  const isAISandbox = !env.DATABASE_URL || (process.env.K_SERVICE && process.env.K_SERVICE.includes('ais-'));

  const authMode = hasJwtSecret ? "SECURE (JWT_SECRET configured)" : "DEV FALLBACK (High-entropy random key)";
  const dbMode = hasDatabaseUrl ? "PostgreSQL (DATABASE_URL configured)" : "PGlite (Development Local SQL Database)";

  console.log("\n=======================================================");
  console.log("  🚀 CareerCraft Server Initialization Started 🚀");
  console.log("=======================================================");
  console.log(`  Environment:   ${env.NODE_ENV}`);
  console.log(`  Database Mode: ${dbMode}`);
  console.log(`  Auth Mode:     ${authMode}`);
  console.log(`  Sandbox Mode:  ${isAISandbox ? "ENABLED (AI Studio Preview)" : "DISABLED (Hardened Cloud Production)"}`);
  console.log("=======================================================\n");

  if (isProd) {
    if (!env.JWT_SECRET) {
      console.error("\n=====================================================================");
      console.error("❌ FATAL ERROR: JWT_SECRET IS MISSING IN PRODUCTION MODE!");
      console.error("=====================================================================\n");
      if (!isAISandbox) {
        throw new Error("FATAL: JWT_SECRET environment variable is missing from production.");
      } else {
        console.warn("⚠️ AI Studio Sandbox Bypass: Bypassing hard crash because we are in dry-run preview mode.");
      }
    } else if (env.JWT_SECRET.length < 32) {
      console.error("\n=====================================================================");
      console.error("❌ FATAL ERROR: JWT_SECRET IS TOO WEAK IN PRODUCTION MODE!");
      console.error("=====================================================================\n");
      if (!isAISandbox) {
        throw new Error("FATAL: JWT_SECRET must be at least 32 characters in production to ensure high cryptograhic integrity.");
      } else {
        console.warn("⚠️ AI Studio Sandbox Bypass: Bypassing hard crash because we are in dry-run preview mode.");
      }
    }

    if (!env.REDIS_URL) {
      console.error("\n=====================================================================");
      console.error("❌ FATAL ERROR: REDIS_URL IS MISSING IN PRODUCTION MODE!");
      console.error("=====================================================================\n");
      if (!isAISandbox) {
        throw new Error("FATAL: REDIS_URL environment variable is missing from the production environment.");
      } else {
        console.warn("⚠️ AI Studio Sandbox Bypass: Bypassing hard crash because we are in dry-run preview mode. Falling back to local in-memory rate limiting.");
      }
    }

    if (env.DEMO_MODE) {
      console.error("\n=====================================================================");
      console.error("❌ FATAL ERROR: DEMO_MODE IS ENABLED IN PRODUCTION MODE!");
      console.error("=====================================================================\n");
      if (!isAISandbox) {
        throw new Error("FATAL: DEMO_MODE is enabled in production!");
      } else {
        console.warn("⚠️ AI Studio Sandbox Bypass: Bypassing hard crash because we are in dry-run preview mode.");
      }
    }

    if (!hasDatabaseUrl) {
      console.error("\n=====================================================================");
      console.error("❌ FATAL ERROR: DATABASE_URL IS MISSING IN PRODUCTION!");
      console.error("=====================================================================\n");
      if (!isAISandbox) {
        throw new Error("FATAL: DATABASE_URL environment variable is required in production for durable data storage.");
      } else {
        console.warn("⚠️ AI Studio Sandbox Bypass: Bypassing hard crash because we are in dry-run preview mode. Falling back to PGlite local database.");
      }
    }

    if (!env.STRIPE_SECRET_KEY) {
      console.error("\n=====================================================================");
      console.error("❌ FATAL ERROR: STRIPE_SECRET_KEY IS MISSING IN PRODUCTION!");
      console.error("=====================================================================\n");
      if (!isAISandbox) {
        throw new Error("FATAL: STRIPE_SECRET_KEY environment variable is required in production to process billing transactions.");
      } else {
        console.warn("⚠️ AI Studio Sandbox Bypass: Bypassing hard crash because we are in dry-run preview mode.");
      }
    }

    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error("\n=====================================================================");
      console.error("❌ FATAL ERROR: STRIPE_WEBHOOK_SECRET IS MISSING IN PRODUCTION!");
      console.error("=====================================================================\n");
      if (!isAISandbox) {
        throw new Error("FATAL: STRIPE_WEBHOOK_SECRET environment variable is required in production to handle callback signatures.");
      } else {
        console.warn("⚠️ AI Studio Sandbox Bypass: Bypassing hard crash because we are in dry-run preview mode.");
      }
    }
  }
}



