import { Router } from 'express';
import { getAllItems, getFeaturedItems, createItem } from '../models/portfolio.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const items = await getAllItems(category || null);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio items' });
  }
});

router.get('/featured', async (req, res) => {
  try {
    const items = await getFeaturedItems();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch featured items' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, category, description, media_url, thumbnail_url, youtube_url, is_featured } = req.body;
    if (!title || !category || !media_url) {
      return res.status(400).json({ error: 'Title, category, and media_url are required' });
    }
    await createItem({ title, category, description, media_url, thumbnail_url, youtube_url, is_featured });
    res.status(201).json({ success: true, message: 'Portfolio item created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create portfolio item' });
  }
});

export default router;
