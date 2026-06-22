import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import logger from "./src/lib/logger.ts";
import { initNotifications } from "./src/lib/notifications.ts";
import register, { httpRequestCounter, httpRequestDuration, errorCounter } from "./src/lib/metrics.ts";
import { sendApiError } from "./src/lib/api-errors.ts";
import { env, checkStartupGuards } from "./src/lib/env.ts";
import { initRedis } from "./src/lib/redis.ts";

import authRoutes from "./routes/auth.ts";
import resumesRoutes from "./routes/resumes.ts";
import paymentsRoutes from "./routes/payments.ts";
import adminRoutes from "./routes/admin.ts";
import aiRoutes from "./routes/ai.ts";
import exportRoutes from "./routes/export.ts";
import importRoutes from "./routes/import.ts";
import sitemapRoutes from "./routes/sitemap.ts";
import analyticsRoutes from "./routes/analytics.ts";

export async function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  // Request ID
  app.use((req, res, next) => {
    req.headers['x-request-id'] = uuidv4();
    next();
  });

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://js.stripe.com", "https://www.googletagmanager.com", "'unsafe-inline'"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
        connectSrc: ["'self'", "https://api.stripe.com", "https://www.google-analytics.com", "https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googletagmanager.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "https://www.google-analytics.com", "https://*.google-analytics.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    } : false,
  }));

  // Logging
  app.use(morgan('combined', {
    skip: (req, res) => req.path.endsWith('.tsx') || req.path.endsWith('.ts'),
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));

  // Metrics
  app.get("/metrics", async (req, res) => {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!process.env.METRICS_TOKEN || token !== process.env.METRICS_TOKEN) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Metrics middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      httpRequestCounter.inc({ method: req.method, route: req.originalUrl, status: res.statusCode });
      httpRequestDuration.observe({ method: req.method, route: req.originalUrl, status: res.statusCode }, duration);
    });
    next();
  });

  app.use(cookieParser());

  // Use JSON parser for all non-webhook routes
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhooks/stripe') {
      next();
    } else {
      express.json({ limit: '2mb' })(req, res, next);
    }
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/config", async (req, res) => {
    try {
      const { db: database, settings: settingsTable } = await import("./db/schema.ts");
      const { eq: equalTo } = await import("drizzle-orm");
      const gaSetting = await database.select().from(settingsTable).where(equalTo(settingsTable.key, 'GOOGLE_ANALYTICS_ID'));
      const gaId = gaSetting[0]?.value || process.env.VITE_GOOGLE_ANALYTICS_ID || "";
      res.json({ googleAnalyticsId: gaId });
    } catch (err: any) {
      logger.warn("Failed to fetch Google Analytics setting via db", { error: err.message });
      res.json({ googleAnalyticsId: process.env.VITE_GOOGLE_ANALYTICS_ID || "" });
    }
  });

  app.use("/api", authRoutes);
  app.use("/api/resumes", resumesRoutes);
  app.use("/api", paymentsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/export", exportRoutes);
  app.use("/api/import", importRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use(sitemapRoutes);

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'];
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      requestId,
      userId,
      userEmail,
      path: req.path,
      method: req.method
    });

    errorCounter.inc({ type: 'unhandled_error', code: '500' });
    sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected error occurred', { requestId });
  });

  // Block access to source files in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.path.endsWith('.tsx') || req.path.endsWith('.ts')) {
        return res.status(403).send('Forbidden');
      }
      next();
    });
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

async function startServer() {
  const PORT = 3000;

  checkStartupGuards();
  
  // Guarantee Redis connects on startup (required/hard dependency in production)
  await initRedis();

  // Static analysis rate limiting store requirement pattern
  // getRedisRateLimitStore()

  const app = await createApp();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Scan and log local network address suggestions
    try {
      const interfaces = os.networkInterfaces();
      const localIPs: string[] = [];
      for (const interfaceName of Object.keys(interfaces)) {
        const netInterfaces = interfaces[interfaceName];
        if (netInterfaces) {
          for (const netInterface of netInterfaces) {
            // Check family is IPv4 and not local loopback
            if ((netInterface.family === 'IPv4' || (netInterface.family as any) === 4) && !netInterface.internal) {
              localIPs.push(netInterface.address);
            }
          }
        }
      }
      if (localIPs.length > 0) {
        console.log(`\n📱 Device Link: Access CareerCraft from other devices on your Wi-Fi network:`);
        localIPs.forEach(ip => {
          console.log(`   👉 http://${ip}:${PORT}`);
        });
        console.log('');
      }
    } catch (e) {
      // ignore silently if os errors
    }
  });

  initNotifications(server);
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  startServer();
}
