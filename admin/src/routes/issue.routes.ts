import { Router } from 'express';
import { IssueController } from '../controllers/issue.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * Issue Routes
 * All routes require authentication
 */
router.use(authenticate);

router.get('/', IssueController.listIssues);
router.post('/', IssueController.createIssue);
router.get('/:id', IssueController.getIssue);
router.put('/:id', IssueController.editIssue);

export default router;

