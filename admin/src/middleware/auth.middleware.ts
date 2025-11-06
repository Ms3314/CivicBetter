import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types';

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request context
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // TODO: Extract and validate JWT token from headers
  // TODO: Verify token signature
  // TODO: Fetch user from database
  // TODO: Attach user to request or send error if invalid

  const authReq = req as AuthenticatedRequest;
  authReq.user = {
    id: 'user-id',
    email: 'user@example.com',
    role: 'user',
  };

  next();
}

