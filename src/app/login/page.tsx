'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_link:      '❌ Invalid or expired link. Please request a new one.',
  link_expired:      '⏰ This link has expired (15 min TTL). Request a new one.',
  link_used:         '✅ This link was already used. Request a fresh one.',
  account_banned:    '🚫 Account suspended. Contact support@nepalgig.com.',
  too_many_attempts: '🔒 Too many attempts. Request a new link.',
  server_error:      '⚠️ Server error. Please try again.',
};

function LoginForm() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const searchParams          = useSearchParams();
  const errorCode             = searchParams.get('error');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/magic', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json() as { error?: string };
      if (res.status === 429) {
        setError('Too many requests. Wait 1 hour before trying again.');
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'Failed to send magic link.');
        return;
      }
      setSent(true);
    } catch {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center">
            <span className="text-5xl mb-2">🇳🇵</span>
            <span className="text-3xl font-bold text-indigo-700">NepalgGig</span>
            <span className="text-gray-400 text-sm mt-1">Nepal&apos;s Freelance Platform</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Error from URL */}
          {errorCode && ERROR_MESSAGES[errorCode] && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {ERROR_MESSAGES[errorCode]}
            </div>
          )}

          {sent ? (
            /* ── Success state ─────────────────────── */
            <div className="text-center py-4">
              <div className="text-6xl mb-4">📬</div>
              <h2 className="text-xl font-bold text-gray-800 mb-3">Check your inbox!</h2>
              <p className="text-gray-500 mb-6 leading-relaxed">
                We sent a magic login link to{' '}
                <strong className="text-gray-800">{email}</strong>.
                <br />
                It expires in <strong>15 minutes</strong>.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-6">
                💡 Check spam/junk if you don&apos;t see it within 1 minute.
              </div>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-indigo-600 text-sm underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* ── Login form ────────────────────────── */
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Sign in</h2>
              <p className="text-gray-500 text-sm mb-6">
                No password needed. We&apos;ll email you a secure magic link.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-base"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    '✉️ Send Magic Link'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-xs text-gray-400 leading-relaxed">
                  By signing in, you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>.
                  <br />
                  No password. No SMS. Secure email links only.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
