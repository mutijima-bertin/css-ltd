'use client';

import { useState } from 'react';
import { submitContact } from '@/lib/api';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      await submitContact(form);
      setStatus('success');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            Get in <span className="text-primary">Touch</span>
          </h1>
          <p className="text-muted mt-2 font-mono text-sm">
            Book a session, ask a question, or just say hello
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <form onSubmit={handleSubmit} className="retro-card p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider font-bold">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background text-foreground font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-bold">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background text-foreground font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-bold">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background text-foreground font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-bold">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background text-foreground font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider font-bold">Message *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background text-foreground font-mono text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'sending'}
                className={`w-full retro-border py-3 font-bold text-sm uppercase tracking-wider ${
                  status === 'sending'
                    ? 'bg-gray-400 text-background cursor-not-allowed'
                    : 'bg-primary text-background hover:bg-primary/90'
                }`}
              >
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>
              {status === 'success' && (
                <p className="text-secondary font-bold text-sm text-center">
                  Message sent successfully! We&apos;ll get back to you soon.
                </p>
              )}
              {status === 'error' && (
                <p className="text-primary font-bold text-sm text-center">
                  Failed to send. Please try again or reach us on WhatsApp.
                </p>
              )}
            </form>
          </div>

          <div className="space-y-6">
            <div className="retro-card p-6">
              <h3 className="font-bold uppercase tracking-wider mb-3">Visit Us</h3>
              <p className="text-sm text-muted font-mono">
                KK 780 St, Nyamirambo<br />
                Kigali, Rwanda
              </p>
              <div className="mt-3 aspect-video bg-gray-200 flex items-center justify-center text-muted text-sm retro-border">
                Google Maps
              </div>
            </div>

            <div className="retro-card p-6">
              <h3 className="font-bold uppercase tracking-wider mb-3">Quick Contact</h3>
              <a
                href="https://wa.me/250780000000"
                target="_blank"
                rel="noopener noreferrer"
                className="retro-border bg-secondary text-background px-6 py-3 font-bold text-sm uppercase tracking-wider inline-block hover:bg-secondary/90 transition-colors"
              >
                WhatsApp Us
              </a>
              <p className="text-xs text-muted mt-3 font-mono">
                Prefer WhatsApp? We typically respond within minutes during business hours.
              </p>
            </div>

            <div className="retro-card p-6">
              <h3 className="font-bold uppercase tracking-wider mb-3">Studio Hours</h3>
              <div className="text-sm text-muted font-mono space-y-1">
                <p>Mon — Fri: 9:00 AM — 8:00 PM</p>
                <p>Saturday: 10:00 AM — 6:00 PM</p>
                <p>Sunday: By appointment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
