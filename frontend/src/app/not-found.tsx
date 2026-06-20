import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="retro-grid min-h-screen flex items-center justify-center py-12">
      <div className="retro-card p-8 max-w-md w-full text-center">
        <div className="text-7xl mb-4 font-black text-primary">404</div>
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
          Page Not Found
        </h1>
        <p className="text-muted font-mono text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="retro-border bg-primary text-background px-6 py-3 font-bold text-sm uppercase tracking-wider inline-block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
