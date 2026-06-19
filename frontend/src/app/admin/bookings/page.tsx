'use client';

import { useEffect, useState } from 'react';
import { fetchAllBookings } from '@/lib/api';
import Link from 'next/link';

type Booking = {
  id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  amount: number;
  deposit_amount: number;
  deposit_paid: boolean | number;
  status: string;
  payment_status: string;
  created_at: string;
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (authed) {
      setLoading(true);
      fetchAllBookings()
        .then(setBookings)
        .catch(() => setBookings([]))
        .finally(() => setLoading(false));
    }
  }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'cssadmin2026') {
      setAuthed(true);
    } else {
      alert('Incorrect password');
    }
  };

  if (!authed) {
    return (
      <div className="retro-grid min-h-screen flex items-center justify-center py-12">
        <div className="retro-card p-8 max-w-sm w-full">
          <h1 className="text-2xl font-black uppercase tracking-tight text-center mb-6">
            Admin <span className="text-primary">Login</span>
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
            />
            <button
              type="submit"
              className="w-full retro-border bg-primary text-background py-3 font-bold text-sm uppercase tracking-wider"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            <span className="text-primary">Bookings</span> Admin
          </h1>
          <Link
            href="/"
            className="retro-border px-4 py-2 text-xs font-bold bg-background text-foreground uppercase tracking-wider"
          >
            Home
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 font-mono text-muted">
            <span className="text-secondary">$</span> loading bookings...
            <span className="blink ml-1">_</span>
          </div>
        ) : bookings.length === 0 ? (
          <div className="retro-card p-8 text-center">
            <p className="font-mono text-muted">No bookings yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full retro-border text-sm font-mono">
              <thead>
                <tr className="bg-foreground text-background">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Client</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Time</th>
                  <th className="p-3 text-left">Duration</th>
                  <th className="p-3 text-left">Deposit</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t-2 border-foreground bg-background">
                    <td className="p-3 font-bold">{b.id}</td>
                    <td className="p-3">
                      <p className="font-bold">{b.client_name}</p>
                      <p className="text-xs text-muted">{b.client_email}</p>
                      <p className="text-xs text-muted">{b.client_phone}</p>
                    </td>
                    <td className="p-3">{new Date(b.booking_date).toLocaleDateString()}</td>
                    <td className="p-3">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</td>
                    <td className="p-3">{b.duration_hours}h</td>
                    <td className="p-3">
                      <span className={b.deposit_paid ? 'text-secondary' : 'text-primary'}>
                        {b.deposit_paid ? '✅ Paid' : '❌ Pending'}
                      </span>
                      <p className="text-xs text-muted">{Number(b.deposit_amount).toLocaleString()} RWF</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-bold uppercase ${
                        b.status === 'confirmed' ? 'bg-secondary text-background' :
                        b.status === 'pending' ? 'bg-accent text-foreground' :
                        'bg-primary text-background'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
