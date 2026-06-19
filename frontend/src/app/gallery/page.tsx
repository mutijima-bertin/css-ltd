'use client';

import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type GalleryItem = {
  id: number;
  title: string;
  description: string;
  media_url: string;
  media_type: 'image' | 'video';
  category: string;
  featured: number;
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/gallery${activeCat ? `?category=${activeCat}` : ''}`).then((r) => r.json()),
      fetch(`${API_BASE}/api/gallery/categories`).then((r) => r.json()),
    ])
      .then(([itemsData, cats]) => {
        setItems(itemsData);
        setCategories(cats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCat]);

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            Studio <span className="text-primary">Gallery</span>
          </h1>
          <p className="text-muted mt-2 font-mono text-sm">
            Take a look inside Creative Sound Studio
          </p>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveCat('')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider retro-border ${
                !activeCat ? 'bg-primary text-background' : 'bg-background text-foreground'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider retro-border ${
                  activeCat === cat ? 'bg-primary text-background' : 'bg-background text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 font-mono text-muted">
            <span className="text-secondary">$</span> loading gallery...
            <span className="blink ml-1">_</span>
          </div>
        ) : items.length === 0 ? (
          <div className="retro-card p-8 text-center">
            <p className="font-mono text-muted">Gallery is empty — coming soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="retro-card overflow-hidden cursor-pointer group"
                onClick={() => setLightbox(item)}
              >
                {item.media_type === 'video' ? (
                  <div className="relative aspect-video bg-foreground/10 flex items-center justify-center">
                    <video
                      src={item.media_url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center text-background text-2xl">
                        ▶
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-foreground/10">
                    <img
                      src={item.media_url}
                      alt={item.title || 'Gallery image'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                {item.title && (
                  <div className="p-3">
                    <p className="font-bold text-sm">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-muted mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {lightbox && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <div
              className="max-w-4xl w-full max-h-[90vh] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLightbox(null)}
                className="absolute -top-10 right-0 text-white font-mono text-sm hover:text-accent"
              >
                Close [X]
              </button>
              {lightbox.media_type === 'video' ? (
                <video
                  src={lightbox.media_url}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh] object-contain"
                />
              ) : (
                <img
                  src={lightbox.media_url}
                  alt={lightbox.title || 'Gallery image'}
                  className="w-full max-h-[80vh] object-contain"
                />
              )}
              {lightbox.title && (
                <div className="mt-3 text-white text-center">
                  <p className="font-bold">{lightbox.title}</p>
                  {lightbox.description && (
                    <p className="text-sm text-white/70 mt-1">{lightbox.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
