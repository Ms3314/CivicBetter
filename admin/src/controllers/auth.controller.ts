import type { Request, Response } from 'express';
import type { LoginRequest, RegisterRequest, AuthenticatedRequest } from '../types';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

type UserRole = 'citizen' | 'worker' | 'admin';

function signToken(payload: { id: string; email: string; role: UserRole }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Auth Controller
 * Handles authentication-related operations
 */
export class AuthController {
  /**
   * User login
   * POST /auth/login
   */
  static async login(req: Request, res: Response) {
    // Validate
    const body = req.body as LoginRequest & { role?: UserRole };
    if (!body.email || !body.password || !body.role) {
      return res.status(400).json({ error: 'email, password and role are required' });
    }

    try {
      const [found] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
      if (!found) return res.status(401).json({ error: 'Invalid credentials' });

      // Check role
      if (found.role !== body.role) {
        return res.status(403).json({ error: 'Role mismatch' });
      }

      // Compare password (supports plaintext in early dev, but prefers bcrypt hashes)
      const passwordMatches = found.password.startsWith('$2b$')
        ? await bcrypt.compare(body.password, found.password)
        : body.password === found.password;

      if (!passwordMatches) return res.status(401).json({ error: 'Invalid credentials' });

      const token = signToken({ id: found.id, email: found.email, role: found.role as UserRole });
      return res.json({
        token,
        user: {
          id: found.id,
          email: found.email,
          role: found.role,
        },
      });
    } catch (error) {
      console.error('login error:', error);
      return res.status(500).json({ error: 'Login failed' });
    }
  }

  /**
   * User registration
   * POST /auth/register
   */
  static async register(req: Request, res: Response) {
    const body = req.body as RegisterRequest & { role?: UserRole; name?: string };

    if (!body.email || !body.password || !body.role || !body.name) {
      return res.status(400).json({ error: 'name, email, password and role are required' });
    }

    try {
      // Check if exists
      const [existing] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
      if (existing) return res.status(409).json({ error: 'User already exists' });

      const hashed = await bcrypt.hash(body.password, 10);
      const [created] = await db
        .insert(users)
        .values({
          email: body.email,
          password: hashed,
          name: body.name,
          role: body.role,
        })
        .returning();

      if (!created) {
        return res.status(500).json({ error: 'Failed to create user' });
      }

      const token = signToken({ id: created.id, email: created.email, role: created.role as UserRole });
      return res.status(201).json({
        token,
        user: {
          id: created.id,
          email: created.email,
          role: created.role,
          name: created.name,
        },
      });
    } catch (error) {
      console.error('register error:', error);
      return res.status(500).json({ error: 'Registration failed' });
    }
  }

  /**
   * Get current user
   * GET /auth/me
   */
  static async getCurrentUser(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    if (!authReq.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const [found] = await db.select().from(users).where(eq(users.id, authReq.user.id)).limit(1);
      if (!found) return res.status(404).json({ error: 'User not found' });
      return res.json({ id: found.id, email: found.email, role: found.role, name: found.name });
    } catch (error) {
      console.error('getCurrentUser error:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  /**
   * User logout
   * POST /auth/logout
   */
  static async logout(req: Request, res: Response) {
    // Stateless JWT logout is client-side; optionally implement blacklist.
    return res.json({ message: 'Logged out successfully' });
  }
}

