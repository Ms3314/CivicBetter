import type { Request, Response } from 'express';
import { db } from '../db';

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
      const user = await db.user.findUnique({
        where: { id },
      });
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
      const [rows, total] = await Promise.all([
        db.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.user.count(),
      ]);

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
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.role !== undefined) updateData.role = body.role;
      if (body.email !== undefined) updateData.email = body.email;
      if (body.password !== undefined) updateData.password = body.password;

      const updated = await db.user.update({
        where: { id },
        data: updateData,
      });

      return res.json(updated);
    } catch (error) {
      console.error('updateUser error:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  }
}

