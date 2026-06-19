'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const sections = [
  { href: '/admin/bookings', label: 'Bookings', desc: 'View and manage client bookings', color: 'text-secondary' },
  { href: '/admin/talent', label: 'Talent', desc: 'Review talent profiles and demo submissions', color: 'text-accent' },
  { href: '/admin/gallery', label: 'Gallery', desc: 'Upload and manage media gallery', color: 'text-primary' },
  { href: '/admin/services', label: 'Services', desc: 'Manage service offerings and pricing', color: 'text-secondary' },
  { href: '/admin/portfolio', label: 'Portfolio', desc: 'Manage portfolio showcase items', color: 'text-accent' },
  { href: '/admin/messages', label: 'Messages', desc: 'Read contact form submissions', color: 'text-primary' },
];

export default function AdminLandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="retro-grid min-h-screen flex items-center justify-center py-12">
        <p className="font-mono text-muted">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">
            <span className="text-primary">Admin</span> Dashboard
          </h1>
          <Link href="/" className="retro-border px-4 py-2 text-xs font-bold bg-background text-foreground uppercase tracking-wider">Home</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="retro-card p-6 block hover:bg-foreground hover:text-background transition-colors group">
              <h2 className={`text-xl font-black uppercase tracking-tight ${s.color} group-hover:text-background`}>{s.label}</h2>
              <p className="text-xs font-mono text-muted mt-2 group-hover:text-background">{s.desc}</p>
              <div className="mt-4 text-xs font-bold uppercase tracking-wider text-secondary group-hover:text-background">&gt; Enter</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
