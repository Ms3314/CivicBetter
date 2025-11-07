import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

/**
 * Payment Routes
 */
router.use(authenticate);

// Public routes (authenticated users)
router.get('/:paymentId', PaymentController.getPayment);
router.get('/:paymentId/upi-links', PaymentController.getUPILinks);

// Admin only routes
router.use(requireAdmin);

router.post('/create', PaymentController.createPayment);
router.post('/:paymentId/complete', PaymentController.markPaymentComplete);
router.get('/pending', PaymentController.getPendingPayments);
router.get('/', PaymentController.listPayments);

export default router;

