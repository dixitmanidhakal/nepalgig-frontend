'use client';

/**
 * /gigs — Freelancer gig marketplace
 *
 * Middleware guarantees only `role=freelancer` users reach this page.
 * Shows funded gigs from the backend — RLS on PostgreSQL additionally
 * enforces that only isFunded=TRUE gigs are visible to freelancers.
 *
 * Features:
 *  • Category filter tabs
 *  • Province filter dropdown
 *  • Full-text search
 *  • Budget range filter
 *  • Pagination
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { GIG_CATEGORIES, NEPAL_PROVINCES } from '@/lib/constants';

// ── Types (inferred from tRPC) ────────────────────────────
type GigRow = {
  id:               string;
  title:            string;
  description:      string;
  category:         string;
  budgetMinNpr:     number;
  budgetMaxNpr:     number;
  budgetType:       string;
  deadline:         string | null;
  durationDays:     number | null;
  locationType:     string;
  district:         string | null;
  province:         number | null;
  proposalCount:    number;
  publishedAt:      string | null;
  clientDisplayName: string | null;
  clientRating:     string | null;
  clientDistrict:   string | null;
};

// ── Budget display helper ─────────────────────────────────
function formatBudget(min: number, max: number, type: string) {
  const fmt = (n: number) => `₨${(n / 100).toLocaleString()}`;
  if (type === 'fixed') return fmt(min);
  return `${fmt(min)} – ${fmt(max)}`;
}

// ── Single gig card ───────────────────────────────────────
function GigCard({ gig }: { gig: GigRow }) {
  const cat = GIG_CATEGORIES.find(c => c.id === gig.category);
  const age = gig.publishedAt
    ? Math.floor((Date.now() - new Date(gig.publishedAt).getTime()) / 86_400_000)
    : null;

  return (
    <Link href={`/gigs/${gig.id}`} className="block group">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-150">

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition truncate text-base leading-snug">
              {gig.title}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {cat ? `${cat.icon} ${cat.label}` : gig.category}
              {gig.district && ` · ${gig.district}`}
              {gig.province && `, P${gig.province}`}
            </p>
          </div>
          {/* Funded badge */}
          <span className="shrink-0 text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
            ✅ Funded
          </span>
        </div>

        {/* Description excerpt */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
          {gig.description}
        </p>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            {/* Budget */}
            <span className="font-bold text-indigo-700">
              {formatBudget(gig.budgetMinNpr, gig.budgetMaxNpr, gig.budgetType)}
            </span>
            {/* Duration */}
            {gig.durationDays && (
              <span className="text-gray-400 text-xs">
                ⏱ {gig.durationDays}d
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {/* Proposals */}
            <span>{gig.proposalCount} proposal{gig.proposalCount !== 1 ? 's' : ''}</span>
            {/* Age */}
            {age !== null && (
              <span>{age === 0 ? 'Today' : `${age}d ago`}</span>
            )}
          </div>
        </div>

        {/* Client */}
        {gig.clientDisplayName && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
              {gig.clientDisplayName[0]?.toUpperCase() ?? '?'}
            </span>
            <span>{gig.clientDisplayName}</span>
            {gig.clientRating && <span>· ⭐ {gig.clientRating}</span>}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function GigsPage() {
  const [category,  setCategory]  = useState('');
  const [province,  setProvince]  = useState<number | undefined>(undefined);
  const [search,    setSearch]    = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [budgetMin, setBudgetMin] = useState<number | undefined>(undefined);
  const [budgetMax, setBudgetMax] = useState<number | undefined>(undefined);
  const [page,      setPage]      = useState(1);

  const { data, isLoading, isFetching } = trpc.gigs.list.useQuery({
    category:  category  || undefined,
    province:  province,
    search:    search    || undefined,
    budgetMin: budgetMin,
    budgetMax: budgetMax,
    page,
    limit: 20,
  }, {
    keepPreviousData: true,
  });

  const gigs = (data?.gigs ?? []) as GigRow[];
  const hasMore = gigs.length === 20;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleCategory(cat: string) {
    setCategory(cat === category ? '' : cat);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top nav ──────────────────────────────────────── */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🇳🇵</span>
            <Link href="/dashboard/freelancer" className="font-bold text-indigo-700 hover:opacity-80">
              NepalgGig
            </Link>
            <span className="text-gray-300 mx-1">·</span>
            <span className="text-sm font-medium text-gray-600">Find Gigs</span>
          </div>
          <Link
            href="/dashboard/freelancer"
            className="text-sm text-gray-500 hover:text-indigo-600 transition"
          >
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── Search bar ───────────────────────────────── */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search gigs by title, description, skill…"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* ── Filters row ──────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Province */}
          <select
            value={province ?? ''}
            onChange={e => { setProvince(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">All Provinces</option>
            {NEPAL_PROVINCES.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Budget range */}
          <select
            onChange={e => {
              const [min, max] = (e.target.value || '').split('-').map(Number);
              setBudgetMin(min || undefined);
              setBudgetMax(max || undefined);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">Any Budget</option>
            <option value="0-10000">Under ₨100</option>
            <option value="10000-50000">₨100 – ₨500</option>
            <option value="50000-200000">₨500 – ₨2,000</option>
            <option value="200000-1000000">₨2,000 – ₨10,000</option>
            <option value="1000000-99999999">₨10,000+</option>
          </select>

          {/* Clear filters */}
          {(category || province || search || budgetMin) && (
            <button
              onClick={() => {
                setCategory(''); setProvince(undefined);
                setSearch(''); setSearchInput('');
                setBudgetMin(undefined); setBudgetMax(undefined);
                setPage(1);
              }}
              className="px-3 py-2 text-sm text-red-500 hover:text-red-700 border border-red-200 rounded-lg transition"
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* ── Category tabs ─────────────────────────────── */}
        <div className="flex gap-2 flex-wrap mb-6">
          <button
            onClick={() => handleCategory('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              !category ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
          >
            All Categories
          </button>
          {GIG_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                category === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* ── Gig list ──────────────────────────────────── */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-gray-100 rounded mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No gigs found</h2>
            <p className="text-gray-400 text-sm">
              {search
                ? `No results for "${search}". Try different keywords.`
                : 'No funded gigs match your filters right now. Check back soon!'}
            </p>
          </div>
        ) : (
          <>
            {/* Result count */}
            <p className="text-sm text-gray-500 mb-4">
              {isFetching ? 'Loading…' : `${gigs.length} funded gig${gigs.length !== 1 ? 's' : ''}${search ? ` for "${search}"` : ''}`}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gigs.map(gig => <GigCard key={gig.id} gig={gig} />)}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {page > 1 && (
                <button
                  onClick={() => setPage(p => p - 1)}
                  className="px-5 py-2 border border-gray-200 rounded-lg text-sm hover:border-indigo-300 transition"
                >
                  ← Prev
                </button>
              )}
              <span className="text-sm text-gray-400">Page {page}</span>
              {hasMore && (
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-5 py-2 border border-gray-200 rounded-lg text-sm hover:border-indigo-300 transition"
                >
                  Next →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
