import Link from 'next/link';
import { Button }                                        from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GIG_CATEGORIES }                               from '@/lib/constants';

// ── 3 Security cards ──────────────────────────────────────
const SECURITY_CARDS = [
  {
    icon:     '🔒',
    title:    'Secure Escrow',
    desc:     'Client funds are held safely in escrow and released only after work is approved. No fraud, no chargebacks.',
    gradient: 'from-indigo-50 to-indigo-100/50',
    border:   'border-indigo-100',
    iconBg:   'bg-indigo-100 text-indigo-600',
    badge:    'Zero theft risk',
    badgeCls: 'bg-indigo-100 text-indigo-700',
  },
  {
    icon:     '📵',
    title:    'No SMS, No Password',
    desc:     'Login with your Nepal phone number. We generate a secure magic link — no OTP to intercept, no password to leak.',
    gradient: 'from-violet-50 to-violet-100/50',
    border:   'border-violet-100',
    iconBg:   'bg-violet-100 text-violet-600',
    badge:    'SIM-swap proof',
    badgeCls: 'bg-violet-100 text-violet-700',
  },
  {
    icon:     '🛡️',
    title:    'Device Protection',
    desc:     'Every session is tied to your device fingerprint. A stolen cookie cannot be used from a different phone or browser.',
    gradient: 'from-emerald-50 to-emerald-100/50',
    border:   'border-emerald-100',
    iconBg:   'bg-emerald-100 text-emerald-600',
    badge:    '80% block rate',
    badgeCls: 'bg-emerald-100 text-emerald-700',
  },
] as const;

const STEPS = [
  { n: '1', icon: '📋', who: 'Client',     title: 'Post & Fund',       desc: 'Describe your project, set budget in NPR, fund escrow via bank transfer.', cls: 'bg-blue-50 border-blue-100' },
  { n: '2', icon: '💼', who: 'Freelancer', title: 'Bid',               desc: 'Only funded gigs are visible. Send proposals with clear milestone plans.', cls: 'bg-violet-50 border-violet-100' },
  { n: '3', icon: '🎉', who: 'Both',       title: 'Work & Get Paid',   desc: 'Complete milestones, client releases escrow. Mutual reviews. 5% fee only.', cls: 'bg-emerald-50 border-emerald-100' },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Sticky nav ───────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🇳🇵</span>
            <span className="font-bold text-indigo-700 text-lg">NepalgGig</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:flex items-center h-9 px-3 text-sm font-medium text-gray-600 hover:text-indigo-600 transition">
              Sign in
            </Link>
            <Button asChild size="sm" variant="indigo">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white pt-12 pb-16 px-4 text-center">
        {/* Soft glow decorations */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="absolute top-40 -right-20 w-56 h-56 rounded-full bg-violet-100/40 blur-2xl" />
          <div className="absolute top-52 -left-20 w-48 h-48 rounded-full bg-emerald-100/30 blur-2xl" />
        </div>

        <div className="relative max-w-2xl mx-auto animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
            Phase 1 · Live in Nepal
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-5 leading-[1.1] tracking-tight">
            Nepal&apos;s Freelance<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Marketplace
            </span>
          </h1>

          <p className="text-gray-500 text-lg sm:text-xl mb-8 max-w-lg mx-auto leading-relaxed">
            Find funded gigs or hire top talent.
            Escrow in NPR. Magic-link login — no SMS, no password.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Button asChild size="xl" variant="indigo" className="shadow-lg shadow-indigo-200">
              <Link href="/login">🚀 Post a Gig</Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <Link href="/login">💼 Find Work</Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-400 font-medium">
            {['🔒 Escrow protected', '₨ NPR payments', '📵 No SMS', '🇳🇵 Built for Nepal'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 Security Cards ─────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Built secure from day one
            </h2>
            <p className="text-gray-500">Three layers protecting Nepal&apos;s freelance economy</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {SECURITY_CARDS.map((card, i) => (
              <Card
                key={card.title}
                className={`bg-gradient-to-br ${card.gradient} border ${card.border} animate-slide-up overflow-hidden`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center text-2xl mb-3 shrink-0`}>
                    {card.icon}
                  </div>
                  <span className={`self-start text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${card.badgeCls} mb-1`}>
                    {card.badge}
                  </span>
                  <CardTitle className="text-gray-900 text-[15px] mt-0.5">{card.title}</CardTitle>
                </CardHeader>
                <CardDescription className="px-6 pb-6 text-gray-600 text-sm leading-relaxed">
                  {card.desc}
                </CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50/80">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">How it works</h2>
          <p className="text-center text-gray-500 mb-10">Three steps to get work done</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className={`rounded-2xl border p-6 ${s.cls}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-white border border-gray-200 font-bold text-sm text-gray-700 flex items-center justify-center shadow-sm shrink-0">
                    {s.n}
                  </div>
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.who}</span>
                </div>
                <h3 className="font-bold text-gray-800 mb-1.5">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories grid ──────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-10">Popular Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GIG_CATEGORIES.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href="/login"
                className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group min-h-[44px]"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-150">{cat.icon}</span>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-indigo-700 text-center leading-tight">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white text-center">
        <div className="max-w-xl mx-auto">
          <div className="text-5xl mb-4">🇳🇵</div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to start?</h2>
          <p className="text-indigo-200 mb-8 text-base leading-relaxed">
            Join Nepal&apos;s fastest growing freelance platform.<br className="hidden sm:block" />
            No fees until you get paid.
          </p>
          <Button
            asChild
            size="xl"
            className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl shadow-indigo-900/30 font-bold"
          >
            <Link href="/login">Get Started — It&apos;s Free →</Link>
          </Button>
          <p className="mt-4 text-indigo-300 text-sm">Just your phone number. No password, no SMS.</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t py-8 px-4 bg-white safe-bottom">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span>🇳🇵</span>
            <span className="font-bold text-indigo-700">NepalgGig</span>
            <span className="text-gray-300 mx-1">—</span>
            <span className="text-gray-400">Built for Nepal</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/terms"   className="hover:text-gray-600 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition">Privacy</Link>
            <a href="mailto:support@nepalgig.com" className="hover:text-gray-600 transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
