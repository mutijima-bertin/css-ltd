import { Router } from 'express';
import { authenticate, checkUsername, register, login, getMe, updateMe, setupAdmin, changePassword } from '../controllers/auth.js';

const router = Router();

router.get('/check-username', checkUsername);
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.post('/setup-admin', setupAdmin);
router.post('/change-password', authenticate, changePassword);

export default router;
