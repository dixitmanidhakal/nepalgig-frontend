'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDeviceHash } from '@/lib/device';

// ── Error messages ────────────────────────────────────────
const ERROR_LABELS: Record<string, string> = {
  invalid_phone:     '❌ Invalid Nepal phone number. Use format: 98XXXXXXXX',
  rate_limited:      '⏳ Too many requests. Please wait 1 hour and try again.',
  banned:            '🚫 This account has been suspended. Contact support.',
  device_conflict:   '🔒 Login blocked: this session was opened on a different device. Please log in again from your original device.',
  invalid:           '❌ Invalid login link. Please request a new one.',
  expired:           '⏰ This link expired (15 min TTL). Request a new one.',
  used:              '✅ This link was already used. Request a new one.',
  too_many_attempts: '🔒 Too many failed attempts. Request a new link.',
  phone_mismatch:    '❌ Phone number does not match. Try again.',
  server_error:      '⚠️ Server error. Please try again.',
};

// ── Countdown Timer ───────────────────────────────────────
function Countdown({ expiresAt }: { expiresAt: Date }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    function tick() {
      const ms = expiresAt.getTime() - Date.now();
      if (ms <= 0) { setRemaining('Expired'); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const isExpired = remaining === 'Expired';
  return (
    <span className={`font-mono font-bold ${isExpired ? 'text-red-600' : 'text-indigo-700'}`}>
      {remaining}
    </span>
  );
}

// ── Copy button ───────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select text
    }
  }

  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition
        ${copied
          ? 'bg-green-600 text-white'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
    >
      {copied ? (
        <><CheckIcon /> Copied!</>
      ) : (
        <><CopyIcon /> Copy Link</>
      )}
    </button>
  );
}

// ── Main Login Form ───────────────────────────────────────
function LoginForm() {
  const [phone, setPhone]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [loginUrl, setLoginUrl]     = useState('');
  const [expiresAt, setExpiresAt]   = useState<Date | null>(null);
  const [isNewUser, setIsNewUser]   = useState(false);
  const inputRef                    = useRef<HTMLInputElement>(null);
  const searchParams                = useSearchParams();
  const urlError                    = searchParams.get('error');

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Format phone as user types: auto-insert country code hint
  function handlePhoneChange(val: string) {
    // Strip non-digits except leading +
    const clean = val.replace(/[^\d+]/g, '');
    setPhone(clean);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLoginUrl('');

    try {
      // Collect device fingerprint before the request
      const deviceHash = await getDeviceHash();

      const res  = await fetch('/api/auth/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, deviceHash }),
      });
      const data = await res.json() as {
        success?: boolean;
        error?: string;
        loginUrl?: string;
        expiresAt?: string;
        isNewUser?: boolean;
      };

      if (!res.ok || !data.success) {
        setError(ERROR_LABELS[data.error ?? ''] ?? data.error ?? 'Something went wrong.');
        return;
      }

      setLoginUrl(data.loginUrl!);
      setExpiresAt(new Date(data.expiresAt!));
      setIsNewUser(data.isNewUser ?? false);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setLoginUrl('');
    setExpiresAt(null);
    setPhone('');
    setError('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center group">
            <span className="text-5xl mb-2 group-hover:scale-110 transition-transform">🇳🇵</span>
            <span className="text-3xl font-bold text-indigo-700">NepalgGig</span>
            <span className="text-gray-400 text-sm mt-1">Nepal&apos;s Freelance Platform</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* URL error from redirect */}
          {urlError && ERROR_LABELS[urlError] && (
            <div className="px-8 pt-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {ERROR_LABELS[urlError]}
              </div>
            </div>
          )}

          {loginUrl ? (
            /* ── Step 2: Show login URL ──────────────────── */
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🔗</div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">Your Login Link is Ready</h2>
                <p className="text-gray-500 text-sm">
                  {isNewUser ? 'Welcome! Your account has been created.' : 'Welcome back!'}
                  {' '}Copy and open the link below.
                </p>
              </div>

              {/* Phone */}
              <div className="text-center mb-4">
                <span className="text-sm text-gray-500">Phone: </span>
                <span className="font-mono font-semibold text-gray-800">{phone}</span>
              </div>

              {/* Expiry timer */}
              {expiresAt && (
                <div className="flex items-center justify-center gap-2 mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-amber-600 text-sm">⏱ Expires in:</span>
                  <Countdown expiresAt={expiresAt} />
                </div>
              )}

              {/* URL display */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Login URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-xs text-gray-700 break-all leading-relaxed min-h-[72px] flex items-center">
                    {loginUrl}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mb-6">
                <CopyButton text={loginUrl} />
                <a
                  href={loginUrl}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition"
                >
                  <ExternalIcon /> Open Link
                </a>
              </div>

              {/* How to use */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
                <p className="font-semibold mb-2">📋 How to use:</p>
                <ol className="space-y-1 text-blue-700 list-decimal list-inside">
                  <li>Copy the link above</li>
                  <li>Open it in this browser</li>
                  <li>You&apos;ll be logged in automatically</li>
                </ol>
              </div>

              <button
                onClick={reset}
                className="w-full py-2 text-sm text-gray-500 hover:text-indigo-600 transition"
              >
                ← Use a different phone number
              </button>
            </div>
          ) : (
            /* ── Step 1: Phone input ─────────────────────── */
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Sign in</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your Nepal phone number. We&apos;ll generate a secure login link — no SMS, no password.
              </p>

              {error && (
                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2">
                  <span className="shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent overflow-hidden transition">
                    {/* Country code prefix */}
                    <div className="flex items-center px-4 bg-gray-50 border-r border-gray-300 text-gray-600 font-mono text-sm font-semibold shrink-0">
                      🇳🇵 +977
                    </div>
                    <input
                      ref={inputRef}
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      value={phone.replace(/^\+977/, '')}
                      onChange={(e) => handlePhoneChange('+977' + e.target.value.replace(/\D/g, ''))}
                      placeholder="98XXXXXXXX"
                      maxLength={10}
                      required
                      className="flex-1 px-4 py-3.5 outline-none bg-white text-base font-mono tracking-wider"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    Format: 98XXXXXXXX or 97XXXXXXXX (Nepal mobile)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Generating link...
                    </span>
                  ) : (
                    '🔐 Generate Login Link'
                  )}
                </button>
              </form>

              {/* Feature badges */}
              <div className="mt-8 pt-6 border-t grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '🔒', label: 'No password' },
                  { icon: '📵', label: 'No SMS' },
                  { icon: '⚡', label: '15 min link' },
                ].map((f) => (
                  <div key={f.label} className="text-xs text-gray-500">
                    <div className="text-xl mb-1">{f.icon}</div>
                    {f.label}
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-xs text-gray-400">
                By signing in you agree to our{' '}
                <Link href="/terms" className="underline hover:text-gray-600">Terms</Link>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────
function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
function ExternalIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

// ── Page export ───────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
