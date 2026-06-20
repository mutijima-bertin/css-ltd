'use client';

import { useState, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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
      router.push(searchParams.get('redirect') || '/dashboard');
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

        {error && (
          <div className="border-2 border-primary p-3 mb-4">
            <p className="font-mono text-xs text-primary font-bold">{error}</p>
            <p className="font-mono text-xs text-muted mt-1">
              {error.includes('find an account') ? (
                <>Double-check your email/username or <Link href="/register" className="text-secondary underline">create a new account</Link>.</>
              ) : error.includes('Incorrect password') ? (
                'Try again or reset your password.'
              ) : (
                'If the problem persists, contact support.'
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider font-bold block mb-1">Email or Username</label>
            <input type="text" placeholder="you@example.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-bold block mb-1">Password</label>
            <input type="password" placeholder="Enter your password" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full retro-border bg-primary text-background py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300 disabled:text-gray-500">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-xs text-muted mt-4 font-mono">
          Don&apos;t have an account? <Link href="/register" className="text-secondary underline">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="retro-grid min-h-screen flex items-center justify-center py-12">
        <div className="retro-card p-8 max-w-md w-full text-center font-mono text-muted">
          <span className="blink">_</span> Loading...
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
