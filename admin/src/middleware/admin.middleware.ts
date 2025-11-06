import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';

/**
 * Admin middleware
 * Checks if authenticated user has admin role
 * Must be used after authenticate middleware
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as AuthenticatedRequest;

  // TODO: Check if user exists and has admin role
  if (!authReq.user || authReq.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}

