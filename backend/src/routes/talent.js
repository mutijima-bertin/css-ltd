import { Router } from 'express';
import { uploadDemo } from '../services/upload.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  create,
  getApproved,
  getAll,
  getMy,
  getById,
  updateStatus,
  remove,
} from '../controllers/talent.js';

const router = Router();

router.post('/', authenticate, uploadDemo.fields([{ name: 'demos', maxCount: 5 }, { name: 'profile_picture', maxCount: 1 }]), create);
router.get('/', getApproved);
router.get('/all', authenticate, requireRole('admin'), getAll);
router.get('/my', authenticate, getMy);
router.get('/:id', getById);
router.patch('/:id', authenticate, requireRole('admin'), updateStatus);
router.delete('/:id', authenticate, requireRole('admin'), remove);

export default router;
