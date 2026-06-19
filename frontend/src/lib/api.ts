const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function fetchServices(category?: string) {
  const url = category ? `${API_BASE}/services?category=${category}` : `${API_BASE}/services`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch services');
  return res.json();
}

export async function fetchPortfolio(category?: string) {
  const url = category ? `${API_BASE}/portfolio?category=${category}` : `${API_BASE}/portfolio`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch portfolio');
  return res.json();
}

export async function fetchFeaturedPortfolio() {
  const res = await fetch(`${API_BASE}/portfolio/featured`);
  if (!res.ok) throw new Error('Failed to fetch featured portfolio');
  return res.json();
}

export async function submitContact(data: { name: string; email: string; phone?: string; subject?: string; message: string }) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}
