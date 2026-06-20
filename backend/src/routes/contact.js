import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getAll, create, markRead } from '../controllers/contact.js';

const router = Router();

router.get('/', authenticate, requireRole('admin'), getAll);
router.post('/', create);
router.patch('/:id/read', authenticate, requireRole('admin'), markRead);

export default router;
