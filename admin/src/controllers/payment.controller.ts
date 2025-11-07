import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { db } from '../db';
import { generateUPILink, getAllProviderLinks, validateUPIId, getProviderFromUPIId } from '../utils/upi';

export class PaymentController {
  /**
   * Get UPI payment links for a worker
   * GET /payments/upi-link/:paymentId
   * Returns deep links for all UPI providers
   */
  static async getUPILinks(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      const payment = await (db as any).payment.findUnique({
        where: { id: paymentId },
        include: {
          worker: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
          issue: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (payment.status === 'completed') {
        return res.status(400).json({ error: 'Payment already completed' });
      }

      if (!payment.worker.upiId) {
        return res.status(400).json({
          error: 'Worker UPI ID not set',
          workerId: payment.worker.id,
        });
      }

      // Validate UPI ID
      if (!validateUPIId(payment.worker.upiId)) {
        return res.status(400).json({ error: 'Invalid UPI ID format' });
      }

      const params = {
        upiId: payment.worker.upiId,
        name: payment.worker.user.name,
        amount: payment.amount,
        transactionNote: `Payment for issue: ${payment.issue.title}`,
      };

      const links = getAllProviderLinks(params);
      const provider = getProviderFromUPIId(payment.worker.upiId);

      return res.json({
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
        },
        worker: {
          name: payment.worker.user.name,
          upiId: payment.worker.upiId,
          provider: provider || 'Unknown',
        },
        upiLinks: links,
        instructions: 'Click any link to open your UPI app with pre-filled details. After payment, update the payment status manually.',
      });
    } catch (error: any) {
      console.error('getUPILinks error:', error);
      return res.status(500).json({ error: 'Failed to generate UPI links' });
    }
  }

  /**
   * Mark payment as completed (after manual UPI payment)
   * POST /payments/:paymentId/complete
   * Requires: Admin
   */
  static async markPaymentComplete(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { paymentId } = req.params;
      const { transactionId, screenshotUrl, notes } = req.body as {
        transactionId?: string;
        screenshotUrl?: string;
        notes?: string;
      };

      const payment = await (db as any).payment.findUnique({
        where: { id: paymentId },
        include: {
          worker: true,
        },
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      if (payment.status === 'completed') {
        return res.status(400).json({ error: 'Payment already completed' });
      }

      // Update payment
      const updated = await (db as any).payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          transactionId: transactionId || null,
          screenshotUrl: screenshotUrl || null,
          notes: notes || null,
          processedBy: authReq.user.id,
          processedAt: new Date(),
        },
      });

      // Update worker earnings
      await (db as any).worker.update({
        where: { id: payment.worker.id },
        data: {
          totalEarnings: {
            increment: payment.amount,
          },
        },
      });

      return res.json({
        message: 'Payment marked as completed',
        payment: updated,
      });
    } catch (error: any) {
      console.error('markPaymentComplete error:', error);
      return res.status(500).json({ error: 'Failed to mark payment as complete' });
    }
  }

  /**
   * Create payment record for completed issue (after review)
   * POST /payments/create
   * Requires: Admin
   */
  static async createPayment(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { issueId, amount } = req.body as {
        issueId: string;
        amount: number;
      };

      if (!issueId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid issueId and amount are required' });
      }

      // Get issue with worker
      const issue = await db.issue.findUnique({
        where: { id: issueId },
        include: {
          worker: {
            include: { user: true },
          },
          review: true,
        },
      });

      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      if (issue.status !== 'completed') {
        return res.status(400).json({ error: 'Issue must be completed before payment' });
      }

      if (!issue.worker) {
        return res.status(400).json({ error: 'Issue has no assigned worker' });
      }

      if (!issue.worker.upiId) {
        return res.status(400).json({
          error: 'Worker UPI ID not set. Please update worker profile with UPI ID.',
          workerId: issue.worker.id,
        });
      }

      // Check if review is approved
      if (!issue.review || issue.review.status !== 'approved') {
        return res.status(400).json({
          error: 'Issue must be reviewed and approved before payment',
        });
      }

      // Check if payment already exists
      const existingPayment = await (db as any).payment.findFirst({
        where: {
          issueId,
          status: { in: ['completed', 'pending'] },
        },
      });

      if (existingPayment) {
        return res.status(400).json({
          error: 'Payment already exists',
          paymentId: existingPayment.id,
        });
      }

      // Create payment record
      const payment = await (db as any).payment.create({
        data: {
          issueId,
          workerId: issue.worker.id,
          amount,
          currency: 'INR',
          status: 'pending',
          processedBy: authReq.user.id,
        },
        include: {
          worker: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });

      // Generate UPI link
      const upiLink = generateUPILink({
        upiId: issue.worker.upiId,
        name: issue.worker.user.name,
        amount,
        transactionNote: `Payment for issue: ${issue.title}`,
      });

      return res.json({
        message: 'Payment record created. Use UPI link to make payment.',
        payment,
        upiLink,
        nextSteps: [
          'Click the UPI link to open your UPI app',
          'Complete the payment',
          'Update payment status using /payments/:paymentId/complete',
        ],
      });
    } catch (error: any) {
      console.error('createPayment error:', error);
      return res.status(500).json({ error: 'Failed to create payment' });
    }
  }

  /**
   * Get payment status
   * GET /payments/:paymentId
   */
  static async getPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      const payment = await (db as any).payment.findUnique({
        where: { id: paymentId },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
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
        },
      });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // If pending, include UPI link
      let upiLink = null;
      if (payment.status === 'pending' && payment.worker.upiId) {
        upiLink = generateUPILink({
          upiId: payment.worker.upiId,
          name: payment.worker.user.name,
          amount: payment.amount,
          transactionNote: `Payment for issue: ${payment.issue.title}`,
        });
      }

      return res.json({
        payment,
        upiLink,
      });
    } catch (error: any) {
      console.error('getPayment error:', error);
      return res.status(500).json({ error: 'Failed to fetch payment' });
    }
  }

  /**
   * List payments with filters
   * GET /payments
   */
  static async listPayments(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const skip = (page - 1) * limit;
      const status = req.query.status as string;
      const workerId = req.query.workerId as string;

      const where: any = {};
      if (status) where.status = status;
      if (workerId) where.workerId = workerId;

      const [payments, total] = await Promise.all([
        (db as any).payment.findMany({
          where,
          skip,
          take: limit,
          include: {
            issue: {
              select: {
                id: true,
                title: true,
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
          orderBy: {
            createdAt: 'desc',
          },
        }),
        (db as any).payment.count({ where }),
      ]);

      return res.json({
        payments,
        total,
        page,
        limit,
      });
    } catch (error: any) {
      console.error('listPayments error:', error);
      return res.status(500).json({ error: 'Failed to list payments' });
    }
  }

  /**
   * Get pending payments summary
   * GET /payments/pending
   * Requires: Admin
   */
  static async getPendingPayments(req: Request, res: Response) {
    try {
      const authReq = req as AuthenticatedRequest;
      if (authReq.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const pendingPayments = await (db as any).payment.findMany({
        where: {
          status: 'pending',
        },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
            },
          },
          worker: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const totalPending = pendingPayments.reduce(
        (sum: number, p: any) => sum + p.amount,
        0
      );

      // Generate UPI links for each payment
      const paymentsWithLinks = pendingPayments.map((payment: any) => {
        let upiLinks = null;
        if (payment.worker.upiId) {
          upiLinks = getAllProviderLinks({
            upiId: payment.worker.upiId,
            name: payment.worker.user.name,
            amount: payment.amount,
            transactionNote: `Payment for issue: ${payment.issue.title}`,
          });
        }

        return {
          ...payment,
          upiLinks,
        };
      });

      return res.json({
        totalPending,
        count: pendingPayments.length,
        payments: paymentsWithLinks,
      });
    } catch (error: any) {
      console.error('getPendingPayments error:', error);
      return res.status(500).json({ error: 'Failed to fetch pending payments' });
    }
  }
}
