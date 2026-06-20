'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/constants';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const STEPS = ['Email', 'Name', 'Username', 'Password', 'Phone', 'Confirm'] as const;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ email: '', full_name: '', username: '', password: '', confirm: '', phone: '', country_code: '250' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  // Future: SMS verification code state
  // const [smsCode, setSmsCode] = useState('');
  // const [smsSent, setSmsSent] = useState(false);
  // Future: Email verification token state
  // const [emailVerified, setEmailVerified] = useState(false);

  let usernameTimer: ReturnType<typeof setTimeout>;

  const checkUsername = (value: string) => {
    clearTimeout(usernameTimer);
    if (value.length < 2) { setUsernameAvailable(null); return; }
    setUsernameChecking(true);
    usernameTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/check-username?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setUsernameAvailable(data.available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setUsernameChecking(false);
      }
    }, 400);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
      case 1: return form.full_name.trim().length >= 2;
      case 2: return form.username.trim().length >= 2 && usernameAvailable === true;
      case 3: return form.password.length >= 8 && form.password === form.confirm;
      case 4: return form.phone.trim().length >= 4;
      case 5: return true;
      default: return false;
    }
  };

  const nextStep = () => { if (canProceed()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      await register(form.full_name, form.email, form.password, `${form.country_code}${form.phone.replace(/[^0-9]/g, '')}`, form.username);
      router.push('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="retro-grid min-h-screen flex items-center justify-center py-12">
      <div className="retro-card p-8 max-w-lg w-full">
        <h1 className="text-2xl font-black uppercase tracking-tight text-center mb-1">
          <span className="text-primary">Create Account</span>
        </h1>
        <p className="text-muted text-center font-mono text-xs mb-4">Step {step + 1} of {STEPS.length}</p>

        <div className="flex gap-1 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-gray-300'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wider font-bold block">What is your email?</label>
            <p className="text-xs text-muted font-mono -mt-2">We'll send a confirmation link here (coming soon)</p>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" autoFocus />
            {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && (
              <p className="text-primary font-bold text-xs">Please enter a valid email address</p>
            )}
            <button onClick={nextStep} disabled={!canProceed()}
              className="w-full retro-border bg-primary text-background py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300 disabled:text-gray-500">
              Continue
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wider font-bold block">What is your full name?</label>
            <input type="text" placeholder="Full Name" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" autoFocus />
            <div className="flex gap-2">
              <button onClick={prevStep} className="flex-1 retro-border py-3 font-bold text-sm uppercase tracking-wider bg-background text-foreground">Back</button>
              <button onClick={nextStep} disabled={!canProceed()}
                className="flex-1 retro-border bg-primary text-background py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300 disabled:text-gray-500">Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wider font-bold block">Choose a username</label>
            <p className="text-xs text-muted font-mono -mt-2">You'll use this to sign in</p>
            <div>
              <input type="text" placeholder="username" value={form.username}
                onChange={(e) => { setForm({ ...form, username: e.target.value }); checkUsername(e.target.value); }}
                className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" autoFocus />
              {form.username.length >= 2 && (
                <p className={`text-xs font-bold mt-1 font-mono ${usernameChecking ? 'text-muted' : usernameAvailable ? 'text-secondary' : 'text-primary'}`}>
                  {usernameChecking ? 'Checking...' : usernameAvailable ? 'Username available' : 'Username taken'}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={prevStep} className="flex-1 retro-border py-3 font-bold text-sm uppercase tracking-wider bg-background text-foreground">Back</button>
              <button onClick={nextStep} disabled={!canProceed()}
                className="flex-1 retro-border bg-primary text-background py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300 disabled:text-gray-500">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wider font-bold block">Create a password</label>
            <input type="password" placeholder="Password (min 8 characters)" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" autoFocus minLength={8} />
            <input type="password" placeholder="Confirm Password" value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
            {form.password && form.password.length < 8 && (
              <p className="text-primary font-bold text-xs">Password must be at least 8 characters</p>
            )}
            {form.password.length >= 8 && form.confirm && form.password !== form.confirm && (
              <p className="text-primary font-bold text-xs">Passwords do not match</p>
            )}
            <div className="flex gap-2">
              <button onClick={prevStep} className="flex-1 retro-border py-3 font-bold text-sm uppercase tracking-wider bg-background text-foreground">Back</button>
              <button onClick={nextStep} disabled={!canProceed()}
                className="flex-1 retro-border bg-primary text-background py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300 disabled:text-gray-500">Continue</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wider font-bold block">Phone number</label>
            <p className="text-xs text-muted font-mono -mt-2">We'll send a verification code (coming soon)</p>
            <div className="flex gap-0">
              <select value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                className="appearance-none px-2 py-2 border-2 border-r-0 border-foreground bg-background font-mono text-sm cursor-pointer h-[42px]">
                {COUNTRIES.map((c) => (<option key={c.code} value={c.code}>{c.flag} +{c.code}</option>))}
              </select>
              <input type="tel" placeholder="XX XXX XXXX" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="flex-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" autoFocus />
            </div>
            {/* Future: SMS verification UI
            {!smsSent ? (
              <button onClick={sendSmsCode} className="w-full retro-border py-3 font-bold text-sm uppercase tracking-wider bg-secondary text-background">
                Send Verification Code
              </button>
            ) : (
              <div>
                <input type="text" placeholder="Enter 6-digit code" value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm text-center tracking-widest" />
                <p className="text-xs text-muted font-mono mt-1">Code sent to {form.country_code}{form.phone}</p>
              </div>
            )}
            */}
            <div className="flex gap-2">
              <button onClick={prevStep} className="flex-1 retro-border py-3 font-bold text-sm uppercase tracking-wider bg-background text-foreground">Back</button>
              <button onClick={nextStep} disabled={!canProceed()}
                className="flex-1 retro-border bg-primary text-background py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300 disabled:text-gray-500">Continue</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <label className="text-xs uppercase tracking-wider font-bold block">Almost done!</label>
            <p className="text-xs text-muted font-mono -mt-2">Review your details before submitting</p>
            <div className="bg-gray-50 border-2 border-foreground p-4 font-mono text-sm space-y-2">
              <p><span className="font-bold">Email:</span> {form.email}</p>
              <p><span className="font-bold">Name:</span> {form.full_name}</p>
              <p><span className="font-bold">Username:</span> {form.username}</p>
              <p><span className="font-bold">Phone:</span> +{form.country_code} {form.phone}</p>
            </div>
            {/* Future: Email verification
            <div className="border-2 border-foreground p-4 font-mono text-sm">
              <p className="font-bold mb-2">Verify your email</p>
              <p className="text-xs text-muted mb-2">We sent a verification link to {form.email}. Click the link to verify.</p>
              <button className="text-secondary underline text-xs">Resend email</button>
            </div>
            */}
            {error && <p className="text-primary font-bold text-sm text-center">{error}</p>}
            <div className="flex gap-2">
              <button onClick={prevStep} className="flex-1 retro-border py-3 font-bold text-sm uppercase tracking-wider bg-background text-foreground">Back</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 retro-border bg-primary text-background py-3 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300 disabled:text-gray-500">
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted mt-6 font-mono">
          Already have an account? <Link href="/login" className="text-secondary underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
