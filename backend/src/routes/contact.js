import { Router } from 'express';
import { createMessage, getAllMessages, markMessageAsRead } from '../models/contact.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const messages = await getAllMessages();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    await createMessage({ name, email, phone, subject, message });
    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.patch('/:id/read', authenticate, requireRole('admin'), async (req, res) => {
  try {
    await markMessageAsRead(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

export default router;
