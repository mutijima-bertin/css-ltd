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
} from '../models/booking.js';
import { initiatePayment, verifyTransaction } from '../services/flutterwave.js';

const router = Router();

const BOOKING_PRICES = {
  2: 50000,
  4: 90000,
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
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { client_name, client_email, client_phone, booking_date, start_time, end_time, duration_hours } = req.body;

    if (!client_name || !client_email || !client_phone || !booking_date || !start_time || !end_time || !duration_hours) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const amount = BOOKING_PRICES[duration_hours];
    if (!amount) {
      return res.status(400).json({ error: 'Invalid duration. Choose 2 or 4 hours.' });
    }

    const deposit_amount = Math.round(amount * 0.5);

    const bookingId = await createBooking({
      client_name,
      client_email,
      client_phone,
      booking_date,
      start_time,
      end_time,
      duration_hours,
      amount,
      deposit_amount,
    });

    const tx_ref = `CSS-${bookingId}-${Date.now()}`;
    const redirect_url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking/confirmation?booking_id=${bookingId}&tx_ref=${tx_ref}`;

    let payment_link = null;
    try {
      const paymentData = await initiatePayment({
        amount: deposit_amount,
        email: client_email,
        phone: client_phone,
        name: client_name,
        tx_ref,
        redirect_url,
      });
      payment_link = paymentData.link;

      await createPaymentRecord({
        booking_id: bookingId,
        transaction_ref: tx_ref,
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
      tx_ref,
      deposit_amount,
      amount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create booking' });
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
    const { transaction_id, tx_ref, status } = req.body;

    if (status === 'cancelled') {
      return res.json({ success: false, message: 'Payment was cancelled' });
    }

    const verification = await verifyTransaction(transaction_id);
    const booking = await getBookingByTransactionRef(tx_ref);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (verification.status === 'successful') {
      await updateBookingPayment(booking.id, {
        payment_reference: transaction_id,
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

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha256', process.env.FLW_WEBHOOK_SECRET || '')
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== req.headers['verif-hash']) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { txRef, status } = req.body.data;

    if (status === 'successful') {
      const booking = await getBookingByTransactionRef(txRef);
      if (booking) {
        await updateBookingPayment(booking.id, {
          payment_reference: req.body.data.id,
          payment_status: 'deposit_paid',
          deposit_paid: true,
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
