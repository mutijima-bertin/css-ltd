'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Demo = {
  id: number;
  file_url: string;
  file_type: string;
  title: string;
};

type TalentProfile = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  country_code: string;
  location: string;
  bio: string;
  social_links: string | { platform: string; url: string }[];
  portfolio_links: string | { label: string; url: string }[];
  status: string;
  admin_notes: string;
  demos: Demo[];
  created_at: string;
};

export default function AdminTalentPage() {
  const { user, loading: authLoading, token } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    loadProfiles();
  }, [user, authLoading, router]);

  const authHeaders = (headers: Record<string, string> = {}) => ({
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const loadProfiles = async () => {
    setLoading(true);
    setStatusMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/talent/all`, { headers: authHeaders() });
      const data = await res.json();
      setProfiles(data);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id: number, status: string) => {
    setStatusMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/talent/${id}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ status, admin_notes: notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        setStatusMsg(err.error || 'Failed to update status');
        return;
      }
      setNotes('');
      setExpanded(null);
      loadProfiles();
    } catch {
      setStatusMsg('Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this profile permanently?')) return;
    setStatusMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/talent/${id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) {
        const err = await res.json();
        setStatusMsg(err.error || 'Failed to delete');
        return;
      }
      loadProfiles();
    } catch {
      setStatusMsg('Failed to delete');
    }
  };

  const parseJson = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  if (authLoading || !user) {
    return (
      <div className="retro-grid min-h-screen flex items-center justify-center py-12">
        <p className="font-mono text-muted">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            <span className="text-primary">Talent</span> Admin
          </h1>
          <Link
            href="/"
            className="retro-border px-4 py-2 text-xs font-bold bg-background text-foreground uppercase tracking-wider"
          >
            Home
          </Link>
        </div>

        {statusMsg && (
          <div className="retro-card p-4 mb-6 border-2 border-primary">
            <p className="font-mono text-sm text-primary font-bold">{statusMsg}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 font-mono text-muted">
            <span className="text-secondary">$</span> loading talent profiles...
            <span className="blink ml-1">_</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="retro-card p-8 text-center">
            <p className="font-mono text-muted">No talent submissions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full retro-border text-sm font-mono">
              <thead>
                <tr className="bg-foreground text-background">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Contact</th>
                  <th className="p-3 text-left">Location</th>
                  <th className="p-3 text-left">Demos</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-t-2 border-foreground bg-background">
                    <td className="p-3 font-bold">{p.id}</td>
                    <td className="p-3 font-bold">{p.full_name}</td>
                    <td className="p-3">
                      <p>{p.email}</p>
                      <p className="text-xs text-muted">{p.phone}</p>
                    </td>
                    <td className="p-3">{p.location || '—'}</td>
                    <td className="p-3">
                      {p.demos?.length ? (
                        <button
                          onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                          className="text-secondary underline text-xs"
                        >
                          {p.demos.length} file{p.demos.length > 1 ? 's' : ''}
                        </button>
                      ) : (
                        <span className="text-muted text-xs">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-bold uppercase ${
                        p.status === 'approved' ? 'bg-secondary text-background' :
                        p.status === 'rejected' ? 'bg-primary text-background' :
                        'bg-accent text-foreground'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStatus(p.id, 'approved')}
                          className="px-2 py-1 text-xs font-bold bg-secondary text-background border-2 border-secondary"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatus(p.id, 'rejected')}
                          className="px-2 py-1 text-xs font-bold bg-primary text-background border-2 border-primary"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="px-2 py-1 text-xs font-bold bg-background text-foreground border-2 border-foreground"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {expanded && (() => {
              const p = profiles.find((x) => x.id === expanded);
              if (!p) return null;
              return (
                <div className="retro-card mt-6 p-6">
                  <h3 className="font-bold uppercase tracking-wider text-sm mb-4">
                    {p.full_name} — Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-sm">
                    <div>
                      <p className="text-muted text-xs uppercase tracking-wider mb-1">Bio</p>
                      <p className="mb-4">{p.bio || 'No bio provided'}</p>

                      <p className="text-muted text-xs uppercase tracking-wider mb-1">Social Links</p>
                      <ul className="list-disc list-inside mb-4">
                        {parseJson(p.social_links).map((s: any, i: number) => (
                          <li key={i}><a href={s.url} target="_blank" className="text-secondary underline">{s.platform}</a></li>
                        ))}
                        {parseJson(p.social_links).length === 0 && <li className="text-muted">None</li>}
                      </ul>

                      <p className="text-muted text-xs uppercase tracking-wider mb-1">Portfolio</p>
                      <ul className="list-disc list-inside mb-4">
                        {parseJson(p.portfolio_links).map((pl: any, i: number) => (
                          <li key={i}><a href={pl.url} target="_blank" className="text-secondary underline">{pl.label}</a></li>
                        ))}
                        {parseJson(p.portfolio_links).length === 0 && <li className="text-muted">None</li>}
                      </ul>
                    </div>

                    <div>
                      <p className="text-muted text-xs uppercase tracking-wider mb-1">Demo Files</p>
                      {p.demos?.length ? (
                        <ul className="space-y-2 mb-4">
                          {p.demos.map((d) => (
                            <li key={d.id}>
                              <a
                                href={d.file_url}
                                target="_blank"
                                className="text-secondary underline text-xs"
                              >
                                ▶ {d.title || d.file_url.split('/').pop()}
                              </a>
                              <span className="text-muted ml-2">({d.file_type})</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted mb-4">No demo files uploaded</p>
                      )}

                      <p className="text-muted text-xs uppercase tracking-wider mb-1">Admin Notes</p>
                      <textarea
                        placeholder="Add notes before approving/rejecting..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm resize-y mb-3"
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatus(p.id, 'approved')}
                          className="px-4 py-2 text-xs font-bold bg-secondary text-background border-2 border-secondary"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatus(p.id, 'rejected')}
                          className="px-4 py-2 text-xs font-bold bg-primary text-background border-2 border-primary"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => setExpanded(null)}
                          className="px-4 py-2 text-xs font-bold bg-background text-foreground border-2 border-foreground"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
