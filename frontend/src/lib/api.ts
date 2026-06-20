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

export async function fetchSlots(date?: string) {
  const url = date ? `${API_BASE}/bookings/slots?date=${date}` : `${API_BASE}/bookings/slots`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch slots');
  return res.json();
}

export async function createBooking(data: {
  client_name: string;
  client_email: string;
  client_phone: string;
  country_code?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
}) {
  const token = localStorage.getItem('css_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Please login to book a session');
    const err = await res.json().catch(() => ({ error: 'Failed to create booking' }));
    throw new Error(err.error);
  }
  return res.json();
}

export async function fetchAllBookings() {
  const res = await fetch(`${API_BASE}/bookings`);
  if (!res.ok) throw new Error('Failed to fetch bookings');
  return res.json();
}

export async function fetchBooking(id: number) {
  const res = await fetch(`${API_BASE}/bookings/${id}`);
  if (!res.ok) throw new Error('Booking not found');
  return res.json();
}

export async function fetchGallery(category?: string) {
  const url = category ? `${API_BASE}/gallery?category=${category}` : `${API_BASE}/gallery`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch gallery');
  return res.json();
}

export async function fetchGalleryCategories() {
  const res = await fetch(`${API_BASE}/gallery/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function verifyPayment(txRef: string) {
  const token = localStorage.getItem('css_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/bookings/verify-payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tx_ref: txRef }),
  });
  if (!res.ok) throw new Error('Payment verification failed');
  return res.json();
}

export async function retryPayment(bookingId: number) {
  const token = localStorage.getItem('css_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/retry-payment`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) throw new Error('Failed to retry payment');
  return res.json();
}

export async function fetchPayments(bookingId: number) {
  const res = await fetch(`${API_BASE}/bookings/${bookingId}/payments`);
  if (!res.ok) throw new Error('Failed to fetch payments');
  return res.json();
}
