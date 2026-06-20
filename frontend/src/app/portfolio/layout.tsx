import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio | Creative Sound Studio Ltd',
  description: 'View our portfolio of music production, photography, videography, and event coverage work in Kigali, Rwanda.',
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
