import { createClient as createRedisClient } from "redis";
import RedisStoreRaw from "rate-limit-redis";

// Interop wrapper for ESM/CJS dual target loaders
const RedisStore: any = (RedisStoreRaw as any).RedisStore || (RedisStoreRaw as any).default || RedisStoreRaw;

const redisUrl = process.env.REDIS_URL;
export let redisClient: ReturnType<typeof createRedisClient> | null = null;

export async function initRedis() {
  if (redisUrl) {
    redisClient = createRedisClient({ url: redisUrl });
    redisClient.on('error', (err) => logRedisError('Redis Client Error', err));
    try {
      await redisClient.connect();
      console.log(`[Redis] Connected successfully to Redis instance.`);
    } catch (err) {
      console.error(`[Redis] Failed to connect to Redis during startup:`, err);
      console.warn(`[Redis] Falling back to local in-memory caching and state tracking.`);
      redisClient = null;
    }
  } else {
    console.warn(`[Redis] REDIS_URL is not set. Falling back to local in-memory caching and state tracking.`);
  }
}

export function getRedisRateLimitStore() {
  if (!redisUrl) {
    return undefined;
  }

  // Return the store immediately on module load.
  // The actual redisClient must be connected by startServer() before any request arrives.
  return new RedisStore({
    sendCommand: (...args: string[]) => {
      if (!redisClient) {
        throw new Error("❌ REDIS RATE-LIMIT STORAGE ERROR: Redis client is not initialized.");
      }
      return redisClient.sendCommand(args);
    },
  });
}

export function logRedisError(message: string, error: any) {
  console.error(`[REDIS_ALERT] ${message}:`, error);
}

export async function safeRedisGet(key: string): Promise<{ value: string | null, error: boolean }> {
  const isProd = process.env.NODE_ENV === "production";

  if (redisClient && redisClient.isReady) {
    try {
      const val = await redisClient.get(key);
      return { value: val ? val.toString() : null, error: false };
    } catch (err) {
      logRedisError('Redis get error', err);
      if (isProd) {
        throw new Error(`[Redis] Get operation failed on key "${key}" during production runtime: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } else if (isProd) {
    throw new Error(`[Redis] Client not initialized or ready during production runtime to get "${key}".`);
  }
  return { value: null, error: true };
}

export async function safeRedisIncr(key: string): Promise<{ value: number | null, error: boolean }> {
  const isProd = process.env.NODE_ENV === "production";

  if (redisClient && redisClient.isReady) {
    try {
      const val = await redisClient.incr(key);
      return { value: Number(val), error: false };
    } catch (err) {
      logRedisError('Redis incr error', err);
      if (isProd) {
        throw new Error(`[Redis] Incr operation failed on key "${key}" during production runtime: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } else if (isProd) {
    throw new Error(`[Redis] Client not initialized or ready during production runtime to incr "${key}".`);
  }
  return { value: null, error: true };
}

export async function safeRedisSetEx(key: string, ttl: number, value: string): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";

  if (redisClient && redisClient.isReady) {
    try {
      await redisClient.setEx(key, ttl, value);
    } catch (err) {
      logRedisError('Redis setEx error', err);
      if (isProd) {
        throw new Error(`[Redis] SetEx operation failed on key "${key}" during production runtime: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } else if (isProd) {
    throw new Error(`[Redis] Client not initialized or ready during production runtime to setEx "${key}".`);
  }
}

export async function safeRedisDel(key: string): Promise<void> {
  const isProd = process.env.NODE_ENV === "production";

  if (redisClient && redisClient.isReady) {
    try {
      await redisClient.del(key);
    } catch (err) {
      logRedisError('Redis del error', err);
      if (isProd) {
        throw new Error(`[Redis] Del operation failed on key "${key}" during production runtime: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } else if (isProd) {
    throw new Error(`[Redis] Client not initialized or ready during production runtime to del "${key}".`);
  }
}
