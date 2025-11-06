import type { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

/**
 * User Controller
 * Handles user management operations (admin only)
 */
export class UserController {
  /**
   * Review/Get user details
   * GET /users/:id
   * Requires: Admin authentication
   */
  static async reviewUser(req: Request, res: Response) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'User ID is required' });

    try {
      const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json(user);
    } catch (error) {
      console.error('reviewUser error:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  /**
   * List all users
   * GET /users
   * Requires: Admin authentication
   */
  static async listUsers(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    const offset = (page - 1) * limit;

    try {
      const rows = await db
        .select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      const totalRows = await db.select({ id: users.id }).from(users);
      const total = totalRows.length;

      return res.json({ users: rows, total, page, limit });
    } catch (error) {
      console.error('listUsers error:', error);
      return res.status(500).json({ error: 'Failed to list users' });
    }
  }

  /**
   * Update user (admin)
   * PUT /users/:id
   * Requires: Admin authentication
   */
  static async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'User ID is required' });

    const body = req.body as Partial<{ name: string; role: 'citizen' | 'worker' | 'admin'; email: string; password: string }>;

    try {
      const [updated] = await db
        .update(users)
        .set({
          name: body.name,
          role: body.role,
          email: body.email,
          password: body.password,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: 'User not found' });
      return res.json(updated);
    } catch (error) {
      console.error('updateUser error:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  }
}

