import { getAllItems, getFeaturedItems, getItemById, createItem, updateItem, deleteItem } from '../models/portfolio.js';

export const getAll = async (req, res) => {
  try {
    const { category } = req.query;
    const items = await getAllItems(category || null);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio items' });
  }
};

export const getFeatured = async (req, res) => {
  try {
    const items = await getFeaturedItems();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch featured items' });
  }
};

export const getById = async (req, res) => {
  try {
    const item = await getItemById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Portfolio item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch portfolio item' });
  }
};

export const create = async (req, res) => {
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
};

export const update = async (req, res) => {
  try {
    await updateItem(Number(req.params.id), req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update portfolio item' });
  }
};

export const remove = async (req, res) => {
  try {
    await deleteItem(Number(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete portfolio item' });
  }
};
