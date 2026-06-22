import jwt from 'jsonwebtoken';
import { getAppConfig } from './app-config.ts';
import crypto from 'crypto';

// Generate a random high-entropy secret at process scope as a safe fallback if JWT_SECRET is unset.
const fallbackSecret = crypto.randomBytes(64).toString('hex');

export const signToken = async (userId: string, email: string) => {
  const secret = await getAppConfig('JWT_SECRET') || process.env.JWT_SECRET;
  if (!secret) {
    return jwt.sign({ userId, email }, fallbackSecret, { expiresIn: '7d' });
  }
  return jwt.sign({ userId, email }, secret, { expiresIn: '7d' });
};

export const verifyToken = async (token: string) => {
  try {
    const secret = await getAppConfig('JWT_SECRET') || process.env.JWT_SECRET;
    if (!secret) {
      return jwt.verify(token, fallbackSecret) as { userId: string, email: string };
    }
    return jwt.verify(token, secret) as { userId: string, email: string };
  } catch (err) {
    return null;
  }
};
