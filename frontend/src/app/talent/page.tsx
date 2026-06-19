'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
  { code: '250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '254', flag: '🇰🇪', name: 'Kenya' },
  { code: '256', flag: '🇺🇬', name: 'Uganda' },
  { code: '255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '233', flag: '🇬🇭', name: 'Ghana' },
  { code: '234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '260', flag: '🇿🇲', name: 'Zambia' },
  { code: '27', flag: '🇿🇦', name: 'South Africa' },
  { code: '257', flag: '🇧🇮', name: 'Burundi' },
  { code: '243', flag: '🇨🇩', name: 'DR Congo' },
  { code: '1', flag: '🇺🇸', name: 'United States' },
  { code: '44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '33', flag: '🇫🇷', name: 'France' },
  { code: '49', flag: '🇩🇪', name: 'Germany' },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type SocialEntry = { platform: string; url: string };
type LinkEntry = { label: string; url: string };

export default function TalentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    country_code: '250',
    location: '',
    bio: '',
    social_links: [{ platform: '', url: '' }] as SocialEntry[],
    portfolio_links: [{ label: '', url: '' }] as LinkEntry[],
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login?redirect=/talent'); return; }
    if (user) {
      setForm((prev) => ({ ...prev, full_name: user.full_name, email: user.email, phone: user.phone || '' }));
    }
  }, [user, authLoading, router]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const addSocial = () => setForm({ ...form, social_links: [...form.social_links, { platform: '', url: '' }] });
  const removeSocial = (i: number) => {
    const s = form.social_links.filter((_, idx) => idx !== i);
    setForm({ ...form, social_links: s.length ? s : [{ platform: '', url: '' }] });
  };
  const updateSocial = (i: number, field: keyof SocialEntry, value: string) => {
    const s = [...form.social_links];
    s[i] = { ...s[i], [field]: value };
    setForm({ ...form, social_links: s });
  };

  const addPortfolio = () => setForm({ ...form, portfolio_links: [...form.portfolio_links, { label: '', url: '' }] });
  const removePortfolio = (i: number) => {
    const p = form.portfolio_links.filter((_, idx) => idx !== i);
    setForm({ ...form, portfolio_links: p.length ? p : [{ label: '', url: '' }] });
  };
  const updatePortfolio = (i: number, field: keyof LinkEntry, value: string) => {
    const p = [...form.portfolio_links];
    p[i] = { ...p[i], [field]: value };
    setForm({ ...form, portfolio_links: p });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email) {
      setError('Name and email are required');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name);
      fd.append('email', form.email);
      fd.append('phone', `${form.country_code}${form.phone.replace(/[^0-9]/g, '')}`);
      fd.append('country_code', form.country_code);
      fd.append('location', form.location);
      fd.append('bio', form.bio);
      fd.append('social_links', JSON.stringify(form.social_links.filter((s) => s.platform && s.url)));
      fd.append('portfolio_links', JSON.stringify(form.portfolio_links.filter((p) => p.label && p.url)));
      files.forEach((f) => fd.append('demos', f));

      const token = localStorage.getItem('css_token');
      const res = await fetch(`${API_BASE}/api/talent`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Submission failed' }));
        throw new Error(err.error);
      }

      setSubmitted(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="retro-grid min-h-screen flex items-center justify-center py-12">
        <p className="font-mono text-muted"><span className="text-secondary">$</span> loading...<span className="blink ml-1">_</span></p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="retro-grid min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="retro-card p-8">
            <div className="text-5xl mb-4">🎤</div>
            <h2 className="text-2xl font-bold mb-2">Profile Submitted!</h2>
            <p className="text-muted font-mono text-sm mb-6">
              Thank you for registering. Our team will review your profile and get back to you.
            </p>
            <a
              href="/"
              className="retro-border bg-primary text-background px-8 py-3 font-bold text-sm uppercase tracking-wider inline-block"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            Talent <span className="text-primary">Portal</span>
          </h1>
          <p className="text-muted mt-2 font-mono text-sm">
            Register your profile — singers, producers, engineers, &amp; artists
          </p>
        </div>

        <form onSubmit={handleSubmit} className="retro-card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider font-bold">Full Name *</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider font-bold">Phone *</label>
              <div className="flex gap-0 mt-1">
                <select
                  value={form.country_code}
                  onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                  className="appearance-none px-2 py-2 border-2 border-r-0 border-foreground bg-background font-mono text-sm cursor-pointer h-[42px]"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="XX XXX XXXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="flex-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold">Location (City, Country)</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
              placeholder="e.g. Kigali, Rwanda"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold">Bio / About You</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm resize-y"
              placeholder="Tell us about yourself, your experience, and what you do..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs uppercase tracking-wider font-bold">Social Media Links</label>
              <button type="button" onClick={addSocial} className="text-xs text-secondary underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {form.social_links.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Platform (e.g. Instagram)"
                    value={s.platform}
                    onChange={(e) => updateSocial(i, 'platform', e.target.value)}
                    className="flex-[3] px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={s.url}
                    onChange={(e) => updateSocial(i, 'url', e.target.value)}
                    className="flex-[5] px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
                  />
                  <button type="button" onClick={() => removeSocial(i)} className="text-primary font-bold text-lg">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs uppercase tracking-wider font-bold">Portfolio / Music Links</label>
              <button type="button" onClick={addPortfolio} className="text-xs text-secondary underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {form.portfolio_links.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Label (e.g. SoundCloud)"
                    value={p.label}
                    onChange={(e) => updatePortfolio(i, 'label', e.target.value)}
                    className="flex-[3] px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={p.url}
                    onChange={(e) => updatePortfolio(i, 'url', e.target.value)}
                    className="flex-[5] px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
                  />
                  <button type="button" onClick={() => removePortfolio(i)} className="text-primary font-bold text-lg">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold">Demo Uploads (audio, video, images — max 5 files, 50MB each)</label>
            <input
              type="file"
              multiple
              accept=".mp3,.wav,.flac,.aac,.ogg,.mp4,.mov,.avi,.jpg,.jpeg,.png,.gif,.pdf"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm file:mr-3 file:py-1 file:px-3 file:border-2 file:border-foreground file:bg-background file:font-mono file:text-sm file:cursor-pointer"
            />
            {files.length > 0 && (
              <ul className="mt-2 font-mono text-xs text-muted space-y-1">
                {files.map((f, i) => (
                  <li key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(1)} MB)</li>
                ))}
              </ul>
            )}
          </div>

          {error && (
            <div className="text-primary font-bold text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full retro-border py-3 font-bold text-sm uppercase tracking-wider bg-primary text-background hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Talent Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
