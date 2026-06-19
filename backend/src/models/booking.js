import pool from '../config/db.js';

const toYMD = (v) => {
  if (!v) return v;
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const d = v instanceof Date ? v : new Date(v);
  if (!isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return String(v).slice(0, 10);
};

const toHMS = (v) => {
  if (!v) return v;
  if (typeof v === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(v)) return v;
  const d = v instanceof Date ? v : new Date(v);
  if (!isNaN(d.getTime())) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  return String(v).slice(0, 8);
};

const formatSlotDates = (rows) =>
  (rows || []).map((r) => ({
    ...r,
    date: toYMD(r.date),
    start_time: toHMS(r.start_time),
    end_time: toHMS(r.end_time),
  }));

const ACTIVE_STATUSES = ["'pending'", "'confirmed'"];

export const getAvailableSlots = async (date) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(
      `SELECT s.* FROM studio_slots s
       WHERE s.date = ?
       AND NOT EXISTS (
         SELECT 1 FROM bookings b
         WHERE b.booking_date = s.date
         AND b.start_time < s.end_time
         AND b.end_time > s.start_time
         AND b.status IN (${ACTIVE_STATUSES.join(',')})
       )
       ORDER BY s.start_time`,
      [date]
    );
    return formatSlotDates(rows);
  } finally {
    conn.release();
  }
};

export const getSlotsForRange = async (startDate, endDate) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(
      `SELECT s.date, s.start_time, s.end_time, s.id FROM studio_slots s
       WHERE s.date >= ? AND s.date <= ?
       AND NOT EXISTS (
         SELECT 1 FROM bookings b
         WHERE b.booking_date = s.date
         AND b.start_time < s.end_time
         AND b.end_time > s.start_time
         AND b.status IN (${ACTIVE_STATUSES.join(',')})
       )
       ORDER BY s.date, s.start_time`,
      [startDate, endDate]
    );
    return formatSlotDates(rows);
  } finally {
    conn.release();
  }
};

export const createBooking = async ({ user_id, client_name, client_email, client_phone, country_code, booking_date, start_time, end_time, duration_hours, amount, deposit_amount }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const overlapping = await conn.query(
      `SELECT COUNT(*) as cnt FROM bookings
       WHERE booking_date = ?
       AND start_time < ?
       AND end_time > ?
       AND status IN (${ACTIVE_STATUSES.join(',')})`,
      [booking_date, end_time, start_time]
    );

    if (Number(overlapping[0].cnt) > 0) {
      throw new Error('This time slot has already been booked');
    }

    const result = await conn.query(
      `INSERT INTO bookings (user_id, client_name, client_email, client_phone, country_code, booking_date, start_time, end_time, duration_hours, amount, deposit_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, client_name, client_email, client_phone, country_code || '250', booking_date, start_time, end_time, duration_hours, amount, deposit_amount]
    );

    await conn.commit();
    return result.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

export const getBookingById = async (id) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT * FROM bookings WHERE id = ?', [id]);
    return rows[0] || null;
  } finally {
    conn.release();
  }
};

export const getAllBookings = async () => {
  const conn = await pool.getConnection();
  try {
    return await conn.query('SELECT * FROM bookings ORDER BY booking_date DESC, start_time DESC');
  } finally {
    conn.release();
  }
};

export const updateBookingPayment = async (id, { payment_reference, payment_status, deposit_paid }) => {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `UPDATE bookings SET payment_reference = ?, payment_status = ?, deposit_paid = ?, status = ? WHERE id = ?`,
      [payment_reference, payment_status, deposit_paid, deposit_paid ? 'confirmed' : 'pending', id]
    );
  } finally {
    conn.release();
  }
};

export const getBookingsByEmail = async (email) => {
  const conn = await pool.getConnection();
  try {
    return await conn.query(
      'SELECT * FROM bookings WHERE client_email = ? ORDER BY booking_date DESC, start_time DESC',
      [email]
    );
  } finally {
    conn.release();
  }
};

export const cancelBooking = async (id, userId) => {
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = ? AND (user_id = ? OR ? IS NULL)`,
      [id, userId, userId]
    );
    return result.affectedRows > 0;
  } finally {
    conn.release();
  }
};

export const getPaymentsByBookingId = async (bookingId) => {
  const conn = await pool.getConnection();
  try {
    return await conn.query(
      'SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC',
      [bookingId]
    );
  } finally {
    conn.release();
  }
};

export const upsertPaymentRecord = async ({ booking_id, transaction_ref, charge_id, amount, currency, provider, status, flw_response }) => {
  const conn = await pool.getConnection();
  try {
    const existing = await conn.query('SELECT id FROM payments WHERE transaction_ref = ?', [transaction_ref]);
    if (existing.length > 0) {
      await conn.query(
        `UPDATE payments SET charge_id = ?, amount = ?, currency = ?, status = ?, flw_response = ? WHERE transaction_ref = ?`,
        [charge_id || null, amount, currency || 'RWF', status || 'successful', flw_response || null, transaction_ref]
      );
    } else if (booking_id) {
      await conn.query(
        `INSERT INTO payments (booking_id, transaction_ref, charge_id, amount, currency, provider, status, flw_response)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [booking_id, transaction_ref, charge_id || null, amount, currency || 'RWF', provider || 'flutterwave', status || 'successful', flw_response || null]
      );
    }
  } finally {
    conn.release();
  }
};

export const updateBookingStatus = async (id, { status, admin_notes }) => {
  const conn = await pool.getConnection();
  try {
    const fields = [];
    const params = [];
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (admin_notes !== undefined) { fields.push('notes = ?'); params.push(admin_notes); }
    if (fields.length === 0) return;
    params.push(id);
    await conn.query(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, params);
  } finally {
    conn.release();
  }
};

export const getBookingByTransactionRef = async (transactionRef) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT * FROM payments WHERE transaction_ref = ?', [transactionRef]);
    if (rows.length > 0) {
      const booking = await conn.query('SELECT * FROM bookings WHERE id = ?', [rows[0].booking_id]);
      return booking[0] || null;
    }
    const match = String(transactionRef).match(/^CSS-(\d+)-/);
    if (match) {
      const booking = await conn.query('SELECT * FROM bookings WHERE id = ?', [Number(match[1])]);
      return booking[0] || null;
    }
    return null;
  } finally {
    conn.release();
  }
};
