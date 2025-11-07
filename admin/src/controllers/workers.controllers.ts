import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { db } from '../db';
import { Prisma } from '@prisma/client';

export class WorkersController {
  /**
   * Get worker by ID
   * GET /workers/:id
   */
  static async getWorkerById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const worker = await (db as any).worker.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedIssues: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      return res.json(worker);
    } catch (error) {
      console.error('getWorkerById error:', error);
      return res.status(500).json({ error: 'Failed to fetch worker' });
    }
  }

  /**
   * Get all workers with pagination
   * GET /workers
   */
  static async getWorkers(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const skip = (page - 1) * limit;

      const [workers, total] = await Promise.all([
        (db as any).worker.findMany({
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            assignedIssues: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        (db as any).worker.count(),
      ]);

      return res.json({
        workers,
        total,
        page,
        limit,
      });
    } catch (error) {
      console.error('getWorkers error:', error);
      return res.status(500).json({ error: 'Failed to fetch workers' });
    }
  }

  /**
   * Update worker profile
   * PUT /workers/:id
   */
  static async updateWorker(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authReq = req as AuthenticatedRequest;
      const body = req.body as {
        description?: string;
        tags?: string[];
        location?: string;
        status?: 'available' | 'busy' | 'offline' | 'on_leave';
        phone?: string;
        organizationName?: string;
        type?: 'individual' | 'organization';
        upiId?: string;
        bankAccount?: string;
        panCard?: string;
      };

      // Check if worker exists and user owns it
      const worker = await (db as any).worker.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      // Only worker can update their own profile (unless admin)
      if (worker.userId !== authReq.user?.id && authReq.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const updated = await (db as any).worker.update({
        where: { id },
        data: {
          description: body.description,
          tags: body.tags,
          location: body.location,
          status: body.status,
          phone: body.phone,
          organizationName: body.organizationName,
          type: body.type,
          upiId: body.upiId,
          bankAccount: body.bankAccount,
          panCard: body.panCard,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.json(updated);
    } catch (error) {
      console.error('updateWorker error:', error);
      return res.status(500).json({ error: 'Failed to update worker' });
    }
  }

  /**
   * Delete worker (with checks for assigned work)
   * DELETE /workers/:id
   */
  static async deleteWorker(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const worker = await (db as any).worker.findUnique({
        where: { id },
        include: {
          assignedIssues: {
            where: {
              status: {
                in: ['assigned', 'accepted', 'in_progress'],
              },
            },
          },
        },
      });

      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      // Check if worker has active assignments
      if (worker.assignedIssues.length > 0) {
        return res.status(400).json({
          error: 'Cannot delete worker with active assignments',
          activeIssues: worker.assignedIssues.map((issue: any) => ({
            id: issue.id,
            title: issue.title,
            status: issue.status,
          })),
        });
      }

      await (db as any).worker.delete({
        where: { id },
      });

      return res.json({ message: 'Worker deleted successfully' });
    } catch (error) {
      console.error('deleteWorker error:', error);
      return res.status(500).json({ error: 'Failed to delete worker' });
    }
  }

  /**
   * Get workers by role (filter by user role)
   * GET /workers/by-role?role=worker
   */
  static async getWorkersByRole(req: Request, res: Response) {
    try {
      const role = req.query.role as string;
      if (!role) {
        return res.status(400).json({ error: 'Role parameter is required' });
      }

      const workers = await (db as any).worker.findMany({
        where: {
          user: {
            role: role as any,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return res.json({ workers });
    } catch (error) {
      console.error('getWorkersByRole error:', error);
      return res.status(500).json({ error: 'Failed to fetch workers by role' });
    }
  }

  /**
   * Get workers by status
   * GET /workers/by-status?status=available
   */
  static async getWorkersByStatus(req: Request, res: Response) {
    try {
      const status = req.query.status as 'available' | 'busy' | 'offline' | 'on_leave';
      if (!status) {
        return res.status(400).json({ error: 'Status parameter is required' });
      }

      const workers = await (db as any).worker.findMany({
        where: { status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.json({ workers });
    } catch (error) {
      console.error('getWorkersByStatus error:', error);
      return res.status(500).json({ error: 'Failed to fetch workers by status' });
    }
  }

  /**
   * Assign issue to worker
   * POST /workers/:workerId/assign
   */
  static async assignToWorker(req: Request, res: Response) {
    try {
      const { workerId } = req.params;
      const { issueId } = req.body as { issueId: string };

      if (!issueId) {
        return res.status(400).json({ error: 'issueId is required' });
      }

      // Check worker exists
      const worker = await (db as any).worker.findUnique({
        where: { id: workerId },
        include: { user: true },
      });

      if (!worker) {
        return res.status(404).json({ error: 'Worker not found' });
      }

      // Check issue exists
      const issue = await db.issue.findUnique({
        where: { id: issueId },
      });

      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      // Update issue with worker assignment
      const updatedIssue = await db.issue.update({
        where: { id: issueId },
        data: {
          assignedTo: worker.userId,
          status: 'assigned',
        } as any,
      });

      // Update worker status if available
      if (worker.status === 'available') {
        await (db as any).worker.update({
          where: { id: workerId },
          data: { status: 'busy' },
        });
      }

      return res.json(updatedIssue);
    } catch (error) {
      console.error('assignToWorker error:', error);
      return res.status(500).json({ error: 'Failed to assign worker' });
    }
  }

  /**
   * Get workers by tag
   * GET /workers/by-tag?tag=plumbing
   */
  static async getWorkersByTag(req: Request, res: Response) {
    try {
      const tag = req.query.tag as string;
      if (!tag) {
        return res.status(400).json({ error: 'Tag parameter is required' });
      }

      const workers = await (db as any).worker.findMany({
        where: {
          tags: {
            has: tag,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.json({ workers, tag });
    } catch (error) {
      console.error('getWorkersByTag error:', error);
      return res.status(500).json({ error: 'Failed to fetch workers by tag' });
    }
  }

  /**
   * Get workers by issue (workers that can handle this issue based on tags)
   * GET /workers/by-issue?issueId=xxx
   */
  static async getWorkersByIssue(req: Request, res: Response) {
    try {
      const { issueId } = req.query;
      if (!issueId) {
        return res.status(400).json({ error: 'issueId parameter is required' });
      }

      const issue = await db.issue.findUnique({
        where: { id: issueId as string },
        select: { category: true },
      });

      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      // Find workers whose tags match issue category
      const searchTags = [issue.category].filter(Boolean);

      const workers = await (db as any).worker.findMany({
        where: {
          OR: [
            {
              tags: {
                hasSome: searchTags,
              },
            },
            {
              status: 'available',
            },
          ],
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          rating: 'desc',
        },
      });

      return res.json({ workers, issueId, matchedTags: searchTags });
    } catch (error) {
      console.error('getWorkersByIssue error:', error);
      return res.status(500).json({ error: 'Failed to fetch workers by issue' });
    }
  }

  /**
   * Get workers by location
   * GET /workers/by-location?location=New York
   */
  static async getWorkersByLocation(req: Request, res: Response) {
    try {
      const location = req.query.location as string;
      if (!location) {
        return res.status(400).json({ error: 'Location parameter is required' });
      }

      const workers = await (db as any).worker.findMany({
        where: {
          location: {
            contains: location,
            mode: 'insensitive',
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return res.json({ workers, location });
    } catch (error) {
      console.error('getWorkersByLocation error:', error);
      return res.status(500).json({ error: 'Failed to fetch workers by location' });
    }
  }

  /**
   * Get available workers (not busy)
   * GET /workers/available
   */
  static async getWorkersByAvailability(req: Request, res: Response) {
    try {
      const workers = await (db as any).worker.findMany({
        where: {
          status: 'available',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedIssues: {
            where: {
              status: {
                in: ['assigned', 'accepted', 'in_progress'],
              },
            },
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          rating: 'desc',
        },
      });

      // Filter out workers with active assignments
      const availableWorkers = workers.filter((w: any) => w.assignedIssues.length === 0);

      return res.json({ workers: availableWorkers });
    } catch (error) {
      console.error('getWorkersByAvailability error:', error);
      return res.status(500).json({ error: 'Failed to fetch available workers' });
    }
  }

  /**
   * Auto assign worker to issue using round-robin
   * POST /workers/auto-assign
   */
  static async autoAssign(req: Request, res: Response) {
    try {
      const { issueId } = req.body as { issueId: string };
      if (!issueId) {
        return res.status(400).json({ error: 'issueId is required' });
      }

      const issue = await db.issue.findUnique({
        where: { id: issueId },
        select: { category: true, id: true },
      });

      if (!issue) {
        return res.status(404).json({ error: 'Issue not found' });
      }

      // Find available workers matching tags
      const searchTags = [issue.category].filter(Boolean);

      const availableWorkers = await (db as any).worker.findMany({
        where: {
          status: 'available',
          OR: searchTags.length > 0
            ? [
                {
                  tags: {
                    hasSome: searchTags,
                  },
                },
              ]
            : undefined,
        },
        include: {
          assignedIssues: {
            where: {
              status: {
                in: ['assigned', 'accepted', 'in_progress'],
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [
          { totalJobs: 'asc' }, // Round-robin: assign to worker with least jobs
          { rating: 'desc' }, // Then by rating
        ],
      });

      // Filter workers with no active assignments
      const freeWorkers = availableWorkers.filter((w: any) => w.assignedIssues.length === 0);

      if (freeWorkers.length === 0) {
        return res.status(404).json({ error: 'No available workers found' });
      }

      // Round-robin: pick worker with least total jobs
      const selectedWorker = freeWorkers[0];

      // Assign issue
      const updatedIssue = await db.issue.update({
        where: { id: issueId },
        data: {
          assignedTo: selectedWorker.userId,
          status: 'assigned',
        } as any,
      });

      // Update worker
      await (db as any).worker.update({
        where: { id: selectedWorker.id },
        data: {
          status: 'busy',
          totalJobs: {
            increment: 1,
          },
        },
      });

      return res.json({
        message: 'Worker assigned successfully',
        worker: {
          id: selectedWorker.id,
          name: selectedWorker.user.name,
          userId: selectedWorker.userId,
        },
        issue: updatedIssue,
      });
    } catch (error) {
      console.error('autoAssign error:', error);
      return res.status(500).json({ error: 'Failed to auto-assign worker' });
    }
  }
}
