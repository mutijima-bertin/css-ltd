'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { fetchBooking, verifyPayment, retryPayment } from '@/lib/api';
import Link from 'next/link';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('booking_id');
  const txRef = searchParams.get('tx_ref');
  const [booking, setBooking] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('loading');
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!bookingId && !txRef) {
      setLoading(false);
      setPaymentStatus('unknown');
      return;
    }

    const load = async () => {
      try {
        if (bookingId) {
          const b = await fetchBooking(Number(bookingId));
          setBooking(b);
          if (b.deposit_paid) {
            setPaymentStatus('successful');
            setLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }

      if (txRef) {
        try {
          const result = await verifyPayment(txRef);
          setPaymentStatus(result.payment_status || 'pending');
          if (result.booking) setBooking(result.booking);
        } catch {
          setPaymentStatus('unknown');
        }
      } else {
        setPaymentStatus('unknown');
      }
      setLoading(false);
    };

    load();
  }, [bookingId, txRef]);

  useEffect(() => {
    if (paymentStatus === 'pending') {
      pollRef.current = setInterval(async () => {
        if (!txRef) return;
        try {
          const result = await verifyPayment(txRef);
          if (result.booking) setBooking(result.booking);
          if (result.payment_status === 'successful' || result.booking?.deposit_paid) {
            setPaymentStatus('successful');
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (result.payment_status === 'failed') {
            setPaymentStatus('failed');
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch { /* keep polling */ }
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [paymentStatus, txRef]);

  const handleRetry = async () => {
    if (!bookingId) return;
    setRetrying(true);
    try {
      const result = await retryPayment(Number(bookingId));
      if (result.payment_link) {
        window.open(result.payment_link, '_blank');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setPaymentStatus('failed');
    } finally {
      setRetrying(false);
    }
  };

  const statusIcon = () => {
    if (loading || paymentStatus === 'loading') return '⏳';
    if (paymentStatus === 'successful') return '✅';
    if (paymentStatus === 'failed') return '❌';
    if (paymentStatus === 'pending') return '⏳';
    return '📋';
  };

  const statusTitle = () => {
    if (loading || paymentStatus === 'loading') return 'Checking Payment...';
    if (paymentStatus === 'successful') return 'Payment Confirmed!';
    if (paymentStatus === 'failed') return 'Payment Failed';
    if (paymentStatus === 'pending') return 'Processing Payment...';
    return 'Booking Received';
  };

  const statusMessage = () => {
    if (loading || paymentStatus === 'loading') return 'Verifying your payment with Flutterwave...';
    if (paymentStatus === 'successful') return 'Your deposit has been received. Your slot is locked in.';
    if (paymentStatus === 'failed') return 'Your payment did not go through. You can retry below.';
    if (paymentStatus === 'pending') return 'We\'re waiting for payment confirmation. This page refreshes automatically.';
    return 'We\'ve received your booking. Complete the deposit to confirm your slot.';
  };

  return (
    <div className="retro-card p-8">
      <div className="text-6xl mb-4">{statusIcon()}</div>

      <h1 className="text-3xl font-black uppercase tracking-tight mb-2">{statusTitle()}</h1>

      <p className="text-muted font-mono text-sm mb-6">{statusMessage()}</p>

      {paymentStatus === 'pending' && (
        <p className="font-mono text-xs text-muted mb-4 animate-pulse">
          Auto-checking every 5s... <span className="blink">_</span>
        </p>
      )}

      {loading ? (
        <div className="font-mono text-muted">
          <span className="blink">_</span> Loading booking details...
        </div>
      ) : booking ? (
        <div className="bg-foreground/5 p-4 font-mono text-sm text-left space-y-1 mb-6">
          <p><span className="font-bold">Booking #:</span> {booking.id}</p>
          <p><span className="font-bold">Name:</span> {booking.client_name}</p>
          <p><span className="font-bold">Date:</span> {new Date(booking.booking_date).toLocaleDateString()}</p>
          <p><span className="font-bold">Time:</span> {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}</p>
          <p><span className="font-bold">Duration:</span> {booking.duration_hours} hours</p>
          <p><span className="font-bold">Status:</span> {booking.status.toUpperCase()}</p>
          <p><span className="font-bold">Deposit:</span> {booking.deposit_paid ? '✅ Paid' : '⏳ Pending'}</p>
        </div>
      ) : (
        <p className="text-muted font-mono text-sm mb-6">
          Booking reference: {txRef || 'N/A'}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {paymentStatus === 'failed' && bookingId && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="retro-border bg-secondary text-background px-6 py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300"
          >
            {retrying ? 'Processing...' : 'Retry Payment'}
          </button>
        )}
        {paymentStatus === 'pending' && bookingId && (
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="retro-border bg-secondary text-background px-6 py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300"
          >
            {retrying ? 'Processing...' : 'Pay Now'}
          </button>
        )}
        <Link
          href="/"
          className="retro-border bg-primary text-background px-6 py-3 font-bold text-sm uppercase tracking-wider"
        >
          Back to Home
        </Link>
        <Link
          href="/dashboard"
          className="retro-border bg-background text-foreground px-6 py-3 font-bold text-sm uppercase tracking-wider"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <Suspense fallback={
          <div className="retro-card p-8 text-center font-mono text-muted">
            <span className="blink">_</span> Loading...
          </div>
        }>
          <ConfirmationContent />
        </Suspense>
      </div>
    </div>
  );
}
