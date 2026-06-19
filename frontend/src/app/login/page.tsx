'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
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
          <span className="text-primary">Login</span>
        </h1>
        <p className="text-muted text-center font-mono text-sm mb-6">Welcome back to Creative Sound Studio</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required
            className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
          {error && <p className="text-primary font-bold text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full retro-border bg-primary text-background py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-xs text-muted mt-4 font-mono">
          Don&apos;t have an account? <Link href="/register" className="text-secondary underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
