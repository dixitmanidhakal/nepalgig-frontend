import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🇳🇵</span>
          <span className="text-xl font-bold text-indigo-700">NepalgGig</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/gigs" className="text-gray-600 hover:text-indigo-600 text-sm font-medium">
            Browse Gigs
          </Link>
          <Link
            href="/login"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center py-24 px-4 bg-gradient-to-b from-indigo-50 to-white">
        <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-medium mb-6">
          🚀 Phase 1 — Now Live
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Nepal&apos;s Freelance <br />
          <span className="text-indigo-600">Marketplace</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Connect with Nepal&apos;s best freelancers. Secure escrow in NPR.
          Magic link login — no password, no SMS.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
          >
            Post a Gig →
          </Link>
          <Link
            href="/gigs"
            className="border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition"
          >
            Find Work
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-8">
          {[
            { icon: '🔒', label: 'Secure Escrow' },
            { icon: '💰', label: 'NPR Payments' },
            { icon: '✨', label: 'Magic Link Auth' },
            { icon: '🇳🇵', label: 'Built for Nepal' },
          ].map((b) => (
            <div key={b.label} className="flex items-center gap-2 text-gray-600">
              <span className="text-2xl">{b.icon}</span>
              <span className="text-sm font-medium">{b.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How It Works</h2>
        <p className="text-center text-gray-500 mb-12">Three simple steps to get work done</p>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Client posts a gig',
              desc: 'Describe your project, set budget in NPR, and fund escrow via bank transfer.',
              icon: '📋',
              color: 'bg-blue-50',
            },
            {
              step: '02',
              title: 'Freelancers bid',
              desc: 'Only funded gigs are visible. Qualified freelancers send proposals with milestones.',
              icon: '💼',
              color: 'bg-purple-50',
            },
            {
              step: '03',
              title: 'Work & get paid',
              desc: 'Complete milestones, release escrow. Mutual reviews. Just 5% platform fee.',
              icon: '🎉',
              color: 'bg-green-50',
            },
          ].map((item) => (
            <div key={item.step} className={`${item.color} rounded-2xl p-8`}>
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="text-xs font-bold text-indigo-600 mb-2 uppercase tracking-wider">
                Step {item.step}
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Popular Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '💻', label: 'Web Development' },
              { icon: '📱', label: 'Mobile Apps' },
              { icon: '🎨', label: 'Design & Creative' },
              { icon: '✍️', label: 'Writing & Content' },
              { icon: '📊', label: 'Data & Analytics' },
              { icon: '📣', label: 'Digital Marketing' },
              { icon: '🎬', label: 'Video & Animation' },
              { icon: '💼', label: 'Accounting & Finance' },
            ].map((cat) => (
              <Link
                key={cat.label}
                href={`/gigs?category=${cat.label}`}
                className="bg-white rounded-xl p-4 text-center hover:shadow-md transition hover:border-indigo-200 border border-transparent"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className="text-sm font-medium text-gray-700">{cat.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 px-4 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🇳🇵</span>
            <span className="font-bold text-indigo-700">NepalgGig</span>
            <span className="text-gray-400 text-sm">— Built for Nepal</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
            <a href="mailto:support@nepalgig.com" className="hover:text-gray-600">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
