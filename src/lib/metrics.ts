import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

const register = new Registry();

// Collect default system/resource metrics (CPU, Memory, Event Loop, Garbage Collection)
collectDefaultMetrics({ register });

// Define metrics
export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const errorCounter = new Counter({
  name: 'app_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'code'],
  registers: [register],
});

export const aiRequestCounter = new Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI generation requests',
  labelNames: ['status', 'model'],
  registers: [register],
});

export const stripeWebhookCounter = new Counter({
  name: 'stripe_webhooks_total',
  help: 'Total number of Stripe webhooks processed',
  labelNames: ['event_type', 'status'],
  registers: [register],
});

export default register;
