import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Talent Portal | Creative Sound Studio Ltd',
  description: 'Submit your talent profile to Creative Sound Studio. Musicians, producers, and creatives in Kigali, Rwanda.',
};

export default function TalentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
