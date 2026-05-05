'use client';

import { useState }          from 'react';
import { useRouter }         from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button }            from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn }                from '@/lib/utils';

type Role = 'freelancer' | 'client';

const ROLES = [
  {
    role:     'freelancer' as const,
    emoji:    '💼',
    title:    "I'm a Freelancer",
    subtitle: 'I want to find work and get paid',
    bullets: [
      'Browse funded gigs from verified clients',
      'Submit proposals with milestone plans',
      'Get paid securely via escrow in NPR',
      'Build your Nepal freelance portfolio',
    ],
    // Green palette
    cardBase:       'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50',
    cardSelected:   'border-emerald-500 ring-2 ring-emerald-400/40 shadow-emerald-100 shadow-lg',
    cardUnselected: 'border-gray-200 bg-white hover:border-emerald-200 hover:shadow-sm',
    titleCls:       'text-emerald-700',
    radioCls:       'border-emerald-500 bg-emerald-500',
    checkCls:       'text-emerald-600',
    btnVariant:     'green' as const,
    badgeCls:       'bg-emerald-100 text-emerald-700',
    badge:          'Earn in NPR',
  },
  {
    role:     'client' as const,
    emoji:    '🏢',
    title:    "I'm a Client",
    subtitle: 'I want to hire and get work done',
    bullets: [
      'Post projects with your budget in NPR',
      'Receive proposals from top freelancers',
      'Fund escrow — pay only on completion',
      'Manage all your projects in one place',
    ],
    // Blue palette
    cardBase:       'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50',
    cardSelected:   'border-blue-500 ring-2 ring-blue-400/40 shadow-blue-100 shadow-lg',
    cardUnselected: 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-sm',
    titleCls:       'text-blue-700',
    radioCls:       'border-blue-500 bg-blue-500',
    checkCls:       'text-blue-600',
    btnVariant:     'default' as const,
    badgeCls:       'bg-blue-100 text-blue-700',
    badge:          'Post gigs',
  },
] as const;

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

  const selectedRole = ROLES.find(r => r.role === selected);

  return (
    <div className="mobile-full bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🇳🇵</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome to NepalgGig!
          </h1>
          <p className="text-gray-500 text-base">
            How are you planning to use the platform?
          </p>
          <p className="text-xs text-amber-600 font-medium mt-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full inline-block">
            ⚠️ You can only set your role once — choose carefully
          </p>
        </div>

        {/* Role cards — stacked on mobile, side by side on sm+ */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {ROLES.map((card) => {
            const isSelected = selected === card.role;
            return (
              <button
                key={card.role}
                type="button"
                onClick={() => setSelected(card.role)}
                className={cn(
                  'relative text-left p-5 rounded-2xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isSelected ? card.cardSelected + ' ' + card.cardBase : card.cardUnselected,
                  'active:scale-[0.98]'
                )}
              >
                {/* Selection indicator */}
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl leading-none">{card.emoji}</div>
                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                    isSelected ? card.radioCls : 'border-gray-300 bg-white'
                  )}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Badge */}
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide mb-2 inline-block', card.badgeCls)}>
                  {card.badge}
                </span>

                <h3 className={cn('text-base font-bold mb-0.5', card.titleCls)}>{card.title}</h3>
                <p className="text-gray-500 text-xs mb-4 leading-relaxed">{card.subtitle}</p>

                <ul className="space-y-2">
                  {card.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-gray-600 leading-snug">
                      <CheckCircle2 className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', card.checkCls)} />
                      {b}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Continue button — color matches selected role */}
        <Button
          onClick={handleContinue}
          disabled={!selected || loading}
          size="xl"
          variant={selectedRole?.btnVariant ?? 'indigo'}
          className={cn(
            'w-full transition-all',
            !selected && 'opacity-60 cursor-not-allowed',
            selected === 'freelancer' && 'shadow-lg shadow-emerald-200',
            selected === 'client'     && 'shadow-lg shadow-blue-200',
          )}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Setting up your account…</>
          ) : selected ? (
            <>Continue as {selected.charAt(0).toUpperCase() + selected.slice(1)} →</>
          ) : (
            'Select a role to continue'
          )}
        </Button>

        <p className="text-center text-xs text-gray-400 mt-4">
          This choice is permanent and cannot be changed later.
        </p>
      </div>
    </div>
  );
}
