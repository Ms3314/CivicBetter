import type { Request, Response } from 'express';
import type { CreateIssueRequest, EditIssueRequest, AuthenticatedRequest } from '../types';
import { db } from '../db';

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
      const created = await db.issue.create({
        data: {
          title: body.title,
          description: body.description,
          category: body.category,
          location: body.location,
          photo: body.photo ?? null,
          createdBy: authReq.user!.id,
          status: 'pending',
        },
      });

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
    // a citizen  can only update few things in a issue be it title, description, category, location, photo
    try {
      const authReq = req.user ;
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Issue ID is required' });
      }
      type requestForUpdate =  {
        title? : string ,
        description? : string ,
        category? : string ,
        location? : string ,
        photo? : string ,
      }
      const {title , description , category , location , photo} = req.body as requestForUpdate;

      const existing = await db.issue.findUnique({
        where: { id },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Issue not found' });
      }
      if (existing.createdBy !== authReq?.id) {
        return res.status(403).json({ error: 'You can only update your own issues' });
      }

      const updated = await db.issue.update({
        where: { id },
        data: {
          title : title != null ? title : existing.title ,
          description : description != null ? description : existing.description ,
          category : category != null ? category : existing.category ,
          location : location != null ? location : existing.location ,
          photo : photo != null ? photo : existing.photo ,
        }
      });
      return res.json(updated); 
    } catch (error) {
      res.status(500).json({ error: 'Failed to update issue' });
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
      const found = await db.issue.findUnique({
        where: { id },
      });
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
    // this list issues is only getting issues that are submitted by that particular citizen 
    const authReq = req.user ;
    if (!authReq?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    const offset = (page - 1) * limit;

    try {
      const [rows, total] = await Promise.all([
        db.issue.findMany({
          where: {
            createdBy: authReq?.id,
          }, 
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        db.issue.count({
          where: {
            createdBy: authReq?.id,
          },
        }),
      ]);

      return res.json({ issues: rows, total, page, limit });
    } catch (error) {
      console.error('listIssues error:', error);
      return res.status(500).json({ error: 'Failed to list issues' });
    }
  }

  
}

