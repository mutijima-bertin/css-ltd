'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type GalleryItem = {
  id: number;
  title: string;
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  category: string;
  featured: number;
  sort_order: number;
  created_at: string;
};

export default function AdminGalleryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', featured: false, sort_order: 0 });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }
    loadItems();
  }, [user, authLoading, router]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/gallery`);
      setItems(await res.json());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileRef.current?.files?.length) return;
    setUploading(true);
    setStatus('');
    try {
      const fd = new FormData();
      fd.append('media', fileRef.current.files[0]);
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('featured', form.featured ? 'true' : 'false');
      fd.append('sort_order', String(form.sort_order));

      const res = await fetch(`${API_BASE}/api/gallery`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Upload failed');

      setForm({ title: '', description: '', category: '', featured: false, sort_order: 0 });
      if (fileRef.current) fileRef.current.value = '';
      loadItems();
    } catch (e: any) {
      setStatus(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item permanently?')) return;
    try {
      const token = localStorage.getItem('css_token');
      await fetch(`${API_BASE}/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadItems();
    } catch {
      setStatus('Delete failed');
    }
  };

  const handleToggleFeatured = async (item: GalleryItem) => {
    try {
      const token = localStorage.getItem('css_token');
      await fetch(`${API_BASE}/api/gallery/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ featured: !item.featured }),
      });
      loadItems();
    } catch {
      setStatus('Update failed');
    }
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
          <h1 className="text-3xl font-black uppercase tracking-tight"><span className="text-primary">Gallery</span> Admin</h1>
          <Link href="/" className="retro-border px-4 py-2 text-xs font-bold bg-background text-foreground uppercase tracking-wider">Home</Link>
        </div>

        <div className="retro-card p-6 mb-8">
          <h2 className="font-bold uppercase tracking-wider text-sm mb-4">Upload Media</h2>
          <form onSubmit={handleUpload} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" placeholder="Title" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
              <input type="text" placeholder="Category (e.g. Recording, Mixing)" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
              <input type="number" placeholder="Sort order" value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
            </div>
            <textarea placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm resize-y" />
            <div className="flex items-center gap-4">
              <input ref={fileRef} type="file" accept="image/*,video/*" required
                className="flex-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm file:mr-3 file:py-1 file:px-3 file:border-2 file:border-foreground file:bg-background file:font-mono file:text-sm file:cursor-pointer" />
              <label className="flex items-center gap-2 text-xs font-mono">
                <input type="checkbox" checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                Featured
              </label>
              <button type="submit" disabled={uploading}
                className="retro-border bg-primary text-background px-6 py-2 font-bold text-sm uppercase tracking-wider disabled:bg-gray-300">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
            {status && <p className="text-sm font-bold font-mono mt-2" style={{ color: status.startsWith('Delete') || status.startsWith('Update') || status.startsWith('Upload') || status.startsWith('Failed') ? '#c8412b' : '#2d5a27' }}>{status}</p>}
          </form>
        </div>

        {loading ? (
          <div className="text-center py-12 font-mono text-muted">
            <span className="text-secondary">$</span> loading gallery...<span className="blink ml-1">_</span>
          </div>
        ) : items.length === 0 ? (
          <div className="retro-card p-8 text-center"><p className="font-mono text-muted">Gallery is empty.</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="retro-card overflow-hidden">
                {item.media_type === 'video' ? (
                  <video src={item.media_url} className="w-full aspect-video object-cover" preload="metadata" />
                ) : (
                  <img src={item.media_url} alt={item.title || ''} className="w-full aspect-video object-cover" />
                )}
                <div className="p-3">
                  <p className="font-bold text-xs truncate">{item.title || 'Untitled'}</p>
                  <p className="text-xs text-muted">{item.category || 'No category'} {item.featured ? '★' : ''}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleToggleFeatured(item)}
                      className="text-xs px-2 py-1 border-2 border-foreground bg-background font-bold">
                      {item.featured ? 'Unfeature' : 'Feature'}
                    </button>
                    <button onClick={() => handleDelete(item.id)}
                      className="text-xs px-2 py-1 border-2 border-primary bg-background text-primary font-bold">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
