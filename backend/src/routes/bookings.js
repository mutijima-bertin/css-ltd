import { Router } from 'express';
import crypto from 'crypto';
import {
  getAvailableSlots,
  getSlotsForRange,
  createBooking,
  getBookingById,
  getAllBookings,
  updateBookingPayment,
  createPaymentRecord,
  getBookingByTransactionRef,
  getBookingsByEmail,
} from '../models/booking.js';
import { initiatePayment, verifyTransaction } from '../services/flutterwave.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

const BOOKING_PRICES = {
  2: 50000,
  4: 90000,
};

const toDateStr = (v) => {
  if (!v) return v;
  const d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const toTimeStr = (v) => {
  if (!v) return v;
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(String(v))) return String(v);
  const d = new Date(v);
  if (!isNaN(d.getTime())) return d.toISOString().slice(11, 19);
  return String(v);
};

router.get('/slots', async (req, res) => {
  try {
    const { date, start_date, end_date } = req.query;

    if (start_date && end_date) {
      const slots = await getSlotsForRange(start_date, end_date);
      return res.json(slots);
    }

    if (date) {
      const slots = await getAvailableSlots(date);
      return res.json(slots);
    }

    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const slots = await getSlotsForRange(today, future);
    return res.json(slots);
  } catch (err) {
    console.error('Slots fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { booking_date, start_time, end_time, duration_hours, country_code } = req.body;
    const client_name = req.body.client_name || req.user.full_name;
    const client_email = req.body.client_email || req.user.email;
    const client_phone = req.body.client_phone || req.user.phone || '';

    if (!client_name || !client_email || !booking_date || !start_time || !end_time || !duration_hours) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const normalized = {
      client_name: String(client_name).trim(),
      client_email: String(client_email).trim(),
      client_phone: String(client_phone).trim(),
      country_code: country_code || '250',
      booking_date: toDateStr(booking_date),
      start_time: toTimeStr(start_time),
      end_time: toTimeStr(end_time),
      duration_hours: Number(duration_hours),
    };

    if (!normalized.booking_date) {
      return res.status(400).json({ error: 'Invalid booking date format' });
    }
    if (!normalized.start_time || !normalized.end_time) {
      return res.status(400).json({ error: 'Invalid time format' });
    }

    const amount = BOOKING_PRICES[normalized.duration_hours];
    if (!amount) {
      return res.status(400).json({ error: 'Invalid duration. Choose 2 or 4 hours.' });
    }

    const deposit_amount = Math.round(amount * 0.5);

    const bookingId = await createBooking({
      ...normalized,
      amount,
      deposit_amount,
    });

    const tx_ref = `CSS-${bookingId}-${Date.now()}`;
    const redirect_url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking/confirmation?booking_id=${bookingId}&tx_ref=${tx_ref}`;

    let payment_link = null;
    let charge_id = null;
    let payment_instruction = null;
    try {
      const paymentData = await initiatePayment({
        amount: deposit_amount,
        email: normalized.client_email,
        phone: normalized.client_phone,
        name: normalized.client_name,
        tx_ref,
        country_code: normalized.country_code,
      });
      payment_link = paymentData.link;
      charge_id = paymentData.charge_id;
      payment_instruction = paymentData.instruction;

      await createPaymentRecord({
        booking_id: bookingId,
        transaction_ref: tx_ref,
        charge_id,
        amount: deposit_amount,
        currency: 'RWF',
        provider: 'flutterwave',
        status: 'pending',
      });
    } catch (paymentErr) {
      console.warn('Payment initiation skipped:', paymentErr.message);
    }

    res.status(201).json({
      booking_id: bookingId,
      payment_link,
      payment_instruction,
      charge_id,
      tx_ref,
      deposit_amount,
      amount,
    });
  } catch (err) {
    console.error('Booking creation error:', err.message);
    let msg = 'Failed to create booking';
    if (err.message?.includes('Incorrect date')) {
      msg = 'Invalid date or time format. Please try selecting the date again.';
    } else if (err.message?.includes('Duplicate')) {
      msg = 'This slot has already been booked. Please choose another time.';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      msg = 'Invalid booking reference.';
    }
    res.status(500).json({ error: msg });
  }
});

router.get('/', async (req, res) => {
  try {
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/my', authenticate, async (req, res) => {
  try {
    const bookings = await getBookingsByEmail(req.user.email);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your bookings' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const booking = await getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

router.post('/verify-payment', async (req, res) => {
  try {
    const { charge_id, tx_ref, status } = req.body;

    if (status === 'cancelled') {
      return res.json({ success: false, message: 'Payment was cancelled' });
    }

    if (!charge_id) {
      return res.status(400).json({ error: 'charge_id is required' });
    }

    const verification = await verifyTransaction(charge_id);
    const booking = await getBookingByTransactionRef(tx_ref);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (verification.status === 'succeeded') {
      await updateBookingPayment(booking.id, {
        payment_reference: charge_id,
        payment_status: 'deposit_paid',
        deposit_paid: true,
      });

      await createPaymentRecord({
        booking_id: booking.id,
        transaction_ref: tx_ref,
        amount: verification.amount,
        currency: verification.currency,
        provider: 'flutterwave',
        status: 'successful',
      });
    }

    res.json({ success: true, booking, verification });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
