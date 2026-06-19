'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchBooking } from '@/lib/api';
import Link from 'next/link';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const txRef = searchParams.get('tx_ref');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBooking(Number(bookingId))
        .then(setBooking)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  return (
    <div className="retro-card p-8">
      <div className="text-6xl mb-4">
        {booking?.deposit_paid ? '✅' : '📋'}
      </div>

      <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
        {booking?.deposit_paid ? 'Payment Confirmed!' : 'Booking Received'}
      </h1>

      <p className="text-muted font-mono text-sm mb-6">
        {booking?.deposit_paid
          ? 'Your deposit has been received. Your slot is locked in.'
          : 'We\'re processing your booking. Complete the deposit to confirm.'}
      </p>

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
        <Link
          href="/"
          className="retro-border bg-primary text-background px-6 py-3 font-bold text-sm uppercase tracking-wider"
        >
          Back to Home
        </Link>
        <Link
          href="/contact"
          className="retro-border bg-background text-foreground px-6 py-3 font-bold text-sm uppercase tracking-wider"
        >
          Contact Us
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
