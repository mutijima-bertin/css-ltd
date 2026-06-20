import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Creative Sound Studio Ltd',
  description: 'Get in touch with Creative Sound Studio Ltd. Book a session or inquire about our multimedia production services in Kigali.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
