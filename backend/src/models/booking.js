import pool from '../config/db.js';

export const getAvailableSlots = async (date) => {
  const conn = await pool.getConnection();
  try {
    return await conn.query(
      `SELECT * FROM studio_slots WHERE date = ? AND is_available = TRUE ORDER BY start_time`,
      [date]
    );
  } finally {
    conn.release();
  }
};

export const getSlotsForRange = async (startDate, endDate) => {
  const conn = await pool.getConnection();
  try {
    return await conn.query(
      `SELECT date, start_time, end_time, id FROM studio_slots
       WHERE date >= ? AND date <= ? AND is_available = TRUE
       ORDER BY date, start_time`,
      [startDate, endDate]
    );
  } finally {
    conn.release();
  }
};

export const createBooking = async ({ client_name, client_email, client_phone, booking_date, start_time, end_time, duration_hours, amount, deposit_amount }) => {
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(
      `INSERT INTO bookings (client_name, client_email, client_phone, booking_date, start_time, end_time, duration_hours, amount, deposit_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_name, client_email, client_phone, booking_date, start_time, end_time, duration_hours, amount, deposit_amount]
    );

    await conn.query(
      `UPDATE studio_slots SET is_available = FALSE
       WHERE date = ? AND start_time = ? AND end_time = ?`,
      [booking_date, start_time, end_time]
    );

    return result.insertId;
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

export const createPaymentRecord = async ({ booking_id, transaction_ref, amount, currency, provider, status }) => {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `INSERT INTO payments (booking_id, transaction_ref, amount, currency, provider, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [booking_id, transaction_ref, amount, currency, provider || null, status]
    );
  } finally {
    conn.release();
  }
};

export const markSlotAvailable = async (date, startTime, endTime) => {
  const conn = await pool.getConnection();
  try {
    await conn.query(
      `UPDATE studio_slots SET is_available = TRUE WHERE date = ? AND start_time = ? AND end_time = ?`,
      [date, startTime, endTime]
    );
  } finally {
    conn.release();
  }
};

export const getBookingByTransactionRef = async (transactionRef) => {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query('SELECT * FROM payments WHERE transaction_ref = ?', [transactionRef]);
    if (rows.length === 0) return null;
    const booking = await conn.query('SELECT * FROM bookings WHERE id = ?', [rows[0].booking_id]);
    return booking[0] || null;
  } finally {
    conn.release();
  }
};
