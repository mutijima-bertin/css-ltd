'use client';

import { useEffect, useState } from 'react';
import { fetchPortfolio, fetchFeaturedPortfolio } from '@/lib/api';

type PortfolioItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  media_url: string;
  thumbnail_url: string;
  youtube_url: string | null;
  is_featured: number;
};

const categories = ['all', 'photography', 'video', 'audio', 'event'];

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    const fn = activeCategory === 'all' ? fetchFeaturedPortfolio : () => fetchPortfolio(activeCategory);
    fn()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            <span className="text-primary">Portfolio</span>
          </h1>
          <p className="text-muted mt-2 font-mono text-sm">
            Highlights from our recent work
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-bold retro-border ${
                activeCategory === cat
                  ? 'bg-primary text-background'
                  : 'bg-background text-foreground hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="font-mono text-muted">
              <span className="text-secondary">$</span> loading portfolio...
              <span className="blink ml-1">_</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <div className="font-mono text-muted">
              <span className="text-secondary">$</span> No items found in this category.
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="retro-card overflow-hidden cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-video bg-gray-200 flex items-center justify-center text-muted text-sm">
                  {item.youtube_url ? (
                    <div className="w-full h-full bg-foreground/10 flex items-center justify-center">
                      <span className="text-4xl">▶</span>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-foreground/10 flex items-center justify-center">
                      <span className="text-4xl text-muted">📷</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs uppercase tracking-wider text-primary font-bold">{item.category}</span>
                  <h3 className="font-bold mt-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedItem && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="retro-card max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="float-right retro-border px-3 py-1 text-sm font-bold bg-background"
                >
                  ✕
                </button>
                <span className="text-xs uppercase tracking-wider text-primary font-bold">
                  {selectedItem.category}
                </span>
                <h2 className="text-2xl font-bold mt-1">{selectedItem.title}</h2>
                {selectedItem.description && (
                  <p className="text-muted mt-3">{selectedItem.description}</p>
                )}
                {selectedItem.youtube_url && (
                  <div className="mt-4 aspect-video bg-foreground/10 flex items-center justify-center">
                    <iframe
                      src={selectedItem.youtube_url}
                      className="w-full h-full"
                      allowFullScreen
                      title={selectedItem.title}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
