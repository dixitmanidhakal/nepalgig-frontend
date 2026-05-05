'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'freelancer' | 'client';

interface RoleCard {
  role: Role;
  emoji: string;
  title: string;
  subtitle: string;
  bullets: string[];
  color: string;
  border: string;
  bg: string;
}

const ROLES: RoleCard[] = [
  {
    role:     'freelancer',
    emoji:    '💼',
    title:    'I\'m a Freelancer',
    subtitle: 'I want to find work and get paid',
    bullets:  [
      'Browse funded gigs from verified clients',
      'Submit proposals with milestone plans',
      'Get paid securely via escrow',
      'Build your Nepal freelance portfolio',
    ],
    color:  'text-indigo-700',
    border: 'border-indigo-300',
    bg:     'bg-indigo-50',
  },
  {
    role:     'client',
    emoji:    '🏢',
    title:    'I\'m a Client',
    subtitle: 'I want to hire and get work done',
    bullets:  [
      'Post projects with your budget in NPR',
      'Receive proposals from top freelancers',
      'Fund escrow — pay only on completion',
      'Manage your projects in one place',
    ],
    color:  'text-emerald-700',
    border: 'border-emerald-300',
    bg:     'bg-emerald-50',
  },
];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const router                  = useRouter();

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/auth/role', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ role: selected }),
      });
      const data = await res.json() as { success?: boolean; error?: string };

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to set role. Please try again.');
        return;
      }

      router.push(selected === 'freelancer' ? '/dashboard/freelancer' : '/dashboard/client');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🇳🇵</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to NepalgGig!
          </h1>
          <p className="text-gray-500 text-lg">
            How are you planning to use the platform?
          </p>
        </div>

        {/* Role cards */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {ROLES.map((card) => (
            <button
              key={card.role}
              onClick={() => setSelected(card.role)}
              className={`text-left p-6 rounded-2xl border-2 transition-all duration-150 focus:outline-none
                ${selected === card.role
                  ? `${card.border} ${card.bg} shadow-md scale-[1.02]`
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
            >
              {/* Selected indicator */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-4xl">{card.emoji}</div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition
                  ${selected === card.role
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-gray-300 bg-white'
                  }`}
                >
                  {selected === card.role && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>

              <h3 className={`text-xl font-bold mb-1 ${card.color}`}>{card.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{card.subtitle}</p>

              <ul className="space-y-2">
                {card.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed
            text-white font-bold rounded-xl transition text-lg shadow-md"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Setting up your account…
            </span>
          ) : selected ? (
            `Continue as ${selected.charAt(0).toUpperCase() + selected.slice(1)} →`
          ) : (
            'Select a role to continue'
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          You can only set your role once. Choose carefully!
        </p>
      </div>
    </div>
  );
}
