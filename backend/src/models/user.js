import pool from '../config/db.js';

export const findUserByEmail = async (email) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  } finally {
    conn.release();
  }
};

export const findUserById = async (id) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  } finally {
    conn.release();
  }
};

export const createUser = async ({ full_name, email, phone, password_hash, role }) => {
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, phone || null, password_hash, role || 'client']
    );
    return result.insertId;
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new Error('A user with this email already exists');
    }
    throw err;
  } finally {
    conn.release();
  }
};

export const updateUserPassword = async (id, password_hash) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id]);
  } finally {
    conn.release();
  }
};
