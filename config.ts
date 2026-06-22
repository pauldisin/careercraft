export const config = {
  resume: {
    maxVersions: parseInt(process.env.MAX_RESUME_VERSIONS || '20', 10),
  },
  ai: {
    dailyRequestCap: parseInt(process.env.DAILY_AI_REQUEST_CAP || '1000', 10),
    rateLimitWindowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
    rateLimitMaxRequests: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS || '20', 10), // 20 per hour
  },
  export: {
    rateLimitWindowMs: parseInt(process.env.EXPORT_RATE_LIMIT_WINDOW_MS || '3600000', 10), // 1 hour
    rateLimitMaxRequests: parseInt(process.env.EXPORT_RATE_LIMIT_MAX_REQUESTS || '30', 10), // 30 per hour
  }
};
