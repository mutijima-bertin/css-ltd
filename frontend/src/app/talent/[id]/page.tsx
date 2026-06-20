'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

function DemoPlayer({ demo }: { demo: Demo }) {
  const ext = demo.file_url.split('.').pop()?.toLowerCase() || '';
  const isAudio = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext) || demo.file_type === 'audio';
  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext) || demo.file_type === 'video';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || demo.file_type === 'image';

  if (isAudio) {
    return (
      <audio controls className="w-full max-w-md" preload="metadata">
        <source src={demo.file_url} />
      </audio>
    );
  }

  if (isVideo) {
    return (
      <video controls className="w-full max-w-lg rounded" preload="metadata">
        <source src={demo.file_url} />
      </video>
    );
  }

  if (isImage) {
    return (
      <a href={demo.file_url} target="_blank" rel="noopener noreferrer">
        <img src={demo.file_url} alt={demo.title || 'Demo'} className="max-w-sm rounded border-2 border-foreground" />
      </a>
    );
  }

  return (
    <a
      href={demo.file_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-secondary underline text-sm font-mono"
    >
      {demo.title || demo.file_url.split('/').pop()} ({demo.file_type})
    </a>
  );
}

export default function TalentProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`${API_BASE}/api/talent/${params.id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => setProfile(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const parseJson = (val: any) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  const parseSkillTags = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  if (loading) {
    return (
      <div className="retro-grid min-h-screen flex items-center justify-center py-12">
        <p className="font-mono text-muted"><span className="text-secondary">$</span> loading profile...<span className="blink ml-1">_</span></p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="retro-grid min-h-screen py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="retro-card p-8">
            <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-muted font-mono text-sm mb-6">
              This talent profile does not exist or is not yet approved.
            </p>
            <Link
              href="/talent/browse"
              className="retro-border bg-primary text-background px-8 py-3 font-bold text-sm uppercase tracking-wider inline-block"
            >
              Browse Talent
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tags = parseSkillTags(profile.skill_tags);
  const socialLinks = parseJson(profile.social_links);
  const portfolioLinks = parseJson(profile.portfolio_links);

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Link
          href="/talent/browse"
          className="text-secondary underline font-mono text-sm mb-6 inline-block"
        >
          &larr; Back to Directory
        </Link>

        <div className="retro-card p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-28 h-28 shrink-0 border-2 border-foreground overflow-hidden bg-foreground/10">
              {profile.profile_picture ? (
                <img src={profile.profile_picture} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-black text-3xl text-muted">
                  {profile.full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-1">
                {profile.full_name}
              </h1>
              {profile.location && (
                <p className="text-sm font-mono text-muted mb-2">{profile.location}</p>
              )}

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 text-xs font-bold uppercase border-2 border-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {profile.bio && (
            <div className="mt-6">
              <h3 className="text-xs uppercase tracking-wider font-bold text-muted mb-2">Bio</h3>
              <p className="font-mono text-sm whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}
        </div>

        {socialLinks.length > 0 && (
          <div className="retro-card p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wider font-bold text-muted mb-3">Social Links</h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((s: { platform: string; url: string }, i: number) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 border-2 border-foreground font-mono text-sm font-bold hover:bg-foreground hover:text-background transition-colors"
                >
                  {s.platform}
                </a>
              ))}
            </div>
          </div>
        )}

        {portfolioLinks.length > 0 && (
          <div className="retro-card p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wider font-bold text-muted mb-3">Portfolio</h3>
            <ul className="space-y-2">
              {portfolioLinks.map((pl: { label: string; url: string }, i: number) => (
                <li key={i}>
                  <a
                    href={pl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary underline font-mono text-sm"
                  >
                    {pl.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {profile.demos && profile.demos.length > 0 && (
          <div className="retro-card p-6 mb-6">
            <h3 className="text-xs uppercase tracking-wider font-bold text-muted mb-4">Demos</h3>
            <div className="space-y-4">
              {profile.demos.map((demo) => (
                <div key={demo.id}>
                  {demo.title && (
                    <p className="font-mono text-xs text-muted mb-1">{demo.title}</p>
                  )}
                  <DemoPlayer demo={demo} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/talent/browse"
            className="retro-border bg-primary text-background px-8 py-3 font-bold text-sm uppercase tracking-wider inline-block"
          >
            Browse All Talent
          </Link>
        </div>
      </div>
    </div>
  );
}
