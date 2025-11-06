import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

/**
 * User Routes (Admin only)
 */
router.use(authenticate);
router.use(requireAdmin);

router.get('/', UserController.listUsers);
router.get('/:id', UserController.reviewUser);
router.put('/:id', UserController.updateUser);

export default router;

