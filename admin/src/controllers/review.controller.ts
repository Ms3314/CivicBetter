import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { db } from '../db';

export class ReviewController {
  /**
   * Create/Update review for completed issue
   * POST /reviews
   * Requires: Admin
   */
  static async createReview(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { issueId, rating, comment } = req.body as {
        issueId: string;
        rating: number;
        comment?: string;
      };

      if (!issueId || !rating) {
        return res.status(400).json({ error: 'issueId and rating are required' });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }

      // Get issue
      const issue = await db.issue.findUnique({
        where: { id: issueId },
        include: {
          worker: true,
        },
      });

      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      if (issue.status !== 'completed') {
        return res.status(400).json({ error: 'Issue must be completed before review' });
      }

      if (!issue.worker) {
        return res.status(400).json({ error: 'Issue has no assigned worker' });
      }

      // Check if review exists
      const existingReview = await (db as any).review.findUnique({
        where: { issueId },
      });

      let review;
      if (existingReview) {
        // Update existing review
        review = await (db as any).review.update({
          where: { issueId },
          data: {
            rating,
            comment,
            status: 'approved',
            reviewedAt: new Date(),
          },
        });
      } else {
        // Create new review
        review = await (db as any).review.create({
          data: {
            issueId,
            workerId: issue.worker.id,
            reviewerId: authReq.user.id,
            rating,
            comment,
            status: 'approved',
            reviewedAt: new Date(),
          },
        });
      }

      // Update worker rating (average of all reviews)
      const allReviews = await (db as any).review.findMany({
        where: {
          workerId: issue.worker.id,
          status: 'approved',
        },
        select: { rating: true },
      });

      const avgRating =
        allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;

      await (db as any).worker.update({
        where: { id: issue.worker.id },
        data: {
          rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        },
      });

      return res.json({
        message: 'Review created successfully',
        review,
      });
    } catch (error: any) {
      console.error('createReview error:', error);
      return res.status(500).json({ error: 'Failed to create review' });
    }
  }

  /**
   * Get review for an issue
   * GET /reviews/issue/:issueId
   */
  static async getReviewByIssue(req: Request, res: Response) {
    try {
      const { issueId } = req.params;

      const review = await (db as any).review.findUnique({
        where: { issueId },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          worker: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      return res.json({ review });
    } catch (error: any) {
      console.error('getReviewByIssue error:', error);
      return res.status(500).json({ error: 'Failed to fetch review' });
    }
  }

  /**
   * List reviews with filters
   * GET /reviews
   */
  static async listReviews(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const skip = (page - 1) * limit;
      const workerId = req.query.workerId as string;
      const status = req.query.status as string;

      const where: any = {};
      if (workerId) where.workerId = workerId;
      if (status) where.status = status;

      const [reviews, total] = await Promise.all([
        (db as any).review.findMany({
          where,
          skip,
          take: limit,
          include: {
            issue: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
            reviewer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            reviewedAt: 'desc',
          },
        }),
        (db as any).review.count({ where }),
      ]);

      return res.json({
        reviews,
        total,
        page,
        limit,
      });
    } catch (error: any) {
      console.error('listReviews error:', error);
      return res.status(500).json({ error: 'Failed to list reviews' });
    }
  }
}

