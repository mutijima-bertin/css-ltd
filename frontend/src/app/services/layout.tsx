import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services | Creative Sound Studio Ltd',
  description: 'Explore our professional audio recording, mixing, mastering, photography, and video production services in Kigali, Rwanda.',
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
