import type { Request, Response, NextFunction } from "express";
import { db, users } from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { redisClient, logRedisError } from "../src/lib/redis.ts";
import { verifyToken } from "../src/lib/jwt.ts";

export interface AuthRequest extends Request {
  user?: { id: string, email: string };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");
  
  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const userId = decoded.userId;
  
  const dbUsers = await db.select().from(users).where(eq(users.id, userId));
  const dbUser = dbUsers[0];
  if (!dbUser) {
    return res.status(401).json({ error: "Unauthorized: User not found" });
  }

  if (dbUser.is_suspended) {
    return res.status(403).json({ error: "Your account has been suspended. Please contact support." });
  }

  req.user = { id: dbUser.id, email: dbUser.email || "" };
  next();
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // IP restriction check
  const allowedIps = process.env.ADMIN_ALLOWED_IPS?.split(',').map(ip => ip.trim()).filter(Boolean) || [];
  if (allowedIps.length > 0) {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
    if (!clientIp || !allowedIps.includes(clientIp)) {
      return res.status(403).json({ error: "Forbidden: Access denied from this IP" });
    }
  }

  const dbUsers = await db.select().from(users).where(eq(users.id, user.id));
  const dbUser = dbUsers[0];
  if (!dbUser || !dbUser.is_admin) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }
  next();
};
