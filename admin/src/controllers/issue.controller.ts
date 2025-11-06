import type { Request, Response } from 'express';
import type { CreateIssueRequest, EditIssueRequest, AuthenticatedRequest } from '../types';
import { db } from '../db';
import { issues } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Issue Controller
 * Handles issue-related operations
 */
export class IssueController {
  /**
   * Create a new issue
   * POST /issues
   * Requires: Authentication
   */
  static async createIssue(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    const body = req.body as Partial<CreateIssueRequest> & {
      category?: string;
      location?: string;
      photo?: string;
    };

    if (!body.title || !body.description || !body.category || !body.location) {
      return res.status(400).json({
        error: 'Missing required fields: title, description, category, location',
      });
    }

    try {
      const [created] = await db
        .insert(issues)
        .values({
          title: body.title,
          description: body.description,
          category: body.category,
          location: body.location,
          photo: body.photo ?? null,
          createdBy: authReq.user!.id,
          status: 'pending',
        })
        .returning();

      return res.status(201).json(created);
    } catch (error) {
      console.error('createIssue error:', error);
      return res.status(500).json({ error: 'Failed to create issue' });
    }
  }

  /**
   * Edit an existing issue
   * PUT /issues/:id
   * Requires: Authentication
   */
  static async editIssue(req: Request, res: Response) {
    // TODO: Validate request body
    // TODO: Check if issue exists
    // TODO: Check if user has permission (creator or admin)
    // TODO: Update issue in database
    // TODO: Return updated issue

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Issue ID is required' });
    }
    const body = req.body as EditIssueRequest & {
      category?: string;
      location?: string;
      photo?: string | null;
      assignedTo?: string | null;
    };

    try {
      const [updated] = await db
        .update(issues)
        .set({
          title: body.title,
          description: body.description,
          status: body.status,
          category: body.category,
          location: body.location,
          photo: body.photo,
          assignedTo: body.assignedTo,
          updatedAt: new Date(),
        })
        .where(eq(issues.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      return res.json(updated);
    } catch (error) {
      console.error('editIssue error:', error);
      return res.status(500).json({ error: 'Failed to update issue' });
    }
  }

  /**
   * Get issue by ID
   * GET /issues/:id
   * Requires: Authentication
   */
  static async getIssue(req: Request, res: Response) {
    // TODO: Fetch issue from database
    // TODO: Check if user has permission to view
    // TODO: Return issue

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Issue ID is required' });
    }

    try {
      const [found] = await db.select().from(issues).where(eq(issues.id, id)).limit(1);
      if (!found) {
        return res.status(404).json({ error: 'Issue not found' });
      }
      return res.json(found);
    } catch (error) {
      console.error('getIssue error:', error);
      return res.status(500).json({ error: 'Failed to fetch issue' });
    }
  }

  /**
   * List all issues
   * GET /issues
   * Requires: Authentication
   */
  static async listIssues(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    const offset = (page - 1) * limit;

    try {
      const rows = await db
        .select()
        .from(issues)
        .orderBy(desc(issues.createdAt))
        .limit(limit)
        .offset(offset);

      // total count
      const totalRows = await db.select({ id: issues.id }).from(issues);
      const total = totalRows.length;

      return res.json({ issues: rows, total, page, limit });
    } catch (error) {
      console.error('listIssues error:', error);
      return res.status(500).json({ error: 'Failed to list issues' });
    }
  }

  
}

