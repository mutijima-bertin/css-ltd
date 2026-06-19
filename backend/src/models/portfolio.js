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

export const getItemById = async (id) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT * FROM portfolio_items WHERE id = ?', [id]);
    return rows[0] || null;
  } finally {
    conn.release();
  }
};

export const updateItem = async (id, updates) => {
  const conn = await pool.getConnection();
  try {
    const fields = [];
    const params = [];
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) { fields.push(`${key} = ?`); params.push(val); }
    }
    if (fields.length === 0) return;
    params.push(id);
    await conn.query(`UPDATE portfolio_items SET ${fields.join(', ')} WHERE id = ?`, params);
  } finally {
    conn.release();
  }
};

export const deleteItem = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('DELETE FROM portfolio_items WHERE id = ?', [id]);
  } finally {
    conn.release();
  }
};
