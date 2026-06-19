import pool from '../config/db.js';

export const getAllItems = async (category) => {
  const conn = await pool.getConnection();
  try {
    if (category) {
      return await conn.query(
        'SELECT * FROM portfolio_items WHERE category = ? ORDER BY created_at DESC',
        [category]
      );
    }
    return await conn.query('SELECT * FROM portfolio_items ORDER BY created_at DESC');
  } finally {
    conn.release();
  }
};

export const getFeaturedItems = async () => {
  const conn = await pool.getConnection();
  try {
    return await conn.query(
      'SELECT * FROM portfolio_items WHERE is_featured = TRUE ORDER BY created_at DESC'
    );
  } finally {
    conn.release();
  }
};

export const createItem = async ({ title, category, description, media_url, thumbnail_url, youtube_url, is_featured }) => {
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(
      `INSERT INTO portfolio_items (title, category, description, media_url, thumbnail_url, youtube_url, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, category, description || null, media_url, thumbnail_url || null, youtube_url || null, is_featured || false]
    );
    return result;
  } finally {
    conn.release();
  }
};
