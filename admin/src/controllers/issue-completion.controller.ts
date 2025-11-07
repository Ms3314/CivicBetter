import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { db } from '../db';
import { generateUPILink, getAllProviderLinks } from '../utils/upi';

/**
 * Controller for issue completion flow
 * Handles: Worker marking issue as completed -> Admin review -> Payment
 */
export class IssueCompletionController {
  /**
   * Worker marks issue as completed
   * POST /issues/:id/complete
   * Requires: Worker (assigned to issue)
   */
  static async markAsCompleted(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { completionNotes, amount } = req.body as {
        completionNotes?: string;
        amount?: number;
      };

      if (!id) {
        return res.status(400).json({ error: 'Issue ID is required' });
      }

      // Get issue with worker
      const issue = await db.issue.findUnique({
        where: { id },
        include: {
          worker: true,
        },
      });

      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      // Check if worker is assigned
      if (!issue.worker || issue.worker.userId !== authReq.user?.id) {
        return res.status(403).json({ error: 'Only assigned worker can mark as completed' });
      }

      if (issue.status !== 'in_progress') {
        return res.status(400).json({
          error: 'Issue must be in progress to mark as completed',
          currentStatus: issue.status,
        });
      }

      // Update issue
      const updated = await db.issue.update({
        where: { id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          amount: amount || issue.amount || 0,
        },
      });

      // Update worker status to available
      await (db as any).worker.update({
        where: { id: issue.worker.id },
        data: {
          status: 'available',
        },
      });

      return res.json({
        message: 'Issue marked as completed. Awaiting admin review.',
        issue: updated,
      });
    } catch (error: any) {
      console.error('markAsCompleted error:', error);
      return res.status(500).json({ error: 'Failed to mark issue as completed' });
    }
  }

  /**
   * Admin approves completed issue and triggers payment
   * POST /issues/:id/approve-and-pay
   * Requires: Admin
   */
  static async approveAndPay(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;
      const { rating, comment, amount } = req.body as {
        rating?: number;
        comment?: string;
        amount?: number;
      };

      // Get issue
      const issue = await db.issue.findUnique({
        where: { id },
        include: {
          worker: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          review: true,
        },
      });

      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      if (issue.status !== 'completed') {
        return res.status(400).json({ error: 'Issue must be completed first' });
      }

      if (!issue.worker) {
        return res.status(400).json({ error: 'Issue has no assigned worker' });
      }

      const paymentAmount = amount || issue.amount || 0;
      if (paymentAmount <= 0) {
        return res.status(400).json({ error: 'Valid payment amount is required' });
      }

      // Create/update review if rating provided
      if (rating) {
        if (rating < 1 || rating > 5) {
          return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        if (issue.review) {
          await (db as any).review.update({
            where: { issueId: id },
            data: {
              rating,
              comment,
              status: 'approved',
              reviewedAt: new Date(),
            },
          });
        } else {
          await (db as any).review.create({
            data: {
              issueId: id,
              workerId: issue.worker.id,
              reviewerId: authReq.user.id,
              rating,
              comment,
              status: 'approved',
              reviewedAt: new Date(),
            },
          });
        }

        // Update worker rating
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
            rating: Math.round(avgRating * 10) / 10,
          },
        });
      }

      // Create payment record (will be processed separately or can trigger here)
      const payment = await (db as any).payment.create({
        data: {
          issueId: id,
          workerId: issue.worker.id,
          amount: paymentAmount,
          currency: 'INR',
          status: 'pending',
          processedBy: authReq.user.id,
        },
      });

      // Generate UPI link if worker has UPI ID
      let upiLinks = null;
      if (issue.worker.upiId) {
        upiLinks = getAllProviderLinks({
          upiId: issue.worker.upiId,
          name: issue.worker.user.name,
          amount: paymentAmount,
          transactionNote: `Payment for issue: ${issue.title}`,
        });
      }

      return res.json({
        message: 'Issue approved. Payment record created. Use UPI links to make payment.',
        issue: {
          ...issue,
          status: 'completed',
        },
        payment,
        upiLinks,
        nextSteps: [
          'Click any UPI link to open your UPI app',
          'Complete the payment',
          'Update payment status using POST /payments/:paymentId/complete',
        ],
      });
    } catch (error: any) {
      console.error('approveAndPay error:', error);
      return res.status(500).json({ error: 'Failed to approve and create payment' });
    }
  }
}

