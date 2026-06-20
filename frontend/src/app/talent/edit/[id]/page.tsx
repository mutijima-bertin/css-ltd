'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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

type Demo = {
  id: number;
  file_url: string;
  file_type: string;
  title: string;
};

type SocialEntry = { platform: string; url: string };
type LinkEntry = { label: string; url: string };

export default function TalentEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [demos, setDemos] = useState<Demo[]>([]);
  const [uploadingDemos, setUploadingDemos] = useState(false);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [newDemoFiles, setNewDemoFiles] = useState<File[]>([]);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    country_code: '250',
    location: '',
    bio: '',
    skill_tags: '',
    social_links: [{ platform: '', url: '' }] as SocialEntry[],
    portfolio_links: [{ label: '', url: '' }] as LinkEntry[],
  });

  const authHeaders = (headers: Record<string, string> = {}) => ({
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (!params.id) return;

    fetch(`${API_BASE}/api/talent/${params.id}/edit`, { headers: authHeaders() })
      .then((r) => {
        if (r.status === 403 || r.status === 404) { router.push('/talent/browse'); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setForm({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          country_code: data.country_code || '250',
          location: data.location || '',
          bio: data.bio || '',
          skill_tags: (() => {
            if (!data.skill_tags) return '';
            if (Array.isArray(data.skill_tags)) return data.skill_tags.join(', ');
            try { return JSON.parse(data.skill_tags).join(', '); } catch { return String(data.skill_tags); }
          })(),
          social_links: (() => {
            if (!data.social_links) return [{ platform: '', url: '' }];
            if (Array.isArray(data.social_links)) return data.social_links.length ? data.social_links : [{ platform: '', url: '' }];
            try { const p = JSON.parse(data.social_links); return p.length ? p : [{ platform: '', url: '' }]; } catch { return [{ platform: '', url: '' }]; }
          })(),
          portfolio_links: (() => {
            if (!data.portfolio_links) return [{ label: '', url: '' }];
            if (Array.isArray(data.portfolio_links)) return data.portfolio_links.length ? data.portfolio_links : [{ label: '', url: '' }];
            try { const p = JSON.parse(data.portfolio_links); return p.length ? p : [{ label: '', url: '' }]; } catch { return [{ label: '', url: '' }]; }
          })(),
        });
        setDemos(data.demos || []);
      })
      .catch(() => router.push('/talent/browse'))
      .finally(() => setLoading(false));
  }, [params.id, user, authLoading, router, token]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('country_code', form.country_code);
      fd.append('location', form.location);
      fd.append('bio', form.bio);
      if (form.skill_tags) {
        const tags = form.skill_tags.split(',').map((t) => t.trim()).filter(Boolean);
        fd.append('skill_tags', JSON.stringify(tags));
      }
      fd.append('social_links', JSON.stringify(form.social_links.filter((s) => s.platform && s.url)));
      fd.append('portfolio_links', JSON.stringify(form.portfolio_links.filter((p) => p.label && p.url)));
      if (profilePic) fd.append('profile_picture', profilePic);

      const res = await fetch(`${API_BASE}/api/talent/${params.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Save failed' }));
        throw new Error(err.error);
      }

      setSuccess('Profile saved successfully');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDemos = async () => {
    if (newDemoFiles.length === 0) return;
    setUploadingDemos(true);
    setError('');

    try {
      const fd = new FormData();
      newDemoFiles.forEach((f) => fd.append('demos', f));

      const res = await fetch(`${API_BASE}/api/talent/${params.id}/demos`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error);
      }

      const updated = await fetch(`${API_BASE}/api/talent/${params.id}/edit`, { headers: authHeaders() }).then((r) => r.json());
      setDemos(updated.demos || []);
      setNewDemoFiles([]);
      setSuccess('Demos uploaded');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploadingDemos(false);
    }
  };

  const handleDeleteDemo = async (demoId: number) => {
    if (!confirm('Remove this demo file?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/talent/${params.id}/demos/${demoId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(err.error);
      }
      setDemos(demos.filter((d) => d.id !== demoId));
      setSuccess('Demo removed');
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="retro-grid min-h-screen flex items-center justify-center py-12">
        <p className="font-mono text-muted"><span className="text-secondary">$</span> loading...<span className="blink ml-1">_</span></p>
      </div>
    );
  }

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Edit <span className="text-primary">Profile</span>
          </h1>
          <a href={`/talent/${params.id}`} className="text-secondary underline font-mono text-sm">View Profile</a>
        </div>

        {error && (
          <div className="retro-card p-4 mb-6 border-2 border-primary">
            <p className="font-mono text-sm text-primary font-bold">{error}</p>
          </div>
        )}
        {success && (
          <div className="retro-card p-4 mb-6 border-2 border-secondary">
            <p className="font-mono text-sm text-secondary font-bold">{success}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="retro-card p-6 space-y-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider font-bold">Full Name *</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" required />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-bold">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" required />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-bold">Phone</label>
              <div className="flex gap-0 mt-1">
                <select value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                  className="appearance-none px-2 py-2 border-2 border-r-0 border-foreground bg-background font-mono text-sm cursor-pointer h-[42px]">
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
                  ))}
                </select>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="flex-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold">Location</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" placeholder="e.g. Kigali, Rwanda" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold">Profile Picture</label>
            <input type="file" accept="image/*" onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
              className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm file:mr-3 file:py-1 file:px-3 file:border-2 file:border-foreground file:bg-background file:font-mono file:text-sm file:cursor-pointer" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold">Skills (comma-separated)</label>
            <input type="text" value={form.skill_tags} onChange={(e) => setForm({ ...form, skill_tags: e.target.value })}
              className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
              placeholder="e.g. Mixing, Mastering, Event Photography" />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-bold">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={4}
              className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm resize-y" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs uppercase tracking-wider font-bold">Social Links</label>
              <button type="button" onClick={addSocial} className="text-xs text-secondary underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {form.social_links.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder="Platform" value={s.platform} onChange={(e) => updateSocial(i, 'platform', e.target.value)}
                    className="flex-[3] px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                  <input type="url" placeholder="URL" value={s.url} onChange={(e) => updateSocial(i, 'url', e.target.value)}
                    className="flex-[5] px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                  <button type="button" onClick={() => removeSocial(i)} className="text-primary font-bold text-lg">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs uppercase tracking-wider font-bold">Portfolio Links</label>
              <button type="button" onClick={addPortfolio} className="text-xs text-secondary underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {form.portfolio_links.map((p, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input type="text" placeholder="Label" value={p.label} onChange={(e) => updatePortfolio(i, 'label', e.target.value)}
                    className="flex-[3] px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                  <input type="url" placeholder="URL" value={p.url} onChange={(e) => updatePortfolio(i, 'url', e.target.value)}
                    className="flex-[5] px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                  <button type="button" onClick={() => removePortfolio(i)} className="text-primary font-bold text-lg">✕</button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving}
            className="w-full retro-border py-3 font-bold text-sm uppercase tracking-wider bg-primary text-background hover:bg-primary/90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="retro-card p-6 mb-6">
          <h3 className="text-xs uppercase tracking-wider font-bold text-muted mb-4">Demo Files</h3>

          {demos.length > 0 && (
            <ul className="space-y-2 mb-4">
              {demos.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 font-mono text-sm">
                  <a href={d.file_url} target="_blank" className="text-secondary underline truncate">
                    {d.title || d.file_url.split('/').pop()} ({d.file_type})
                  </a>
                  <button onClick={() => handleDeleteDemo(d.id)} className="text-primary font-bold text-lg shrink-0">✕</button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs uppercase tracking-wider font-bold">Add New Demos</label>
              <input type="file" multiple accept=".mp3,.wav,.flac,.aac,.ogg,.mp4,.mov,.avi,.jpg,.jpeg,.png,.gif,.pdf"
                onChange={(e) => setNewDemoFiles(Array.from(e.target.files || []))}
                className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm file:mr-3 file:py-1 file:px-3 file:border-2 file:border-foreground file:bg-background file:font-mono file:text-sm file:cursor-pointer" />
            </div>
            <button type="button" onClick={handleUploadDemos} disabled={uploadingDemos || newDemoFiles.length === 0}
              className="px-4 py-2 text-xs font-bold border-2 border-foreground bg-background text-foreground disabled:text-muted disabled:cursor-not-allowed">
              {uploadingDemos ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {newDemoFiles.length > 0 && (
            <ul className="mt-2 font-mono text-xs text-muted space-y-1">
              {newDemoFiles.map((f, i) => (
                <li key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(1)} MB)</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
