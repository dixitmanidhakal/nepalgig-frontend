'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams }               from 'next/navigation';
import Link                       from 'next/link';
import { Loader2, CheckCircle2, X, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { trpc }                   from '@/lib/trpc';
import { Button }                 from '@/components/ui/button';
import { cn }                     from '@/lib/utils';

// ── Helpers ────────────────────────────────────────────────
function nprFromPaisa(p: number) {
  return (p / 100).toLocaleString('en-NP');
}

const STATUS_BADGE: Record<string, string> = {
  draft:          'bg-gray-100 text-gray-600',
  pending_review: 'bg-yellow-100 text-yellow-700',
  active:         'bg-blue-100 text-blue-700',
  funded:         'bg-emerald-100 text-emerald-700',
  completed:      'bg-purple-100 text-purple-700',
  cancelled:      'bg-red-100 text-red-600',
  paused:         'bg-orange-100 text-orange-700',
  disputed:       'bg-red-100 text-red-700',
};

// ── Proposal row on a gig card ─────────────────────────────
function ProposalRow({
  proposal, freelancer, gigId, gigFunded, onAccepted,
}: {
  proposal: {
    id: string; bidAmountNpr: number; bidType: string; coverLetter: string;
    estimatedDays: number | null; status: string; createdAt: Date;
  };
  freelancer: {
    id: string; displayName: string | null; ratingAvg: number | null;
    ratingCount: number; skills: string[] | null; district: string | null;
  };
  gigId: string; gigFunded: boolean; onAccepted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const utils = trpc.useUtils();

  const acceptMut = trpc.gigs.acceptProposal.useMutation({
    onSuccess: () => {
      utils.gigs.myGigs.invalidate();
      onAccepted();
    },
  });

  const isPending  = proposal.status === 'pending';
  const isAccepted = proposal.status === 'accepted';

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all',
      isAccepted ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-white'
    )}>
      <div className="flex items-start justify-between gap-3">
        {/* Freelancer info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm">
              {freelancer.displayName ?? 'Freelancer'}
            </span>
            {freelancer.ratingAvg !== null && (
              <span className="flex items-center gap-0.5 text-xs text-amber-600 font-medium">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {freelancer.ratingAvg}
                <span className="text-gray-400">({freelancer.ratingCount})</span>
              </span>
            )}
            {freelancer.district && (
              <span className="text-xs text-gray-400">📍 {freelancer.district}</span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
            <span className="font-bold text-gray-800">₨{nprFromPaisa(proposal.bidAmountNpr)}</span>
            <span className="text-gray-300">·</span>
            <span className="capitalize">{proposal.bidType}</span>
            {proposal.estimatedDays && (
              <>
                <span className="text-gray-300">·</span>
                <span>{proposal.estimatedDays}d</span>
              </>
            )}
          </div>

          {/* Skills */}
          {freelancer.skills && freelancer.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {freelancer.skills.slice(0, 4).map(s => (
                <span key={s} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          )}
        </div>

        {/* Status / Accept */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isAccepted ? (
            <span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
            </span>
          ) : isPending && gigFunded ? (
            <Button
              size="sm"
              variant="green"
              onClick={() => acceptMut.mutate({ gigId, proposalId: proposal.id })}
              disabled={acceptMut.isPending}
              className="text-xs h-8"
            >
              {acceptMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Accept ✓'}
            </Button>
          ) : (
            <span className={cn('text-xs px-3 py-1 rounded-full font-medium',
              proposal.status === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
            )}>
              {proposal.status}
            </span>
          )}
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-gray-400 hover:text-indigo-600 transition flex items-center gap-1"
          >
            Letter {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Cover letter */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{proposal.coverLetter}</p>
        </div>
      )}

      {/* Accept error */}
      {acceptMut.error && (
        <p className="text-xs text-red-500 mt-2">⚠️ {acceptMut.error.message}</p>
      )}
    </div>
  );
}

// ── Gig card with embedded proposals ──────────────────────
function GigCard({ gig }: { gig: {
  id: string; title: string; status: string; isFunded: boolean;
  budgetMinNpr: number; budgetMaxNpr: number; proposalCount: number;
  category: string; createdAt: Date;
}}) {
  const [showProposals, setShowProposals] = useState(false);

  const { data: proposalsData, isLoading: loadingProposals } = trpc.gigs.gigProposals.useQuery(
    { gigId: gig.id },
    { enabled: showProposals }
  );

  const label = gig.status.replace(/_/g, ' ');

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Gig header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/gigs/${gig.id}`}
              className="font-semibold text-gray-800 hover:text-indigo-700 transition leading-snug line-clamp-2"
            >
              {gig.title}
            </Link>
            <p className="text-sm text-gray-500 mt-1">
              ₨{nprFromPaisa(gig.budgetMinNpr)} – ₨{nprFromPaisa(gig.budgetMaxNpr)}
              <span className="mx-1.5 text-gray-300">·</span>
              {gig.category.replace('_', ' ')}
            </p>
          </div>
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0', STATUS_BADGE[gig.status] ?? 'bg-gray-100 text-gray-500')}>
            {label}
          </span>
        </div>

        {/* Escrow notice */}
        {!gig.isFunded && gig.status === 'draft' && (
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
            <span className="text-base">🔒</span>
            <p className="text-xs text-amber-700">
              <strong>Fund escrow to activate</strong> — bank transfer to NepalgGig account, share ref.
            </p>
          </div>
        )}

        {/* Proposals toggle */}
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => setShowProposals(p => !p)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-700 transition"
          >
            <span className="bg-indigo-100 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {gig.proposalCount}
            </span>
            Proposal{gig.proposalCount !== 1 ? 's' : ''}
            {showProposals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <Link
            href={`/gigs/${gig.id}`}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            View full gig →
          </Link>
        </div>
      </div>

      {/* Proposals panel */}
      {showProposals && (
        <div className="border-t bg-gray-50 p-4 space-y-3">
          {loadingProposals ? (
            <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading proposals…
            </div>
          ) : !proposalsData?.proposals.length ? (
            <p className="text-sm text-gray-400 text-center py-4">No proposals yet.</p>
          ) : (
            proposalsData.proposals.map(({ proposal, freelancer }) => (
              <ProposalRow
                key={proposal.id}
                proposal={proposal}
                freelancer={freelancer}
                gigId={gig.id}
                gigFunded={gig.isFunded}
                onAccepted={() => setShowProposals(false)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Dashboard inner (needs Suspense for useSearchParams) ──
function ClientDashboardInner() {
  const searchParams = useSearchParams();
  const justCreated  = searchParams.get('created');

  const { data: me }                = trpc.users.me.useQuery();
  const { data: gigsData, isLoading } = trpc.gigs.myGigs.useQuery({});

  const [showCreatedBanner, setShowCreatedBanner] = useState(!!justCreated);
  useEffect(() => {
    if (!justCreated) return;
    const t = setTimeout(() => setShowCreatedBanner(false), 6000);
    return () => clearTimeout(t);
  }, [justCreated]);

  const stats = [
    { label: 'Total Gigs',       value: gigsData?.gigs.length ?? 0,
      icon: '📋', cls: 'bg-blue-50 text-blue-700' },
    { label: 'Funded Gigs',      value: gigsData?.gigs.filter(g => g.isFunded).length ?? 0,
      icon: '🔒', cls: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total Spent',
      value: `₨${nprFromPaisa(me?.totalSpentNpr ?? 0)}`,
      icon: '💸', cls: 'bg-violet-50 text-violet-700' },
    { label: 'Rating',
      value: me?.ratingAvg ? `${me.ratingAvg} ⭐` : '—',
      icon: '⭐', cls: 'bg-amber-50 text-amber-700' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇳🇵</span>
          <span className="font-bold text-indigo-700 text-base">NepalgGig</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="indigo" className="hidden sm:flex">
            <Link href="/gigs/create">+ Post Gig</Link>
          </Button>
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
            {me?.displayName?.[0]?.toUpperCase() ?? me?.fullName?.[0]?.toUpperCase() ?? '?'}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* "Gig created" banner */}
        {showCreatedBanner && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 animate-slide-up">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Gig posted as draft! 🎉</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Fund the escrow to make it visible to freelancers.
                </p>
              </div>
            </div>
            <button onClick={() => setShowCreatedBanner(false)} className="text-emerald-400 hover:text-emerald-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              नमस्ते, {me?.displayName ?? me?.fullName ?? 'Client'} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage your gigs and review proposals</p>
          </div>
          <Button asChild size="sm" variant="indigo" className="sm:hidden shrink-0">
            <Link href="/gigs/create">+ Post</Link>
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className={cn('rounded-xl p-4 border-0', s.cls)}>
              <div className="text-2xl mb-1.5">{s.icon}</div>
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-xs opacity-70 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* My Gigs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 text-lg">My Gigs</h2>
            <Link href="/gigs/create" className="text-sm text-indigo-600 font-medium hover:underline">
              + New Gig
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading…
            </div>
          ) : !gigsData?.gigs.length ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 text-center py-16 px-8">
              <div className="text-5xl mb-4">📭</div>
              <p className="font-semibold text-gray-700 mb-2">No gigs yet</p>
              <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                Post your first project — freelancers send proposals, you pay only after approval.
              </p>
              <Button asChild variant="indigo" size="lg">
                <Link href="/gigs/create">🚀 Post First Gig</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {gigsData.gigs.map(gig => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          )}
        </div>

        {/* How escrow works */}
        {gigsData?.gigs.some(g => !g.isFunded) && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <h3 className="font-bold text-blue-800 mb-3">💡 How to fund escrow</h3>
            <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside leading-relaxed">
              <li>Bank transfer the gig budget to <strong>NepalgGig Escrow Account</strong></li>
              <li>Email <a href="mailto:support@nepalgig.com" className="underline">support@nepalgig.com</a> with your gig ID + transfer receipt</li>
              <li>We verify and activate your gig within 4–8 business hours</li>
            </ol>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Default export wrapped in Suspense ─────────────────────
export default function ClientDashboard() {
  return (
    <Suspense>
      <ClientDashboardInner />
    </Suspense>
  );
}
