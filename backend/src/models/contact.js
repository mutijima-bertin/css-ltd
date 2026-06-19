import pool from '../config/db.js';

export const createMessage = async ({ name, email, phone, subject, message }) => {
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(
      `INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone || null, subject || null, message]
    );
    return result;
  } finally {
    conn.release();
  }
};

export const getAllMessages = async () => {
  const conn = await pool.getConnection();
  try {
    return await conn.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
  } finally {
    conn.release();
  }
};

export const markMessageAsRead = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('UPDATE contact_messages SET is_read = TRUE WHERE id = ?', [id]);
  } finally {
    conn.release();
  }
};
