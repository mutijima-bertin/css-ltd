import {
  getAvailableSlots,
  getSlotsForRange,
  createBooking,
  getBookingById,
  getAllBookings,
  updateBookingPayment,
  getBookingByTransactionRef,
  getBookingsByEmail,
  cancelBooking,
  getPaymentsByBookingId,
  upsertPaymentRecord,
  updateBookingStatus,
} from '../models/booking.js';
import { initiatePayment, verifyTransaction, verifyWebhookSignature, verifyTransactionByRef } from '../services/flutterwave.js';

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

export const getSlots = async (req, res) => {
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
};

export const create = async (req, res) => {
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
      user_id: req.user.id,
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
        redirect_url,
        country_code: normalized.country_code,
      });
      payment_link = paymentData.link;
      charge_id = paymentData.charge_id;
      payment_instruction = paymentData.instruction;

      await upsertPaymentRecord({
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
    } else if (err.message?.includes('already been booked')) {
      msg = 'This time slot has already been booked. Please choose another time.';
    } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      msg = 'Invalid booking reference.';
    }
    res.status(500).json({ error: msg });
  }
};

export const getAll = async (req, res) => {
  try {
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const getMy = async (req, res) => {
  try {
    const bookings = await getBookingsByEmail(req.user.email);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your bookings' });
  }
};

export const getById = async (req, res) => {
  try {
    const booking = await getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

export const cancel = async (req, res) => {
  try {
    const booking = await getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed booking' });
    }

    const allowed = await cancelBooking(Number(req.params.id), req.user.id);
    if (!allowed) {
      return res.status(403).json({ error: 'You can only cancel your own bookings' });
    }

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (err) {
    console.error('Cancel booking error:', err.message);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { charge_id, tx_ref, status } = req.body;

    if (status === 'cancelled') {
      return res.json({ success: false, message: 'Payment was cancelled' });
    }

    if (!tx_ref) {
      return res.status(400).json({ error: 'tx_ref is required' });
    }

    const booking = await getBookingByTransactionRef(tx_ref);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    let verification = null;
    let chargeId = charge_id;

    try {
      if (chargeId) {
        verification = await verifyTransaction(chargeId);
      } else {
        const chargesData = await verifyTransactionByRef(tx_ref);
        const charge = Array.isArray(chargesData) ? chargesData[0] : chargesData;
        if (charge) {
          verification = charge;
          chargeId = charge.id;
        }
      }
    } catch (verifyErr) {
      console.warn('Flutterwave verification fetch failed:', verifyErr.message);
    }

    if (verification && verification.status === 'successful') {
      await updateBookingPayment(booking.id, {
        payment_reference: chargeId,
        payment_status: 'deposit_paid',
        deposit_paid: true,
      });

      await upsertPaymentRecord({
        booking_id: booking.id,
        transaction_ref: tx_ref,
        charge_id: chargeId,
        amount: verification.amount,
        currency: verification.currency,
        provider: 'flutterwave',
        status: 'successful',
      });
    }

    res.json({
      success: verification?.status === 'successful',
      payment_status: verification?.status || (booking.deposit_paid ? 'successful' : 'pending'),
      booking,
      verification,
    });
  } catch (err) {
    console.error('Verify payment error:', err.message);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
};

export const retryPayment = async (req, res) => {
  try {
    const booking = await getBookingById(Number(req.params.id));
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only retry payment on your own bookings' });
    }

    if (booking.deposit_paid) {
      return res.status(400).json({ error: 'Deposit already paid' });
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ error: `Cannot retry payment for a ${booking.status} booking` });
    }

    const tx_ref = `CSS-${booking.id}-${Date.now()}`;
    const redirect_url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking/confirmation?booking_id=${booking.id}&tx_ref=${tx_ref}`;

    let payment_link = null;
    let charge_id = null;
    let payment_instruction = null;
    try {
      const paymentData = await initiatePayment({
        amount: booking.deposit_amount,
        email: booking.client_email,
        phone: booking.client_phone,
        name: booking.client_name,
        tx_ref,
        redirect_url,
        country_code: booking.country_code,
      });
      payment_link = paymentData.link;
      charge_id = paymentData.charge_id;
      payment_instruction = paymentData.instruction;

      await upsertPaymentRecord({
        booking_id: booking.id,
        transaction_ref: tx_ref,
        charge_id,
        amount: booking.deposit_amount,
        currency: 'RWF',
        provider: 'flutterwave',
        status: 'pending',
      });
    } catch (paymentErr) {
      console.warn('Retry payment initiation failed:', paymentErr.message);
    }

    res.json({
      booking_id: booking.id,
      payment_link,
      payment_instruction,
      charge_id,
      tx_ref,
      deposit_amount: booking.deposit_amount,
    });
  } catch (err) {
    console.error('Retry payment error:', err.message);
    res.status(500).json({ error: 'Failed to retry payment' });
  }
};

export const webhook = async (req, res) => {
  try {
    if (!verifyWebhookSignature(req)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;

    if (event.event?.type === 'charge.completed' || event.event?.type === 'charge.success') {
      const charge = event.event.data;
      const tx_ref = charge.tx_ref;

      if (!tx_ref) {
        return res.status(200).json({ received: true });
      }

      const booking = await getBookingByTransactionRef(tx_ref);
      if (!booking || booking.status === 'cancelled') {
        return res.status(200).json({ received: true });
      }

      const isSuccessful = charge.status === 'successful';

      await updateBookingPayment(booking.id, {
        payment_reference: charge.id,
        payment_status: isSuccessful ? 'deposit_paid' : 'pending',
        deposit_paid: isSuccessful,
      });

      await upsertPaymentRecord({
        booking_id: booking.id,
        transaction_ref: tx_ref,
        charge_id: charge.id,
        amount: charge.amount || booking.deposit_amount,
        currency: charge.currency || 'RWF',
        provider: 'flutterwave',
        status: isSuccessful ? 'successful' : 'failed',
        flw_response: JSON.stringify(event),
      });
    }

    if (event.event?.type === 'charge.failed') {
      const charge = event.event.data;
      const tx_ref = charge.tx_ref;

      if (tx_ref) {
        const booking = await getBookingByTransactionRef(tx_ref);
        if (!booking) {
          console.warn('Webhook: charge.failed for unknown booking tx_ref:', tx_ref);
        }
        await upsertPaymentRecord({
          booking_id: booking?.id,
          transaction_ref: tx_ref,
          charge_id: charge.id,
          amount: charge.amount || 0,
          currency: charge.currency || 'RWF',
          provider: 'flutterwave',
          status: 'failed',
          flw_response: JSON.stringify(event),
        });
      }
    }

    if (event.event?.type === 'charge.refunded') {
      const charge = event.event.data;
      const tx_ref = charge.tx_ref;

      if (tx_ref) {
        const booking = await getBookingByTransactionRef(tx_ref);
        if (booking) {
          await updateBookingPayment(booking.id, {
            payment_reference: charge.id,
            payment_status: 'refunded',
            deposit_paid: false,
          });

          await upsertPaymentRecord({
            booking_id: booking.id,
            transaction_ref: tx_ref,
            charge_id: charge.id,
            amount: charge.amount || 0,
            currency: charge.currency || 'RWF',
            provider: 'flutterwave',
            status: 'failed',
            flw_response: JSON.stringify(event),
          });
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    res.status(200).json({ received: true });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await getPaymentsByBookingId(Number(req.params.id));
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Use: ${validStatuses.join(', ')}` });
    }
    await updateBookingStatus(Number(req.params.id), { status, admin_notes });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update booking status' });
  }
};
