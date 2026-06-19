'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { fetchSlots, createBooking } from '@/lib/api';

type Slot = {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
};

const RATES: Record<number, number> = { 2: 50000, 4: 90000 };

const COUNTRIES = [
  { code: '250', flag: '🇷🇼', name: 'Rwanda' },
  { code: '254', flag: '🇰🇪', name: 'Kenya' },
  { code: '256', flag: '🇺🇬', name: 'Uganda' },
  { code: '255', flag: '🇹🇿', name: 'Tanzania' },
  { code: '233', flag: '🇬🇭', name: 'Ghana' },
  { code: '234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '260', flag: '🇿🇲', name: 'Zambia' },
  { code: '27', flag: '🇿🇦', name: 'South Africa' },
  { code: '257', flag: '🇧🇮', name: 'Burundi' },
  { code: '243', flag: '🇨🇩', name: 'DR Congo' },
  { code: '1', flag: '🇺🇸', name: 'United States' },
  { code: '44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '33', flag: '🇫🇷', name: 'France' },
  { code: '49', flag: '🇩🇪', name: 'Germany' },
  { code: '86', flag: '🇨🇳', name: 'China' },
];

function ErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="retro-card max-w-md w-full mx-4 p-6 text-center relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-4xl mb-3">⚠</div>
        <h3 className="text-lg font-bold uppercase tracking-wider mb-2">Error</h3>
        <p className="text-muted font-mono text-sm mb-6">{message}</p>
        <button
          onClick={onClose}
          className="retro-border bg-primary text-background px-6 py-2 font-bold text-sm uppercase tracking-wider"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [duration, setDuration] = useState(2);
  const [countryCode, setCountryCode] = useState('250');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login?redirect=/booking'); return; }
    if (user) {
      setForm({ name: user.full_name, email: user.email, phone: user.phone || '' });
    }
  }, [user, authLoading, router]);
  const [step, setStep] = useState<'date' | 'slot' | 'info' | 'confirm'>('date');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setSelectedSlot(null);
    setStep('date');
    fetchSlots(selectedDate)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const handleBook = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    setError('');
    try {
      const dateOnly = selectedSlot.date.slice(0, 10);
      const timeStart = selectedSlot.start_time.slice(0, 8);
      const timeEnd = selectedSlot.end_time.slice(0, 8);
      const fullPhone = `${countryCode}${form.phone.replace(/[^0-9]/g, '')}`;
      const res = await createBooking({
        client_name: form.name,
        client_email: form.email,
        client_phone: fullPhone,
        country_code: countryCode,
        booking_date: dateOnly,
        start_time: timeStart,
        end_time: timeEnd,
        duration_hours: duration,
      });
      setResult(res);
      setStep('confirm');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deposit = RATES[duration] ? Math.round(RATES[duration] * 0.5) : 0;

  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            Book the <span className="text-primary">Studio</span>
          </h1>
          <p className="text-muted mt-2 font-mono text-sm">
            Reserve your session in 3 easy steps
          </p>
        </div>

        {authLoading ? (
          <div className="retro-grid min-h-screen flex items-center justify-center py-12">
            <p className="font-mono text-muted"><span className="text-secondary">$</span> loading...<span className="blink ml-1">_</span></p>
          </div>
        ) : step === 'confirm' && result ? (
          <div className="retro-card p-8 text-center">
            <div className="text-5xl mb-4">🎧</div>
            <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
            <p className="text-muted mb-6 font-mono text-sm">
              Your session is reserved. Complete the deposit to lock it in.
            </p>
            <div className="bg-foreground/5 p-4 font-mono text-sm space-y-1 mb-6 text-left">
              <p><span className="font-bold">Reference:</span> #{result.booking_id}</p>
              <p><span className="font-bold">Date:</span> {selectedSlot?.date}</p>
              <p><span className="font-bold">Time:</span> {selectedSlot?.start_time?.slice(0, 5)} - {selectedSlot?.end_time?.slice(0, 5)}</p>
              <p><span className="font-bold">Phone:</span> {COUNTRIES.find((c) => c.code === countryCode)?.flag} +{countryCode} {form.phone}</p>
              <p><span className="font-bold">Deposit:</span> {deposit.toLocaleString()} RWF</p>
              <p><span className="font-bold">Total:</span> {RATES[duration].toLocaleString()} RWF</p>
            </div>
            {result.payment_link ? (
              <a
                href={result.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="retro-border bg-secondary text-background px-8 py-3 font-bold text-sm uppercase tracking-wider inline-block hover:bg-secondary/90"
              >
                Pay Deposit via MTN MoMo / Airtel Money
              </a>
            ) : result.payment_instruction ? (
              <div className="retro-border bg-secondary text-background px-6 py-4 font-bold text-sm text-center">
                {result.payment_instruction}
              </div>
            ) : (
              <div className="retro-border bg-primary text-background px-6 py-3 font-bold text-sm">
                Payment gateway pending — we&apos;ll contact you shortly
              </div>
            )}
            <p className="text-xs text-muted mt-4">
              A confirmation email will be sent to {form.email}
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-2 mb-8">
              {['date', 'slot', 'info'].map((s, i) => (
                <div
                  key={s}
                  className={`px-4 py-2 text-xs uppercase tracking-wider font-bold retro-border ${
                    step === s ? 'bg-primary text-background' : 'bg-background text-foreground'
                  }`}
                >
                  {i + 1}. {s === 'date' ? 'Pick Date' : s === 'slot' ? 'Choose Time' : 'Your Info'}
                </div>
              ))}
            </div>

            <div className="retro-card p-6 mb-6">
              <label className="text-xs uppercase tracking-wider font-bold">Select Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                max={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
                className="w-full mt-1 px-3 py-2 border-2 border-foreground bg-background text-foreground font-mono text-sm"
              />
            </div>

            {loading && (
              <div className="text-center py-8 font-mono text-muted">
                <span className="text-secondary">$</span> loading slots...
                <span className="blink ml-1">_</span>
              </div>
            )}

            {!loading && slots.length === 0 && (
              <div className="retro-card p-8 text-center">
                <p className="font-mono text-muted">No available slots for this date.</p>
                <p className="text-xs text-muted mt-2">Try another date or contact us on WhatsApp.</p>
              </div>
            )}

            {!loading && slots.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {slots.map((slot) => {
                    const start = slot.start_time.slice(0, 5);
                    const end = slot.end_time.slice(0, 5);
                    const isSelected = selectedSlot?.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        onClick={() => {
                          setSelectedSlot(slot);
                          setStep('slot');
                        }}
                        className={`retro-border px-4 py-3 text-sm font-bold font-mono transition-colors ${
                          isSelected
                            ? 'bg-primary text-background'
                            : 'bg-background text-foreground hover:bg-gray-100'
                        }`}
                      >
                        {start} - {end}
                      </button>
                    );
                  })}
                </div>

                {selectedSlot && (
                  <div className="retro-card p-6">
                    <h3 className="font-bold uppercase tracking-wider mb-4 text-sm">
                      Selected: {selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}
                    </h3>

                    <div className="mb-4">
                      <label className="text-xs uppercase tracking-wider font-bold">Duration</label>
                      <div className="flex gap-2 mt-1">
                        {[2, 4].map((h) => (
                          <button
                            key={h}
                            onClick={() => setDuration(h)}
                            className={`retro-border px-6 py-2 text-sm font-bold ${
                              duration === h ? 'bg-primary text-background' : 'bg-background text-foreground'
                            }`}
                          >
                            {h} hrs — {RATES[h].toLocaleString()} RWF
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-foreground/5 p-3 font-mono text-sm mb-4">
                      <p>Deposit (50%): <strong>{deposit.toLocaleString()} RWF</strong></p>
                      <p>Balance at session: <strong>{(RATES[duration] - deposit).toLocaleString()} RWF</strong></p>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
                      />
                      <label className="text-xs uppercase tracking-wider font-bold mb-1 block">
                        Phone Number
                      </label>
                      <div className="flex gap-0">
                        <div className="relative">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="appearance-none px-2 py-2 border-2 border-r-0 border-foreground bg-background font-mono text-sm cursor-pointer h-[42px]"
                          >
                            {COUNTRIES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.flag} +{c.code}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="tel"
                          placeholder="XX XXX XXXX"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="flex-1 px-3 py-2 border-2 border-foreground bg-background font-mono text-sm"
                        />
                      </div>
                    </div>

                    {error && <ErrorModal message={error} onClose={() => setError('')} />}

                    <button
                      onClick={handleBook}
                      disabled={loading || !form.name || !form.email || !form.phone}
                      className={`w-full retro-border py-3 font-bold text-sm uppercase tracking-wider mt-4 ${
                        loading || !form.name || !form.email || !form.phone
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-primary text-background hover:bg-primary/90'
                      }`}
                    >
                      {loading ? 'Booking...' : `Book — Pay ${deposit.toLocaleString()} RWF deposit`}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
