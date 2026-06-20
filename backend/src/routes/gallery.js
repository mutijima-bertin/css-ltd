import { Router } from 'express';
import { uploadGallery } from '../services/upload.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getAll, getCategories, getById, create, update, remove } from '../controllers/gallery.js';

const router = Router();

router.get('/', getAll);
router.get('/categories', getCategories);
router.get('/:id', getById);
router.post('/', authenticate, requireRole('admin'), uploadGallery.single('media'), create);
router.patch('/:id', authenticate, requireRole('admin'), update);
router.delete('/:id', authenticate, requireRole('admin'), remove);

export default router;
