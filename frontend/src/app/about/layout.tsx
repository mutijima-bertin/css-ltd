import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Creative Sound Studio Ltd',
  description: 'Learn about Creative Sound Studio Ltd, a professional multimedia production house based in Nyamirambo, Kigali, Rwanda.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
