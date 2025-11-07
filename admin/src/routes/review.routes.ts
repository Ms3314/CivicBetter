import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

/**
 * Review Routes
 */
router.use(authenticate);

// Admin only routes
router.use(requireAdmin);

router.post('/', ReviewController.createReview);
router.get('/issue/:issueId', ReviewController.getReviewByIssue);
router.get('/', ReviewController.listReviews);

export default router;

