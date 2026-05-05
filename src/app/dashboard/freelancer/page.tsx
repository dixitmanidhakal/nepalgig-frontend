'use client';

import { trpc } from '@/lib/trpc';
import Link from 'next/link';

export default function FreelancerDashboard() {
  const { data: me } = trpc.users.me.useQuery();
  const { data: proposalsData, isLoading } = trpc.gigs.myProposals.useQuery({});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🇳🇵</span>
          <span className="font-bold text-indigo-700">NepalgGig</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/gigs" className="text-sm text-gray-600 hover:text-indigo-600">Browse Gigs</Link>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            {me?.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            नमस्ते, {me?.displayName ?? me?.fullName ?? 'Freelancer'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here&apos;s your freelancing dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Proposals Sent',    value: proposalsData?.proposals.length ?? 0, icon: '📤' },
            { label: 'Active Projects',   value: 0,  icon: '🔨' },
            { label: 'Total Earned (NPR)', value: `₨${((me?.totalEarnedNpr ?? 0) / 100).toLocaleString()}`, icon: '💰' },
            { label: 'Rating',            value: me?.ratingAvg ? `${me.ratingAvg} ⭐` : 'No reviews', icon: '⭐' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-white mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold mb-1">Find your next gig</h2>
            <p className="text-indigo-200 text-sm">Browse funded gigs waiting for your proposal</p>
          </div>
          <Link
            href="/gigs"
            className="bg-white text-indigo-600 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition whitespace-nowrap"
          >
            Browse Gigs →
          </Link>
        </div>

        {/* My Proposals */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-bold text-gray-800 mb-4">My Proposals</h2>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : !proposalsData?.proposals.length ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 mb-4">No proposals yet.</p>
              <Link href="/gigs" className="text-indigo-600 font-medium underline">
                Browse funded gigs →
              </Link>
            </div>
          ) : (
            <div className="divide-y">
              {proposalsData.proposals.map(({ proposal, gig }) => (
                <div key={proposal.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{gig.title}</p>
                    <p className="text-sm text-gray-500">
                      Bid: ₨{(proposal.bidAmountNpr / 100).toLocaleString()} · {gig.category}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    proposal.status === 'accepted'  ? 'bg-green-100 text-green-700' :
                    proposal.status === 'rejected'  ? 'bg-red-100 text-red-700'    :
                    proposal.status === 'completed' ? 'bg-blue-100 text-blue-700'  :
                                                      'bg-yellow-100 text-yellow-700'
                  }`}>
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
