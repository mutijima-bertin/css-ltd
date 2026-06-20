import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getAll, getFeatured, getById, create, update, remove } from '../controllers/portfolio.js';

const router = Router();

router.get('/', getAll);
router.get('/featured', getFeatured);
router.get('/:id', getById);
router.post('/', authenticate, requireRole('admin'), create);
router.patch('/:id', authenticate, requireRole('admin'), update);
router.delete('/:id', authenticate, requireRole('admin'), remove);

export default router;
