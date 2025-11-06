import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request context
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token signature
    let decoded: { id: string; email: string; role: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch user from database
    const [user] = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: user.id,
      email: user.email,
      role: user.role === 'admin' ? 'admin' : 'user', // Map citizen/worker to 'user' for type compatibility
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

