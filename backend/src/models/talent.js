import pool from '../config/db.js';

export const createTalentProfile = async ({ full_name, email, phone, country_code, location, bio, profile_picture, skill_tags, social_links, portfolio_links }) => {
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(
      `INSERT INTO talent_profiles (full_name, email, phone, country_code, location, bio, profile_picture, skill_tags, social_links, portfolio_links)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email,
        phone,
        country_code || '250',
        location || null,
        bio || null,
        profile_picture || null,
        skill_tags ? JSON.stringify(skill_tags) : null,
        social_links ? JSON.stringify(social_links) : null,
        portfolio_links ? JSON.stringify(portfolio_links) : null,
      ]
    );
    return result.insertId;
  } finally {
    conn.release();
  }
};

export const addDemoFile = async ({ talent_id, file_url, file_type, title }) => {
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(
      `INSERT INTO talent_demos (talent_id, file_url, file_type, title)
       VALUES (?, ?, ?, ?)`,
      [talent_id, file_url, file_type || null, title || null]
    );
    return result.insertId;
  } finally {
    conn.release();
  }
};

export const getApprovedTalentProfiles = async () => {
  const conn = await pool.getConnection();
  try {
    const profiles = await conn.query(
      `SELECT * FROM talent_profiles WHERE status = 'approved' ORDER BY created_at DESC`
    );
    for (const p of profiles) {
      p.demos = await conn.query(
        `SELECT * FROM talent_demos WHERE talent_id = ? ORDER BY created_at DESC`,
        [p.id]
      );
    }
    return profiles;
  } finally {
    conn.release();
  }
};

export const getAllTalentProfiles = async () => {
  const conn = await pool.getConnection();
  try {
    const profiles = await conn.query(
      `SELECT * FROM talent_profiles ORDER BY created_at DESC`
    );
    for (const p of profiles) {
      p.demos = await conn.query(
        `SELECT * FROM talent_demos WHERE talent_id = ? ORDER BY created_at DESC`,
        [p.id]
      );
    }
    return profiles;
  } finally {
    conn.release();
  }
};

export const getTalentProfileById = async (id) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT * FROM talent_profiles WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const profile = rows[0];
    profile.demos = await conn.query(
      `SELECT * FROM talent_demos WHERE talent_id = ? ORDER BY created_at DESC`,
      [id]
    );
    return profile;
  } finally {
    conn.release();
  }
};

export const updateTalentStatus = async (id, { status, admin_notes }) => {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `UPDATE talent_profiles SET status = ?, admin_notes = ? WHERE id = ?`,
      [status, admin_notes || null, id]
    );
  } finally {
    conn.release();
  }
};

export const deleteTalentProfile = async (id) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('DELETE FROM talent_profiles WHERE id = ?', [id]);
  } finally {
    conn.release();
  }
};

export const updateTalentProfile = async (id, data) => {
  const conn = await pool.getConnection();
  try {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value !== undefined ? value : null);
    }
    values.push(id);
    await conn.query(
      `UPDATE talent_profiles SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  } finally {
    conn.release();
  }
};

export const getDemoById = async (demoId) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT * FROM talent_demos WHERE id = ?', [demoId]);
    return rows.length > 0 ? rows[0] : null;
  } finally {
    conn.release();
  }
};

export const deleteDemoFile = async (demoId) => {
  const conn = await pool.getConnection();
  try {
    await conn.query('DELETE FROM talent_demos WHERE id = ?', [demoId]);
  } finally {
    conn.release();
  }
};

export const getTalentByEmail = async (email) => {
  const conn = await pool.getConnection();
  try {
    const profiles = await conn.query(
      'SELECT * FROM talent_profiles WHERE email = ? ORDER BY created_at DESC',
      [email]
    );
    for (const p of profiles) {
      p.demos = await conn.query(
        'SELECT * FROM talent_demos WHERE talent_id = ? ORDER BY created_at DESC',
        [p.id]
      );
    }
    return profiles;
  } finally {
    conn.release();
  }
};
