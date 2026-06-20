import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  getSlots,
  create,
  getAll,
  getMy,
  getById,
  cancel,
  verifyPayment,
  retryPayment,
  webhook,
  getPayments,
  updateStatus,
} from '../controllers/booking.js';

const router = Router();

router.get('/slots', getSlots);
router.post('/', authenticate, create);
router.get('/', authenticate, requireRole('admin'), getAll);
router.get('/my', authenticate, getMy);
router.get('/:id', getById);
router.patch('/:id/cancel', authenticate, cancel);
router.post('/verify-payment', verifyPayment);
router.post('/:id/retry-payment', authenticate, retryPayment);
router.post('/webhook', webhook);
router.get('/:id/payments', getPayments);
router.patch('/:id/status', authenticate, requireRole('admin'), updateStatus);

export default router;
