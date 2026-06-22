import { db, settings } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import { env } from "./env.ts";

let configCache: Record<string, string> = {};
let lastFetched = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function getAppConfig(key: string): Promise<string | undefined> {
  const now = Date.now();
  
  if (now - lastFetched > CACHE_TTL) {
    try {
      const allSettings = await db.select().from(settings);
      const newCache: Record<string, string> = {};
      allSettings.forEach(s => {
        newCache[s.key] = s.value;
      });
      configCache = newCache;
      lastFetched = now;
    } catch (err) {
      // Slitently fail if DB is not ready
      console.warn('Failed to fetch config from DB, using env variables only');
    }
  }

  // Return from DB cache if exists and not empty
  if (configCache[key]) {
    return configCache[key];
  }

  // Fallback to process.env or parsed env
  return process.env[key] || (env as any)[key];
}
