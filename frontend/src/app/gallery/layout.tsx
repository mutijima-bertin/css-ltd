import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gallery | Creative Sound Studio Ltd',
  description: 'Browse our gallery of studio sessions, events, and multimedia projects at Creative Sound Studio in Kigali.',
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
