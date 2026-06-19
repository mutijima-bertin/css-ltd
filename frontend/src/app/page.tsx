import Link from 'next/link';

export default function Home() {
  return (
    <div className="retro-grid min-h-screen">
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-block retro-border px-6 py-2 mb-8 bg-accent text-foreground text-sm font-bold uppercase tracking-widest">
          <span className="blink">N</span>ow Playing
        </div>

        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight leading-tight">
          Creative
          <br />
          <span className="text-primary">Sound</span> Studio
        </h1>

        <p className="text-lg md:text-xl mt-6 max-w-2xl mx-auto text-muted font-mono">
          Multimedia Production House — Kigali, Rwanda
        </p>

        <div className="mt-4 font-mono text-sm text-muted">
          <span className="text-secondary">$</span> cd /studio &amp;&amp; ls -la
          <span className="blink ml-1">_</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link
            href="/portfolio"
            className="retro-border bg-primary text-background px-8 py-3 font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors"
          >
            View Portfolio
          </Link>
          <Link
            href="/contact"
            className="retro-border bg-background text-foreground px-8 py-3 font-bold text-sm uppercase tracking-wider hover:bg-gray-100 transition-colors"
          >
            Book a Session
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: 'Talent Discovery', desc: 'Discovering and promoting unrepresented local and regional African talent.' },
            { title: 'Content Production', desc: 'Professional audio engineering, video production, and event photography.' },
            { title: 'Media Streaming', desc: 'Exclusive online content — music shows, interviews, behind-the-scenes footage.' },
          ].map((item) => (
            <div key={item.title} className="retro-card p-6 text-center">
              <h3 className="font-bold text-lg uppercase tracking-wider mb-3">{item.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-foreground text-background py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="marquee">
            <div className="marquee-inner font-mono text-sm tracking-widest uppercase">
              <span className="mx-8">Recording Studio</span>
              <span className="mx-8 text-accent">✦</span>
              <span className="mx-8">Event Photography</span>
              <span className="mx-8 text-accent">✦</span>
              <span className="mx-8">Video Production</span>
              <span className="mx-8 text-accent">✦</span>
              <span className="mx-8">Mixing & Mastering</span>
              <span className="mx-8 text-accent">✦</span>
              <span className="mx-8">Podcast Recording</span>
              <span className="mx-8 text-accent">✦</span>
              <span className="mx-8">Portrait Photography</span>
              <span className="mx-8 text-accent">✦</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
