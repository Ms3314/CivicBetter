import { Router } from 'express';
import { IssueCompletionController } from '../controllers/issue-completion.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

/**
 * Issue Completion Routes
 */
router.use(authenticate);

// Worker can mark as completed
router.post('/issues/:id/complete', IssueCompletionController.markAsCompleted);

// Admin can approve and create payment
router.post('/issues/:id/approve-and-pay', requireAdmin, IssueCompletionController.approveAndPay);

export default router;

