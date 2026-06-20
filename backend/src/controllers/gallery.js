import cloudinary from '../config/cloudinary.js';
import {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  getGalleryCategories,
} from '../models/gallery.js';

export const getAll = async (req, res) => {
  try {
    const { category, featured } = req.query;
    const items = await getGalleryItems(category || null, featured === 'true');
    res.json(items);
  } catch (err) {
    console.error('Gallery fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
};

export const getCategories = async (req, res) => {
  try {
    const cats = await getGalleryCategories();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

export const getById = async (req, res) => {
  try {
    const item = await getGalleryItemById(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'Gallery item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gallery item' });
  }
};

export const create = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Media file is required' });

    const { title, description, category, featured, sort_order } = req.body;
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';

    const itemId = await createGalleryItem({
      title,
      description,
      media_url: req.file.path,
      public_id: req.file.filename,
      media_type: mediaType,
      category,
      featured: featured === 'true' || featured === '1',
      sort_order: Number(sort_order) || 0,
    });

    res.status(201).json({
      id: itemId,
      media_url: req.file.path,
      message: 'Gallery item added',
    });
  } catch (err) {
    console.error('Gallery upload error:', err.message);
    res.status(500).json({ error: 'Failed to upload gallery item' });
  }
};

export const update = async (req, res) => {
  try {
    const { title, description, category, featured, sort_order } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (featured !== undefined) updates.featured = featured ? 1 : 0;
    if (sort_order !== undefined) updates.sort_order = Number(sort_order);
    await updateGalleryItem(Number(req.params.id), updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update gallery item' });
  }
};

export const remove = async (req, res) => {
  try {
    const publicId = await deleteGalleryItem(Number(req.params.id));
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete gallery item' });
  }
};
