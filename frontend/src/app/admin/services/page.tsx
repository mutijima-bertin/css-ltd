'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Service = {
  id: number;
  name: string;
  description: string;
  price: number | null;
  price_unit: string;
  category: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
};

export default function AdminServicesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', price_unit: 'RWF', category: '', sort_order: 0 });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    loadServices();
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!editing) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditing(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editing]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/services`);
      setServices(await res.json());
    } catch { setServices([]); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) { setStatus('Name and description required'); return; }
    setSaving(true);
    setStatus('');
    try {
      const token = localStorage.getItem('css_token');
      const res = await fetch(`${API_BASE}/api/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, price: form.price ? Number(form.price) : null }),
      });
      if (!res.ok) throw new Error('Failed');
      setForm({ name: '', description: '', price: '', price_unit: 'RWF', category: '', sort_order: 0 });
      loadServices();
    } catch { setStatus('Failed to create service'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (id: number) => {
    setSaving(true);
    setStatus('');
    try {
      const token = localStorage.getItem('css_token');
      const res = await fetch(`${API_BASE}/api/services/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...editing, price: editing?.price || null }),
      });
      if (!res.ok) throw new Error('Failed');
      setEditing(null);
      loadServices();
    } catch { setStatus('Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this service?')) return;
    try {
      const token = localStorage.getItem('css_token');
      await fetch(`${API_BASE}/api/services/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      loadServices();
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
          <h1 className="text-3xl font-black uppercase tracking-tight"><span className="text-primary">Services</span> Admin</h1>
          <div className="flex gap-2">
            <Link href="/admin" className="retro-border px-4 py-2 text-xs font-bold bg-background text-foreground uppercase tracking-wider">Admin</Link>
            <Link href="/" className="retro-border px-4 py-2 text-xs font-bold bg-background text-foreground uppercase tracking-wider">Home</Link>
          </div>
        </div>

        <div className="retro-card p-6 mb-8">
          <h2 className="font-bold uppercase tracking-wider text-sm mb-4">Add Service</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="text" placeholder="Name" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
              <input type="text" placeholder="Category (e.g. recording, mixing)" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
              <div className="flex gap-2">
                <input type="number" placeholder="Price" value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="flex-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                <select value={form.price_unit}
                  onChange={(e) => setForm({ ...form, price_unit: e.target.value })}
                  className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm">
                  <option>RWF</option><option>USD</option>
                </select>
              </div>
            </div>
            <textarea placeholder="Description" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm resize-y" />
            <div className="flex items-center gap-4">
              <input type="number" placeholder="Sort order" value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-32 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
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
            <span className="text-secondary">$</span> loading services...<span className="blink ml-1">_</span>
          </div>
        ) : services.length === 0 ? (
          <div className="retro-card p-8 text-center"><p className="font-mono text-muted">No services yet.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full retro-border text-sm font-mono">
              <thead>
                <tr className="bg-foreground text-background">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Sort</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-t-2 border-foreground bg-background">
                    <td className="p-3 font-bold">{s.id}</td>
                    <td className="p-3 font-bold">{s.name}</td>
                    <td className="p-3">{s.category || '—'}</td>
                    <td className="p-3">{s.price ? `${Number(s.price).toLocaleString()} ${s.price_unit}` : '—'}</td>
                    <td className="p-3">{s.sort_order}</td>
                    <td className="p-3 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(s)}
                          className="px-2 py-1 text-xs font-bold bg-accent text-foreground border-2 border-accent">Edit</button>
                        <button onClick={() => handleDelete(s.id)}
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
              <h3 className="font-bold uppercase tracking-wider text-sm mb-4">Edit Service</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Name" value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                <input type="text" placeholder="Category" value={editing.category || ''}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                <div className="flex gap-2">
                  <input type="number" placeholder="Price" value={editing.price ?? ''}
                    onChange={(e) => setEditing({ ...editing, price: e.target.value ? Number(e.target.value) : null })}
                    className="flex-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
                  <select value={editing.price_unit}
                    onChange={(e) => setEditing({ ...editing, price_unit: e.target.value })}
                    className="px-3 py-2 border-2 border-foreground bg-background font-mono text-sm">
                    <option>RWF</option><option>USD</option>
                  </select>
                </div>
                <textarea placeholder="Description" value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm resize-y" />
                <input type="number" placeholder="Sort order" value={editing.sort_order}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm" />
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
