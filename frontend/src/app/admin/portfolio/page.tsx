'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type PortfolioItem = {
  id: number;
  title: string;
  category: string;
  description: string | null;
  media_url: string;
  thumbnail_url: string | null;
  youtube_url: string | null;
  is_featured: number;
  created_at: string;
};

export default function AdminPortfolioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [form, setForm] = useState({ title: '', category: '', description: '', media_url: '', thumbnail_url: '', youtube_url: '', is_featured: false });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    loadItems();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!editing) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditing(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editing]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/portfolio`);
      setItems(await res.json());
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.category || !form.media_url) { setStatus('Title, category, and media URL required'); return; }
    setSaving(true);
    setStatus('');
    try {
      const token = localStorage.getItem('css_token');
      const res = await fetch(`${API_BASE}/api/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed');
      setForm({ title: '', category: '', description: '', media_url: '', thumbnail_url: '', youtube_url: '', is_featured: false });
      loadItems();
    } catch { setStatus('Failed to create portfolio item'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (id: number) => {
    setSaving(true);
    setStatus('');
    try {
      const token = localStorage.getItem('css_token');
      const res = await fetch(`${API_BASE}/api/portfolio/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error('Failed');
      setEditing(null);
      loadItems();
    } catch { setStatus('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this portfolio item?')) return;
    try {
      const token = localStorage.getItem('css_token');
      await fetch(`${API_BASE}/api/portfolio/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      loadItems();
    } catch { setStatus('Failed to delete'); }
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
          <h1 className="text-3xl font-black uppercase tracking-tight"><span className="text-primary">Portfolio</span> Admin</h1>
          <div className="flex gap-2">
            <Link href="/admin" className="retro-border px-4 py-2 text-xs font-bold bg-background text-foreground uppercase tracking-wider">Admin</Link>
            <Link href="/" className="retro-border px-4 py-2 text-xs font-bold bg-background text-foreground uppercase tracking-wider">Home</Link>
          </div>
        </div>

        <div className="retro-card p-6 mb-8">
          <h2 className="font-bold uppercase tracking-wider text-sm mb-4">Add Portfolio Item</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="text" placeholder="Title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
              <input type="text" placeholder="Category (e.g. recording, music-video)" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
            </div>
            <input type="url" placeholder="Media URL" value={form.media_url}
              onChange={(e) => setForm({ ...form, media_url: e.target.value })}
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="url" placeholder="Thumbnail URL (optional)" value={form.thumbnail_url}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
              <input type="url" placeholder="YouTube URL (optional)" value={form.youtube_url}
                onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
            </div>
            <textarea placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm resize-y" />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-mono">
                <input type="checkbox" checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                Featured
              </label>
              <button type="submit" disabled={saving}
                className="retro-border bg-primary text-background px-6 py-2 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300">
                {saving ? 'Creating...' : 'Create'}
              </button>
            </div>
            {status && <p className="text-sm font-bold font-mono mt-2" style={{ color: status.includes('Failed') || status.includes('required') ? '#c8412b' : '#2d5a27' }}>{status}</p>}
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12 font-mono text-muted">
            <span className="text-secondary">$</span> loading portfolio...<span className="blink ml-1">_</span>
          </div>
        ) : items.length === 0 ? (
          <div className="retro-card p-8 text-center"><p className="font-mono text-muted">No portfolio items yet.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full retro-border text-sm font-mono">
              <thead>
                <tr className="bg-foreground text-background">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Media</th>
                  <th className="p-3 text-left">Featured</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t-2 border-foreground bg-background">
                    <td className="p-3 font-bold">{item.id}</td>
                    <td className="p-3 font-bold">{item.title}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3">
                      <a href={item.media_url} target="_blank" className="text-secondary underline text-xs">View</a>
                      {item.youtube_url && <a href={item.youtube_url} target="_blank" className="text-primary underline text-xs ml-2">YouTube</a>}
                    </td>
                    <td className="p-3">{item.is_featured ? '★' : '—'}</td>
                    <td className="p-3 text-xs">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(item)}
                          className="px-2 py-1 text-xs font-bold bg-accent text-foreground border-2 border-accent">Edit</button>
                        <button onClick={() => handleDelete(item.id)}
                          className="px-2 py-1 text-xs font-bold bg-background text-foreground border-2 border-foreground">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="retro-card p-6 w-full max-w-lg">
              <h3 className="font-bold uppercase tracking-wider text-sm mb-4">Edit Portfolio Item</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Title" value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                <input type="text" placeholder="Category" value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                <input type="url" placeholder="Media URL" value={editing.media_url}
                  onChange={(e) => setEditing({ ...editing, media_url: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="url" placeholder="Thumbnail URL" value={editing.thumbnail_url || ''}
                    onChange={(e) => setEditing({ ...editing, thumbnail_url: e.target.value })}
                    className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                  <input type="url" placeholder="YouTube URL" value={editing.youtube_url || ''}
                    onChange={(e) => setEditing({ ...editing, youtube_url: e.target.value })}
                    className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                </div>
                <textarea placeholder="Description" value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm resize-y" />
                <label className="flex items-center gap-2 text-xs font-mono">
                  <input type="checkbox" checked={!!editing.is_featured}
                    onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked ? 1 : 0 })} />
                  Featured
                </label>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(editing.id)} disabled={saving}
                    className="px-4 py-2 text-xs font-bold bg-secondary text-background border-2 border-secondary disabled:bg-gray-300">{saving ? 'Saving...' : 'Save'}</button>
                  <button onClick={() => setEditing(null)}
                    className="px-4 py-2 text-xs font-bold bg-background text-foreground border-2 border-foreground">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
