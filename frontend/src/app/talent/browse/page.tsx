'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  profile_picture: string | null;
  skill_tags: string | string[] | null;
  social_links: string | { platform: string; url: string }[];
  portfolio_links: string | { label: string; url: string }[];
  status: string;
  demos: Demo[];
  created_at: string;
};

export default function TalentBrowsePage() {
  const [profiles, setProfiles] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/talent`)
      .then((r) => r.json())
      .then((data) => setProfiles(Array.isArray(data) ? data : []))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false));
  }, []);

  const parseSkillTags = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  if (loading) {
    return (
      <div className="retro-grid min-h-screen flex items-center justify-center py-12">
        <p className="font-mono text-muted"><span className="text-secondary">$</span> discovering talent...<span className="blink ml-1">_</span></p>
      </div>
    );
  }

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            Talent <span className="text-primary">Directory</span>
          </h1>
          <p className="text-muted mt-2 font-mono text-sm">
            Discover musicians, producers, engineers, and artists
          </p>
          <Link
            href="/talent"
            className="mt-4 inline-block retro-border px-6 py-2 text-xs font-bold bg-secondary text-background uppercase tracking-wider"
          >
            Register as Talent
          </Link>
        </div>

        {profiles.length === 0 ? (
          <div className="retro-card p-8 text-center">
            <p className="font-mono text-muted">No talent profiles available yet.</p>
            <Link href="/talent" className="mt-4 inline-block retro-border px-6 py-2 text-xs font-bold bg-secondary text-background uppercase tracking-wider">
              Be the First to Register
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((p) => {
              const tags = parseSkillTags(p.skill_tags);
              return (
                <Link
                  key={p.id}
                  href={`/talent/${p.id}`}
                  className="retro-card p-6 hover:border-secondary transition-colors group block"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 shrink-0 border-2 border-foreground overflow-hidden bg-foreground/10">
                      {p.profile_picture ? (
                        <img src={p.profile_picture} alt={p.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-xl text-muted">
                          {p.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg truncate group-hover:text-secondary transition-colors">
                        {p.full_name}
                      </h3>
                      {p.location && (
                        <p className="text-xs text-muted truncate">{p.location}</p>
                      )}
                    </div>
                  </div>

                  {p.bio && (
                    <p className="text-sm font-mono text-muted line-clamp-2 mb-3">
                      {p.bio}
                    </p>
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-[10px] font-bold uppercase border border-foreground">
                          {tag}
                        </span>
                      ))}
                      {tags.length > 4 && (
                        <span className="px-2 py-0.5 text-[10px] font-mono text-muted">
                          +{tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs font-mono text-muted">
                    <span>{p.demos?.length || 0} demo{(p.demos?.length || 0) !== 1 ? 's' : ''}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
