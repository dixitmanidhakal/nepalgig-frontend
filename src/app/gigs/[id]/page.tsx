'use client';

/**
 * /gigs/[id] — Single funded gig detail + proposal submission
 *
 * Middleware guarantees role=freelancer for this route.
 * tRPC `gigs.submitProposal` additionally checks:
 *   - role=freelancer at procedure level
 *   - gig is funded + active
 *   - freelancer hasn't already submitted
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { GIG_CATEGORIES, NEPAL_PROVINCES } from '@/lib/constants';
import { z } from 'zod';

// ── Proposal form schema (mirrors backend createProposalSchema) ─
const proposalSchema = z.object({
  bidAmountNpr:  z.number().int().min(100).max(10_000_000_00),
  bidType:       z.enum(['fixed', 'hourly']),
  coverLetter:   z.string().min(50).max(2000),
  estimatedDays: z.number().int().min(1).max(365),
});

// ── Budget display helper ─────────────────────────────────
function formatBudget(min: number, max: number, type: string) {
  const fmt = (n: number) => `₨${(n / 100).toLocaleString()}`;
  return type === 'fixed' ? fmt(min) : `${fmt(min)} – ${fmt(max)}/hr`;
}

// ── Province name ─────────────────────────────────────────
function provinceName(id: number | null) {
  if (!id) return null;
  return NEPAL_PROVINCES.find(p => p.id === id)?.name ?? `Province ${id}`;
}

// ── Category label ────────────────────────────────────────
function categoryLabel(id: string) {
  const cat = GIG_CATEGORIES.find(c => c.id === id);
  return cat ? `${cat.icon} ${cat.label}` : id;
}

// ── Days ago helper ───────────────────────────────────────
function daysAgo(iso: string | null): string {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

// ── Main page ─────────────────────────────────────────────
export default function GigDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gigId  = params.id as string;

  const { data: gig, isLoading, error: gigError } = trpc.gigs.get.useQuery({ id: gigId });

  // Proposal form state
  const [showForm,   setShowForm]   = useState(false);
  const [bidAmount,  setBidAmount]  = useState('');
  const [bidType,    setBidType]    = useState<'fixed' | 'hourly'>('fixed');
  const [coverLetter, setCoverLetter] = useState('');
  const [estDays,    setEstDays]    = useState('');
  const [formError,  setFormError]  = useState('');
  const [submitted,  setSubmitted]  = useState(false);

  const submitMutation = trpc.gigs.submitProposal.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setShowForm(false);
    },
    onError: (err) => {
      setFormError(err.message ?? 'Failed to submit proposal. Please try again.');
    },
  });

  function handleSubmitProposal(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const parsed = proposalSchema.safeParse({
      bidAmountNpr:  Math.round(parseFloat(bidAmount) * 100),
      bidType,
      coverLetter,
      estimatedDays: Number(estDays),
    });

    if (!parsed.success) {
      const first = parsed.error.errors[0];
      setFormError(first?.message ?? 'Invalid input');
      return;
    }

    submitMutation.mutate({
      gigId,
      bidAmountNpr:  parsed.data.bidAmountNpr,
      bidType:       parsed.data.bidType,
      coverLetter:   parsed.data.coverLetter,
      estimatedDays: parsed.data.estimatedDays,
      milestones:    [],
      portfolioItems: [],
    });
  }

  // ── Loading / error states ─────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-indigo-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-gray-400 text-sm">Loading gig…</p>
        </div>
      </div>
    );
  }

  if (gigError || !gig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Gig Not Found</h2>
          <p className="text-gray-500 text-sm mb-6">This gig may have expired or been removed.</p>
          <Link href="/gigs" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition text-sm">
            ← Browse Gigs
          </Link>
        </div>
      </div>
    );
  }

  const isFunded = gig.isFunded && ['funded', 'active'].includes(gig.status);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top nav ──────────────────────────────────────── */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/gigs" className="hover:text-indigo-600 transition">Find Gigs</Link>
            <span>›</span>
            <span className="text-gray-800 truncate max-w-[200px] font-medium">{gig.title}</span>
          </div>
          <Link href="/gigs" className="text-sm text-gray-400 hover:text-indigo-600 transition whitespace-nowrap">
            ← Back
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">

        {/* ── Main content ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Gig header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-0.5 rounded-full">
                    ✅ Funded
                  </span>
                  <span className="text-xs text-gray-400">{categoryLabel(gig.category)}</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{gig.title}</h1>
              </div>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5 pb-5 border-b border-gray-100">
              {gig.district && (
                <span>📍 {gig.district}{gig.province ? `, ${provinceName(gig.province)}` : ''}</span>
              )}
              {gig.durationDays && <span>⏱ {gig.durationDays} days</span>}
              {gig.deadline && (
                <span>📅 Deadline: {new Date(gig.deadline).toLocaleDateString('en-NP')}</span>
              )}
              <span>📤 {gig.proposalCount} proposal{gig.proposalCount !== 1 ? 's' : ''}</span>
              <span className="text-gray-300">·</span>
              <span>{daysAgo(gig.publishedAt ?? null)}</span>
            </div>

            {/* Description */}
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {gig.description}
            </div>

            {/* Tags */}
            {gig.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {gig.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Proposal success ──────────────────────── */}
          {submitted && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="font-bold text-green-800 mb-1">Proposal Submitted!</h3>
              <p className="text-green-700 text-sm mb-4">
                The client will review your proposal and respond soon.
              </p>
              <Link href="/dashboard/freelancer" className="text-sm text-indigo-600 font-medium hover:underline">
                View in My Proposals →
              </Link>
            </div>
          )}

          {/* ── Proposal form ─────────────────────────── */}
          {!submitted && showForm && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-5">Submit Your Proposal</h2>
              <form onSubmit={handleSubmitProposal} className="space-y-5">

                {/* Bid type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bid Type</label>
                  <div className="flex gap-3">
                    {(['fixed', 'hourly'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setBidType(t)}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                          bidType === t
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t === 'fixed' ? '💰 Fixed Price' : '⏰ Hourly'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bid amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Your Bid (NPR) {bidType === 'hourly' ? '/ hour' : ''}
                  </label>
                  <div className="flex rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-400 overflow-hidden">
                    <span className="px-4 bg-gray-50 border-r border-gray-300 text-gray-600 text-sm font-mono flex items-center">₨</span>
                    <input
                      type="number"
                      value={bidAmount}
                      onChange={e => setBidAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      min="1"
                      step="1"
                      required
                      className="flex-1 px-4 py-3 outline-none text-sm font-mono"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Platform takes 5% — you receive{' '}
                    <span className="font-semibold text-gray-600">
                      ₨{bidAmount
                        ? ((parseFloat(bidAmount) || 0) * 0.95).toLocaleString(undefined, { maximumFractionDigits: 0 })
                        : '0'}
                    </span>
                  </p>
                </div>

                {/* Estimated days */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Estimated Delivery (days)
                  </label>
                  <input
                    type="number"
                    value={estDays}
                    onChange={e => setEstDays(e.target.value)}
                    placeholder="e.g. 7"
                    min="1"
                    max="365"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>

                {/* Cover letter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Cover Letter
                    <span className="font-normal text-gray-400 ml-1">(min 50 chars)</span>
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                    rows={6}
                    required
                    placeholder="Explain why you're the best fit for this project. Mention your relevant experience, your approach, and why the client should choose you."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none leading-relaxed"
                  />
                  <p className="text-xs text-gray-400 mt-1">{coverLetter.length} / 2000 characters</p>
                </div>

                {/* Error */}
                {formError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {formError}
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={submitMutation.isLoading}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl transition text-sm"
                  >
                    {submitMutation.isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Submitting…
                      </span>
                    ) : (
                      '📤 Submit Proposal'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormError(''); }}
                    className="px-5 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:border-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────── */}
        <div className="space-y-4">

          {/* Budget card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">Budget</p>
            <p className="text-2xl font-bold text-indigo-700 mb-1">
              {formatBudget(gig.budgetMinNpr, gig.budgetMaxNpr, gig.budgetType)}
            </p>
            <p className="text-xs text-gray-400">
              {gig.budgetType === 'fixed' ? 'Fixed price' : 'Hourly rate'} · NPR
            </p>
          </div>

          {/* Submit CTA */}
          {!submitted && isFunded && (
            <button
              onClick={() => setShowForm(true)}
              disabled={showForm}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-2xl transition text-base shadow-md"
            >
              📤 Submit Proposal
            </button>
          )}

          {submitted && (
            <div className="w-full py-3 bg-green-100 text-green-700 font-semibold rounded-2xl text-sm text-center">
              ✅ Proposal Submitted
            </div>
          )}

          {!isFunded && (
            <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-2xl text-sm text-center">
              This gig is no longer accepting proposals
            </div>
          )}

          {/* Client card */}
          {gig.client && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-3">Client</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                  {gig.client.displayName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{gig.client.displayName ?? 'Anonymous'}</p>
                  {gig.client.ratingAvg && (
                    <p className="text-xs text-gray-400">⭐ {gig.client.ratingAvg} ({gig.client.ratingCount} reviews)</p>
                  )}
                  {gig.client.district && (
                    <p className="text-xs text-gray-400">📍 {gig.client.district}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Member since {new Date(gig.client.createdAt).toLocaleDateString('en-NP', { year: 'numeric', month: 'short' })}
              </p>
            </div>
          )}

          {/* Gig stats */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Proposals</span>
              <span className="font-semibold">{gig.proposalCount}</span>
            </div>
            {gig.durationDays && (
              <div className="flex justify-between text-gray-600">
                <span>Duration</span>
                <span className="font-semibold">{gig.durationDays} days</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Location</span>
              <span className="font-semibold capitalize">{gig.locationType?.replace('_', ' ')}</span>
            </div>
            {gig.province && (
              <div className="flex justify-between text-gray-600">
                <span>Province</span>
                <span className="font-semibold">{provinceName(gig.province)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
