import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book the Studio | Creative Sound Studio Ltd',
  description: 'Reserve your recording or production session at Creative Sound Studio in Kigali. Choose your date, time, and duration.',
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
