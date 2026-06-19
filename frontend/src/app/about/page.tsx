export default function AboutPage() {
  return (
    <div className="retro-grid min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">
            About <span className="text-primary">Us</span>
          </h1>
          <p className="text-muted mt-2 font-mono text-sm">
            The story behind Creative Sound Studio
          </p>
        </div>

        <div className="retro-card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Our Story</h2>
          <p className="text-muted leading-relaxed mb-4">
            Creative Sound Studio Ltd was founded by <strong>Nkurunziza Jabo</strong>, a Rwandan
            multimedia creator passionate about capturing and amplifying African voices. What began
            as a personal vision to document Kigali&apos;s vibrant creative scene has grown into a
            full-scale multimedia production house based in the heart of Nyamirambo.
          </p>
          <p className="text-muted leading-relaxed">
            Today, the studio stands as a launchpad for unrepresented talent — offering professional
            recording, photography, videography, and content distribution services to artists and
            creators across Rwanda and the region.
          </p>
        </div>

        <div className="retro-card p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Mission</h2>
          <p className="text-muted leading-relaxed">
            To discover, record, and promote unrepresented local and regional African talent
            through professional multimedia production and distribution.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { number: '2020', label: 'Founded' },
            { number: '50+', label: 'Artists Recorded' },
            { number: '100+', label: 'Events Covered' },
          ].map((stat) => (
            <div key={stat.label} className="retro-card p-6 text-center">
              <div className="text-3xl font-black text-primary">{stat.number}</div>
              <div className="text-sm text-muted mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="retro-card p-8 mt-8">
          <h2 className="text-2xl font-bold mb-4">Location</h2>
          <p className="text-muted leading-relaxed font-mono">
            KK 780 St, Nyamirambo<br />
            Kigali, Rwanda
          </p>
          <div className="mt-4 aspect-video bg-gray-200 flex items-center justify-center text-muted text-sm retro-border">
            Google Maps — Nyamirambo, Kigali
          </div>
        </div>
      </div>
    </div>
  );
}
