'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Message = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: number;
  created_at: string;
};

export default function AdminMessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { router.push('/login'); return; }
    loadMessages();
  }, [user, authLoading, router]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('css_token');
      const res = await fetch(`${API_BASE}/api/contact`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(await res.json());
    } catch { setMessages([]); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id: number) => {
    try {
      const token = localStorage.getItem('css_token');
      await fetch(`${API_BASE}/api/contact/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadMessages();
    } catch { alert('Failed to mark as read'); }
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
          <h1 className="text-3xl font-black uppercase tracking-tight"><span className="text-primary">Messages</span> Admin</h1>
          <div className="flex gap-2">
            <Link href="/admin" className="retro-border px-4 py-2 text-xs font-bold bg-background text-foreground uppercase tracking-wider">Admin</Link>
            <Link href="/" className="retro-border px-4 py-2 text-xs font-bold bg-background text-foreground uppercase tracking-wider">Home</Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 font-mono text-muted">
            <span className="text-secondary">$</span> loading messages...<span className="blink ml-1">_</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="retro-card p-8 text-center"><p className="font-mono text-muted">No messages yet.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full retro-border text-sm font-mono">
              <thead>
                <tr className="bg-foreground text-background">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">From</th>
                  <th className="p-3 text-left">Subject</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className={`border-t-2 border-foreground bg-background ${!m.is_read ? 'font-bold' : ''}`}>
                    <td className="p-3">{m.id}</td>
                    <td className="p-3">
                      <p>{m.name}</p>
                      <p className="text-xs text-muted">{m.email}</p>
                      {m.phone && <p className="text-xs text-muted">{m.phone}</p>}
                    </td>
                    <td className="p-3">{m.subject || '—'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-bold uppercase ${m.is_read ? 'bg-secondary text-background' : 'bg-accent text-foreground'}`}>
                        {m.is_read ? 'Read' : 'New'}
                      </span>
                    </td>
                    <td className="p-3 text-xs">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <button onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                          className="px-2 py-1 text-xs font-bold bg-accent text-foreground border-2 border-accent">
                          {expanded === m.id ? 'Hide' : 'View'}
                        </button>
                        {!m.is_read && (
                          <button onClick={() => handleMarkRead(m.id)}
                            className="px-2 py-1 text-xs font-bold bg-secondary text-background border-2 border-secondary">
                            Mark Read
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {expanded && (() => {
              const m = messages.find((x) => x.id === expanded);
              if (!m) return null;
              return (
                <div className="retro-card mt-6 p-6">
                  <h3 className="font-bold uppercase tracking-wider text-sm mb-4">Message from {m.name}</h3>
                  <div className="font-mono text-sm space-y-3">
                    <p><span className="text-muted">Email:</span> {m.email}</p>
                    {m.phone && <p><span className="text-muted">Phone:</span> {m.phone}</p>}
                    {m.subject && <p><span className="text-muted">Subject:</span> {m.subject}</p>}
                    <div className="pt-3 border-t-2 border-foreground">
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>
                    <div className="flex gap-2 pt-3">
                      <a href={`mailto:${m.email}`}
                        className="px-4 py-2 text-xs font-bold bg-secondary text-background border-2 border-secondary">Reply via Email</a>
                      {!m.is_read && (
                        <button onClick={() => { handleMarkRead(m.id); setExpanded(null); }}
                          className="px-4 py-2 text-xs font-bold bg-background text-foreground border-2 border-foreground">Mark as Read</button>
                      )}
                      <button onClick={() => setExpanded(null)}
                        className="px-4 py-2 text-xs font-bold bg-background text-foreground border-2 border-foreground">Close</button>
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
