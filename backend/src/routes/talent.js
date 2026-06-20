import { Router } from 'express';
import { uploadDemo } from '../services/upload.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  create,
  getApproved,
  getAll,
  getMy,
  getById,
  getEdit,
  update,
  addDemos,
  removeDemo,
  updateStatus,
  remove,
} from '../controllers/talent.js';

const router = Router();

router.post('/', authenticate, uploadDemo.fields([{ name: 'demos', maxCount: 5 }, { name: 'profile_picture', maxCount: 1 }]), create);
router.get('/', getApproved);
router.get('/all', authenticate, requireRole('admin'), getAll);
router.get('/my', authenticate, getMy);
router.put('/:id', authenticate, uploadDemo.fields([{ name: 'profile_picture', maxCount: 1 }]), update);
router.post('/:id/demos', authenticate, uploadDemo.array('demos', 5), addDemos);
router.delete('/:id/demos/:demoId', authenticate, removeDemo);
router.get('/:id/edit', authenticate, getEdit);
router.get('/:id', getById);
router.patch('/:id', authenticate, requireRole('admin'), updateStatus);
router.delete('/:id', authenticate, requireRole('admin'), remove);

export default router;
