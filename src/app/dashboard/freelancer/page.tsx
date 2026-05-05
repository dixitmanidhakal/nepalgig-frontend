'use client';

import { useState }             from 'react';
import Link                     from 'next/link';
import { Loader2 }              from 'lucide-react';
import { trpc }                 from '@/lib/trpc';
import { Button }               from '@/components/ui/button';
import { cn }                   from '@/lib/utils';
import { GIG_CATEGORIES }       from '@/lib/constants';

// ── Helpers ────────────────────────────────────────────────
function nprFromPaisa(p: number) {
  return (p / 100).toLocaleString('en-NP');
}

const PROPOSAL_BADGE: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'bg-yellow-100 text-yellow-700',   label: 'Pending'    },
  accepted:  { cls: 'bg-emerald-100 text-emerald-700', label: 'Accepted ✓' },
  rejected:  { cls: 'bg-red-100 text-red-600',         label: 'Rejected'   },
  withdrawn: { cls: 'bg-gray-100 text-gray-500',       label: 'Withdrawn'  },
  completed: { cls: 'bg-purple-100 text-purple-700',   label: 'Completed'  },
};

// ── Proposal card ──────────────────────────────────────────
function ProposalCard({ proposal, gig }: {
  proposal: {
    id: string; bidAmountNpr: number; bidType: string; status: string; createdAt: Date;
  };
  gig: {
    id: string; title: string; category: string;
    budgetMinNpr: number; budgetMaxNpr: number; status: string;
  };
}) {
  const badge  = PROPOSAL_BADGE[proposal.status] ?? PROPOSAL_BADGE.pending!;
  const catObj = GIG_CATEGORIES.find(c => c.id === gig.category);

  return (
    <div className={cn(
      'bg-white rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-shadow hover:shadow-sm',
      proposal.status === 'accepted' && 'border-emerald-200 bg-emerald-50/40',
    )}>
      {/* Category emoji */}
      <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl shrink-0">
        {catObj?.icon ?? '🗂️'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/gigs/${gig.id}`}
          className="font-semibold text-gray-800 hover:text-indigo-700 transition leading-snug line-clamp-2"
        >
          {gig.title}
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
          <span>Your bid: <strong className="text-gray-700">₨{nprFromPaisa(proposal.bidAmountNpr)}</strong></span>
          <span className="text-gray-300">·</span>
          <span>Budget: ₨{nprFromPaisa(gig.budgetMinNpr)}–₨{nprFromPaisa(gig.budgetMaxNpr)}</span>
          <span className="text-gray-300">·</span>
          <span className="capitalize">{proposal.bidType}</span>
        </div>
      </div>

      {/* Badge */}
      <span className={cn('text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap shrink-0', badge.cls)}>
        {badge.label}
      </span>
    </div>
  );
}

// ── Quick stat card ────────────────────────────────────────
function StatCard({ icon, value, label, cls }: {
  icon: string; value: string | number; label: string; cls: string;
}) {
  return (
    <div className={cn('rounded-xl p-4', cls)}>
      <div className="text-2xl mb-1.5">{icon}</div>
      <div className="text-xl font-bold leading-none">{value}</div>
      <div className="text-xs opacity-70 mt-1">{label}</div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────
export default function FreelancerDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: me }                       = trpc.users.me.useQuery();
  const { data: proposalsData, isLoading } = trpc.gigs.myProposals.useQuery({});

  const proposals = proposalsData?.proposals ?? [];

  // Filtered list
  const filtered = statusFilter === 'all'
    ? proposals
    : proposals.filter(p => p.proposal.status === statusFilter);

  // Derived counts
  const counts = {
    total:     proposals.length,
    pending:   proposals.filter(p => p.proposal.status === 'pending').length,
    accepted:  proposals.filter(p => p.proposal.status === 'accepted').length,
    completed: proposals.filter(p => p.proposal.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇳🇵</span>
          <span className="font-bold text-indigo-700 text-base">NepalgGig</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="indigo">
            <Link href="/gigs">Browse Gigs</Link>
          </Button>
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
            {me?.displayName?.[0]?.toUpperCase() ?? me?.fullName?.[0]?.toUpperCase() ?? '?'}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Welcome */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            नमस्ते, {me?.displayName ?? me?.fullName ?? 'Freelancer'} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Your freelancing dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon="📤" value={counts.total}
            label="Proposals Sent"
            cls="bg-blue-50 text-blue-700"
          />
          <StatCard
            icon="⏳" value={counts.pending}
            label="Awaiting Reply"
            cls="bg-yellow-50 text-yellow-700"
          />
          <StatCard
            icon="💰" value={`₨${nprFromPaisa(me?.totalEarnedNpr ?? 0)}`}
            label="Total Earned"
            cls="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            icon="⭐" value={me?.ratingAvg ? `${me.ratingAvg}` : '—'}
            label={me?.ratingCount ? `${me.ratingCount} review${me.ratingCount !== 1 ? 's' : ''}` : 'No reviews'}
            cls="bg-amber-50 text-amber-700"
          />
        </div>

        {/* Skills / profile completion hint */}
        {!me?.skills?.length && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-3xl shrink-0">👤</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-indigo-800">Complete your profile</p>
              <p className="text-xs text-indigo-600 mt-0.5">Add your skills, bio and district to stand out to clients.</p>
            </div>
            <span className="text-xs text-indigo-400 shrink-0">Coming soon</span>
          </div>
        )}

        {/* Browse CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-base">Find your next gig</p>
            <p className="text-indigo-200 text-xs mt-0.5">Browse funded projects waiting for proposals</p>
          </div>
          <Button asChild size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold shrink-0">
            <Link href="/gigs">Browse →</Link>
          </Button>
        </div>

        {/* My Proposals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-lg">My Proposals</h2>
            {proposals.length > 0 && (
              <span className="text-xs text-gray-400">{filtered.length} shown</span>
            )}
          </div>

          {/* Filter tabs */}
          {proposals.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-none">
              {[
                { key: 'all',       label: `All (${counts.total})` },
                { key: 'pending',   label: `Pending (${counts.pending})` },
                { key: 'accepted',  label: `Accepted (${counts.accepted})` },
                { key: 'completed', label: `Completed (${counts.completed})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                    statusFilter === tab.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border text-gray-600 hover:border-indigo-300'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading proposals…
            </div>
          ) : !proposals.length ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 text-center py-16 px-8">
              <div className="text-5xl mb-4">📭</div>
              <p className="font-semibold text-gray-700 mb-2">No proposals yet</p>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                Browse funded gigs and send your first proposal — only funded projects are listed.
              </p>
              <Button asChild variant="indigo" size="lg">
                <Link href="/gigs">💼 Browse Gigs</Link>
              </Button>
            </div>
          ) : !filtered.length ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No proposals with status &ldquo;{statusFilter}&rdquo;.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(({ proposal, gig }) => (
                <ProposalCard key={proposal.id} proposal={proposal} gig={gig} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
