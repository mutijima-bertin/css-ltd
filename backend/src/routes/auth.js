import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, findUserByEmailOrUsername, findUserById, updateUserPassword, updateUser } from '../models/user.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { full_name, username, email, phone, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userId = await createUser({ full_name, username, email, phone, password_hash, role: 'client' });

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.status(201).json({
      token,
      user: { id: userId, full_name, username, email, phone, role: 'client' },
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    if (err.message.includes('already exists')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required' });
    }

    const user = await findUserByEmailOrUsername(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email/username or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.json({
      token,
      user: { id: user.id, full_name: user.full_name, username: user.username, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

router.patch('/me', authenticate, async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    await updateUser(req.user.id, { full_name, phone });
    const updated = await findUserById(req.user.id);
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/setup-admin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      const password_hash = await bcrypt.hash(password, 10);
      await updateUserPassword(existing.id, password_hash);
      return res.json({ message: 'Admin password updated' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const userId = await createUser({ full_name: 'Admin', email, phone: null, password_hash, role: 'admin' });
    res.json({ message: 'Admin user created', userId });
  } catch (err) {
    res.status(500).json({ error: 'Admin setup failed' });
  }
});

export default router;
