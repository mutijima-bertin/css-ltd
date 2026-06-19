import pool from '../config/db.js';

export const getGalleryItems = async (category, featured) => {
  const conn = await pool.getConnection();
  try {
    let sql = 'SELECT * FROM gallery_items WHERE 1=1';
    const params = [];
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (featured) {
      sql += ' AND featured = 1';
    }
    sql += ' ORDER BY sort_order ASC, created_at DESC';
    return await conn.query(sql, params);
  } finally {
    conn.release();
  }
};

export const getGalleryItemById = async (id) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT * FROM gallery_items WHERE id = ?', [id]);
    return rows[0] || null;
  } finally {
    conn.release();
  }
};

export const createGalleryItem = async ({ title, description, media_url, public_id, media_type, category, featured, sort_order }) => {
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(
      `INSERT INTO gallery_items (title, description, media_url, public_id, media_type, category, featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title || null, description || null, media_url, public_id || null, media_type || 'image', category || null, featured ? 1 : 0, sort_order || 0]
    );
    return result.insertId;
  } finally {
    conn.release();
  }
};

export const updateGalleryItem = async (id, updates) => {
  const conn = await pool.getConnection();
  try {
    const fields = [];
    const params = [];
    for (const [key, val] of Object.entries(updates)) {
      if (key === 'featured') val ? 1 : 0;
      fields.push(`${key} = ?`);
      params.push(val);
    }
    if (fields.length === 0) return;
    params.push(id);
    await conn.query(`UPDATE gallery_items SET ${fields.join(', ')} WHERE id = ?`, params);
  } finally {
    conn.release();
  }
};

export const deleteGalleryItem = async (id) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT public_id FROM gallery_items WHERE id = ?', [id]);
    await conn.query('DELETE FROM gallery_items WHERE id = ?', [id]);
    return rows[0]?.public_id || null;
  } finally {
    conn.release();
  }
};

export const getGalleryCategories = async () => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT DISTINCT category FROM gallery_items WHERE category IS NOT NULL ORDER BY category');
    return rows.map((r) => r.category);
  } finally {
    conn.release();
  }
};
