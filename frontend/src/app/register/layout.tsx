import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register | Creative Sound Studio Ltd',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
