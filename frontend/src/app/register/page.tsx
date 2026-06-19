'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(form.full_name, form.email, form.password, form.phone);
      router.push('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="retro-grid min-h-screen flex items-center justify-center py-12">
      <div className="retro-card p-8 max-w-md w-full">
        <h1 className="text-2xl font-black uppercase tracking-tight text-center mb-2">
          <span className="text-primary">Register</span>
        </h1>
        <p className="text-muted text-center font-mono text-sm mb-6">Create your Creative Sound Studio account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })} required
            className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
          <input type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} required
            className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
          <input type="tel" placeholder="Phone (optional)" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
          <input type="password" placeholder="Password (min 6 characters)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
            className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
          <input type="password" placeholder="Confirm Password" value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })} required
            className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
          {error && <p className="text-primary font-bold text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full retro-border bg-primary text-background py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="text-center text-xs text-muted mt-4 font-mono">
          Already have an account? <Link href="/login" className="text-secondary underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
