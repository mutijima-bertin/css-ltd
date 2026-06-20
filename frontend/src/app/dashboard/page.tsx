'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { retryPayment } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Booking = {
  id: number;
  client_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  amount: number;
  deposit_amount: number;
  deposit_paid: number;
  status: string;
  payment_status: string;
  created_at: string;
};

type TalentProfile = {
  id: number;
  full_name: string;
  status: string;
  created_at: string;
  demos: { id: number }[];
};

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'bookings' | 'talent' | 'profile'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [talentProfiles, setTalentProfiles] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '' });
  const [msg, setMsg] = useState('');
  const [retryingId, setRetryingId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login?redirect=/dashboard'); return; }
    setEditForm({ full_name: user.full_name, phone: user.phone || '' });
    loadData();
  }, [user, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('css_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const [b, t] = await Promise.all([
        fetch(`${API_BASE}/api/bookings/my`, { headers }).then((r) => r.json()),
        fetch(`${API_BASE}/api/talent/my`, { headers }).then((r) => r.json()),
      ]);
      setBookings(b || []);
      setTalentProfiles(t || []);
    } catch {
      setBookings([]);
      setTalentProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      const token = localStorage.getItem('css_token');
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setMsg('Profile updated');
      // Update local user state by forcing a re-login... or just show message
    } catch {
      setMsg('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleRetryPayment = async (bookingId: number) => {
    setRetryingId(bookingId);
    try {
      const result = await retryPayment(bookingId);
      if (result.payment_link) {
        window.open(result.payment_link, '_blank');
      }
    } catch {
      setMsg('Failed to initiate payment');
    } finally {
      setRetryingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="retro-grid min-h-screen flex items-center justify-center py-12">
        <p className="font-mono text-muted"><span className="text-secondary">$</span> loading...<span className="blink ml-1">_</span></p>
      </div>
    );
  }

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            <span className="text-primary">Dashboard</span>
          </h1>
          <p className="font-mono text-sm text-muted">{user?.full_name}</p>
        </div>

        <div className="flex gap-2 mb-8">
          {(['bookings', 'talent', 'profile'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider retro-border ${
                tab === t ? 'bg-primary text-background' : 'bg-background text-foreground'
              }`}
            >
              {t === 'bookings' ? 'My Bookings' : t === 'talent' ? 'Talent Profile' : 'Edit Profile'}
            </button>
          ))}
        </div>

        {tab === 'bookings' && (
          <div className="retro-card p-6">
            <h2 className="font-bold uppercase tracking-wider text-sm mb-4">My Bookings</h2>
            {loading ? (
              <p className="font-mono text-muted text-sm">Loading...</p>
            ) : bookings.length === 0 ? (
              <div className="text-center py-6">
                <p className="font-mono text-muted mb-3">No bookings yet.</p>
                <Link href="/booking" className="retro-border bg-primary text-background px-6 py-2 text-sm font-bold inline-block">
                  Book the Studio
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b-2 border-foreground">
                        <th className="p-2 text-left">#</th>
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-left">Time</th>
                        <th className="p-2 text-left">Duration</th>
                        <th className="p-2 text-left">Deposit</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b border-foreground/20">
                        <td className="p-2 font-bold">{b.id}</td>
                        <td className="p-2">{new Date(b.booking_date).toLocaleDateString()}</td>
                        <td className="p-2">{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</td>
                        <td className="p-2">{b.duration_hours}h</td>
                        <td className="p-2">
                          <span className={b.deposit_paid ? 'text-secondary' : 'text-primary'}>
                            {b.deposit_paid ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 text-xs font-bold uppercase ${
                            b.status === 'confirmed' ? 'bg-secondary text-background' :
                            b.status === 'pending' ? 'bg-accent text-foreground' :
                            'bg-primary text-background'
                          }`}>{b.status}</span>
                        </td>
                        <td className="p-2">
                          {!b.deposit_paid && b.status !== 'cancelled' && b.status !== 'completed' && (
                            <button
                              onClick={() => handleRetryPayment(b.id)}
                              disabled={retryingId === b.id}
                              className="retro-border bg-secondary text-background px-3 py-1 text-xs font-bold uppercase tracking-wider disabled:bg-gray-300"
                            >
                              {retryingId === b.id ? '...' : 'Pay Now'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'talent' && (
          <div className="retro-card p-6">
            <h2 className="font-bold uppercase tracking-wider text-sm mb-4">My Talent Profile</h2>
            {loading ? (
              <p className="font-mono text-muted text-sm">Loading...</p>
            ) : talentProfiles.length === 0 ? (
              <div className="text-center py-6">
                <p className="font-mono text-muted mb-3">No talent profile yet.</p>
                <Link href="/talent" className="retro-border bg-secondary text-background px-6 py-2 text-sm font-bold inline-block">
                  Submit Your Profile
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {talentProfiles.map((p) => (
                  <div key={p.id} className="border-2 border-foreground p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold">{p.full_name}</p>
                      <div className="flex items-center gap-2">
                        <Link href={`/talent/edit/${p.id}`} className="text-xs text-secondary underline">Edit</Link>
                        <span className={`px-2 py-0.5 text-xs font-bold uppercase ${
                          p.status === 'approved' ? 'bg-secondary text-background' :
                          p.status === 'rejected' ? 'bg-primary text-background' :
                          'bg-accent text-foreground'
                        }`}>{p.status}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted font-mono">
                      Submitted {new Date(p.created_at).toLocaleDateString()} · {p.demos?.length || 0} demo file{(p.demos?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="retro-card p-6">
            <h2 className="font-bold uppercase tracking-wider text-sm mb-4">Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
              <div>
                <label className="text-xs uppercase tracking-wider font-bold">Full Name</label>
                <input type="text" value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-bold">Email</label>
                <input type="email" value={user?.email || ''} disabled
                  className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-gray-100 font-mono text-sm cursor-not-allowed" />
                <p className="text-xs text-muted mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-bold">Phone</label>
                <input type="tel" value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
              </div>
              {msg && <p className="text-sm font-bold font-mono" style={{ color: msg === 'Profile updated' ? '#2d5a27' : '#c8412b' }}>{msg}</p>}
              <button type="submit" disabled={saving}
                className="retro-border bg-primary text-background px-6 py-2 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
