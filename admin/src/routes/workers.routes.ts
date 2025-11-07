import { Router } from 'express';
import { WorkersController } from '../controllers/workers.controllers';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

/**
 * Workers Routes
 * All routes require authentication
 */
router.use(authenticate);

/**
 * @swagger
 * /workers:
 *   get:
 *     summary: List all workers with pagination
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of workers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkerListResponse'
 *       500:
 *         description: Failed to fetch workers
 */
router.get('/', WorkersController.getWorkers);

/**
 * @swagger
 * /workers/available:
 *   get:
 *     summary: Get available workers (not busy, no active assignments)
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available workers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Worker'
 *       500:
 *         description: Failed to fetch available workers
 */
router.get('/available', WorkersController.getWorkersByAvailability);

/**
 * @swagger
 * /workers/by-role:
 *   get:
 *     summary: Get workers by user role
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [citizen, worker, admin]
 *         description: User role to filter by
 *     responses:
 *       200:
 *         description: List of workers with specified role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Worker'
 *       400:
 *         description: Role parameter is required
 *       500:
 *         description: Failed to fetch workers by role
 */
router.get('/by-role', WorkersController.getWorkersByRole);

/**
 * @swagger
 * /workers/by-status:
 *   get:
 *     summary: Get workers by status
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [available, busy, offline, on_leave]
 *         description: Worker status to filter by
 *     responses:
 *       200:
 *         description: List of workers with specified status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Worker'
 *       400:
 *         description: Status parameter is required
 *       500:
 *         description: Failed to fetch workers by status
 */
router.get('/by-status', WorkersController.getWorkersByStatus);

/**
 * @swagger
 * /workers/by-tag:
 *   get:
 *     summary: Get workers by specialization tag
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tag
 *         required: true
 *         schema:
 *           type: string
 *         description: Specialization tag (e.g., plumbing, electrical)
 *     responses:
 *       200:
 *         description: List of workers with matching tag
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Worker'
 *                 tag:
 *                   type: string
 *       400:
 *         description: Tag parameter is required
 *       500:
 *         description: Failed to fetch workers by tag
 */
router.get('/by-tag', WorkersController.getWorkersByTag);

/**
 * @swagger
 * /workers/by-location:
 *   get:
 *     summary: Get workers by location
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: location
 *         required: true
 *         schema:
 *           type: string
 *         description: Location to search for
 *     responses:
 *       200:
 *         description: List of workers in specified location
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Worker'
 *                 location:
 *                   type: string
 *       400:
 *         description: Location parameter is required
 *       500:
 *         description: Failed to fetch workers by location
 */
router.get('/by-location', WorkersController.getWorkersByLocation);

/**
 * @swagger
 * /workers/by-issue:
 *   get:
 *     summary: Get workers that can handle a specific issue (based on tags/category)
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: issueId
 *         required: true
 *         schema:
 *           type: string
 *         description: Issue ID to find matching workers for
 *     responses:
 *       200:
 *         description: List of workers that can handle the issue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Worker'
 *                 issueId:
 *                   type: string
 *                 matchedTags:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: issueId parameter is required
 *       404:
 *         description: Issue not found
 *       500:
 *         description: Failed to fetch workers by issue
 */
router.get('/by-issue', WorkersController.getWorkersByIssue);

/**
 * @swagger
 * /workers/{id}:
 *   get:
 *     summary: Get worker by ID
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID
 *     responses:
 *       200:
 *         description: Worker details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Worker'
 *       404:
 *         description: Worker not found
 */
router.get('/:id', WorkersController.getWorkerById);

/**
 * @swagger
 * /workers/{id}:
 *   put:
 *     summary: Update worker profile
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateWorkerRequest'
 *     responses:
 *       200:
 *         description: Worker updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Worker'
 *       403:
 *         description: Forbidden - Only worker can update own profile or admin
 *       404:
 *         description: Worker not found
 *       500:
 *         description: Failed to update worker
 */
router.put('/:id', WorkersController.updateWorker);

/**
 * @swagger
 * /workers/{id}:
 *   delete:
 *     summary: Delete worker (with checks for active assignments)
 *     tags: [Workers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID
 *     responses:
 *       200:
 *         description: Worker deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Worker deleted successfully
 *       400:
 *         description: Cannot delete worker with active assignments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 activeIssues:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Worker not found
 *       500:
 *         description: Failed to delete worker
 */
router.delete('/:id', WorkersController.deleteWorker);

// Admin only routes for assignment
router.use(requireAdmin);

/**
 * @swagger
 * /workers/{workerId}/assign:
 *   post:
 *     summary: Assign issue to worker
 *     tags: [Workers, Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Worker ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [issueId]
 *             properties:
 *               issueId:
 *                 type: string
 *                 description: Issue ID to assign
 *     responses:
 *       200:
 *         description: Issue assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Issue'
 *       400:
 *         description: issueId is required or invalid
 *       404:
 *         description: Worker or issue not found
 *       500:
 *         description: Failed to assign worker
 */
router.post('/:workerId/assign', WorkersController.assignToWorker);

/**
 * @swagger
 * /workers/auto-assign:
 *   post:
 *     summary: Auto-assign worker to issue using round-robin method
 *     tags: [Workers, Assignments]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Automatically assigns a worker to an issue using round-robin algorithm:
 *       - Finds available workers matching issue tags/category
 *       - Selects worker with least total jobs (fair distribution)
 *       - Falls back to highest rated worker if tied
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [issueId]
 *             properties:
 *               issueId:
 *                 type: string
 *                 description: Issue ID to auto-assign
 *     responses:
 *       200:
 *         description: Worker auto-assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Worker assigned successfully
 *                 worker:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     userId: { type: string }
 *                 issue:
 *                   $ref: '#/components/schemas/Issue'
 *       400:
 *         description: issueId is required
 *       404:
 *         description: Issue not found or no available workers
 *       500:
 *         description: Failed to auto-assign worker
 */
router.post('/auto-assign', WorkersController.autoAssign);

export default router;

