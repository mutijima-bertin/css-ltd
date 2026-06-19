'use client';

import { useEffect, useState } from 'react';
import { fetchServices } from '@/lib/api';

type Service = {
  id: number;
  name: string;
  description: string;
  price: string;
  price_unit: string;
  category: string;
};

const categories = ['all', 'audio', 'photography', 'video'];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices(activeCategory === 'all' ? undefined : activeCategory)
      .then(setServices)
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            Services &amp; <span className="text-primary">Pricing</span>
          </h1>
          <p className="text-muted mt-2 font-mono text-sm">
            Professional multimedia production services in Kigali
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
              <span className="text-secondary">$</span> loading prices...
              <span className="blink ml-1">_</span>
            </div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <div className="font-mono text-muted">
              <span className="text-secondary">$</span> No services listed yet.
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div key={service.id} className="retro-card p-6 flex flex-col">
                <span className="text-xs uppercase tracking-wider text-primary font-bold">
                  {service.category}
                </span>
                <h3 className="text-xl font-bold mt-1">{service.name}</h3>
                <p className="text-sm text-muted mt-2 flex-1">{service.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-black">
                    {Number(service.price).toLocaleString()}{' '}
                    <span className="text-sm font-normal text-muted">{service.price_unit}</span>
                  </span>
                  <span className="text-xs text-muted font-mono">{service.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
