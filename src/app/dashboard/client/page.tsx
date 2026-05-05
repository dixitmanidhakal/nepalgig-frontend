'use client';

import { trpc } from '@/lib/trpc';
import Link from 'next/link';

export default function ClientDashboard() {
  const { data: me } = trpc.users.me.useQuery();
  const { data: gigsData, isLoading } = trpc.gigs.myGigs.useQuery({});

  const statusColor: Record<string, string> = {
    draft:          'bg-gray-100 text-gray-600',
    pending_review: 'bg-yellow-100 text-yellow-700',
    active:         'bg-blue-100 text-blue-700',
    funded:         'bg-green-100 text-green-700',
    completed:      'bg-purple-100 text-purple-700',
    cancelled:      'bg-red-100 text-red-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇳🇵</span>
          <span className="font-bold text-indigo-700">NepalgGig</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/gigs/create"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
          >
            + Post Gig
          </Link>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {me?.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            नमस्ते, {me?.displayName ?? me?.fullName ?? 'Client'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Manage your gigs and proposals</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Gigs',       value: gigsData?.gigs.length ?? 0,  icon: '📋' },
            { label: 'Active Gigs',      value: gigsData?.gigs.filter(g => g.status === 'active').length ?? 0, icon: '🟢' },
            { label: 'Total Spent (NPR)', value: `₨${((me?.totalSpentNpr ?? 0) / 100).toLocaleString()}`, icon: '💸' },
            { label: 'Rating',           value: me?.ratingAvg ? `${me.ratingAvg} ⭐` : 'No reviews', icon: '⭐' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* My Gigs */}
        <div className="bg-white rounded-2xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">My Gigs</h2>
            <Link
              href="/gigs/create"
              className="text-sm text-indigo-600 font-medium hover:underline"
            >
              + New Gig
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : !gigsData?.gigs.length ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 mb-4">No gigs yet. Post your first project!</p>
              <Link
                href="/gigs/create"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition"
              >
                Post a Gig →
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {gigsData.gigs.map((gig) => (
                <div key={gig.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{gig.title}</p>
                    <p className="text-sm text-gray-500">
                      ₨{(gig.budgetMinNpr / 100).toLocaleString()} – ₨{(gig.budgetMaxNpr / 100).toLocaleString()} ·{' '}
                      {gig.proposalCount} proposal{gig.proposalCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${statusColor[gig.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {gig.status.replace('_', ' ')}
                    </span>
                    <Link
                      href={`/gigs/${gig.id}`}
                      className="text-xs text-indigo-600 hover:underline whitespace-nowrap"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
