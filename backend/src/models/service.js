import pool from '../config/db.js';

export const getAllServices = async () => {
  const conn = await pool.getConnection();
  try {
    return await conn.query(
      'SELECT * FROM services WHERE is_active = TRUE ORDER BY sort_order ASC, created_at DESC'
    );
  } finally {
    conn.release();
  }
};

export const getServiceByCategory = async (category) => {
  const conn = await pool.getConnection();
  try {
    return await conn.query(
      'SELECT * FROM services WHERE category = ? AND is_active = TRUE ORDER BY sort_order ASC',
      [category]
    );
  } finally {
    conn.release();
  }
};

export const createService = async ({ name, description, price, price_unit, category, sort_order }) => {
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(
      `INSERT INTO services (name, description, price, price_unit, category, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
      [name, description, price || null, price_unit || 'RWF', category || null, sort_order || 0]
    );
    return result;
  } finally {
    conn.release();
  }
};
