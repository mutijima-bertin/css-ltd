import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Creative Sound Studio Ltd',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
