import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail, findUserByUsername, findUserByEmailOrUsername, findUserById, updateUserPassword, updateUser } from '../models/user.js';
import { authenticate } from '../middleware/auth.js';

export { authenticate };

export const checkUsername = async (req, res) => {
  const { q } = req.query;
  if (!q || typeof q !== 'string' || q.length < 2) {
    return res.json({ available: false });
  }
  try {
    const existing = await findUserByUsername(q.trim());
    res.json({ available: !existing });
  } catch {
    res.json({ available: false });
  }
};

export const register = async (req, res) => {
  try {
    const { full_name, username, email, phone, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (username) {
      const existingUsername = await findUserByUsername(username.trim());
      if (existingUsername) {
        return res.status(409).json({ error: 'This username is already taken' });
      }
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
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required' });
    }

    const user = await findUserByEmailOrUsername(email);
    if (!user) {
      return res.status(401).json({ error: 'We couldn\'t find an account with that email/username. Check your credentials or create a new account.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password. Double-check your password or reset it.' });
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
};

export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

export const updateMe = async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    await updateUser(req.user.id, { full_name, phone });
    const updated = await findUserById(req.user.id);
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const setupAdmin = async (req, res) => {
  try {
    const setupKey = req.headers['x-setup-key'];
    if (!setupKey || setupKey !== process.env.SETUP_SECRET) {
      return res.status(403).json({ error: 'Forbidden' });
    }

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
};

export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await findUserByEmailOrUsername(req.user.email);
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const password_hash = await bcrypt.hash(new_password, 10);
    await updateUserPassword(req.user.id, password_hash);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
