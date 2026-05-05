'use client';

import { useState, Suspense, useEffect, useRef } from 'react';
import { useSearchParams }   from 'next/navigation';
import Link                  from 'next/link';
import { Copy, Check, ExternalLink, ArrowLeft, Loader2, Smartphone } from 'lucide-react';
import { Button }            from '@/components/ui/button';
import { Input }             from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn }                from '@/lib/utils';
import { getDeviceHash }     from '@/lib/device';

// ── Error labels ──────────────────────────────────────────
const ERROR_LABELS: Record<string, string> = {
  invalid_phone:     'Invalid Nepal phone number — use format 98XXXXXXXX',
  rate_limited:      'Too many requests. Please wait 1 hour and try again.',
  banned:            'This account has been suspended. Contact support.',
  device_conflict:   'Login blocked: your session was opened on a different device.',
  invalid:           'Invalid login link. Please request a new one.',
  expired:           'Link expired (15 min). Please request a new one.',
  used:              'This link was already used. Request a new one.',
  too_many_attempts: 'Too many failed attempts. Request a new link.',
  phone_mismatch:    'Phone number does not match. Try again.',
  server_error:      'Server error. Please try again.',
};

// ── Countdown ─────────────────────────────────────────────
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
  const expired = remaining === 'Expired';
  return (
    <span className={cn('font-mono font-bold tabular-nums text-lg', expired ? 'text-red-500' : 'text-indigo-600')}>
      {remaining}
    </span>
  );
}

// ── Copy button ───────────────────────────────────────────
function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* fallback silent */ }
  }
  return (
    <Button
      onClick={copy}
      variant={copied ? 'green' : 'indigo'}
      size="lg"
      className={cn('flex-1 transition-all', className)}
    >
      {copied
        ? <><Check className="w-4 h-4" /> Copied!</>
        : <><Copy className="w-4 h-4" /> Copy Link</>
      }
    </Button>
  );
}

// ── Main form ─────────────────────────────────────────────
function LoginForm() {
  const [phone, setPhone]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [loginUrl, setLoginUrl]   = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);
  const searchParams              = useSearchParams();
  const urlError                  = searchParams.get('error');

  // Local part only (digits after +977)
  const localPhone = phone.replace(/^\+977/, '');

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLoginUrl('');
    try {
      const deviceHash = await getDeviceHash();
      const res = await fetch('/api/auth/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone, deviceHash }),
      });
      const data = await res.json() as {
        success?: boolean; error?: string;
        loginUrl?: string; expiresAt?: string; isNewUser?: boolean;
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
    setLoginUrl(''); setExpiresAt(null); setPhone(''); setError('');
  }

  // ── Step 2: link ready ────────────────────────────────
  if (loginUrl) {
    return (
      <div className="mobile-full bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm animate-slide-up">

          {/* Logo */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex flex-col items-center">
              <span className="text-4xl mb-1">🇳🇵</span>
              <span className="font-bold text-indigo-700 text-xl">NepalgGig</span>
            </Link>
          </div>

          <Card className="overflow-hidden shadow-xl border-0 ring-1 ring-gray-200">
            <CardContent className="p-6 space-y-5">

              {/* Status header */}
              <div className="text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🔗</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isNewUser ? 'Account created! 🎉' : 'Your login link is ready'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Copy the link below and open it in this browser
                </p>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <Smartphone className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500">Phone:</span>
                <span className="font-mono font-semibold text-gray-800">{phone}</span>
              </div>

              {/* Expiry timer */}
              {expiresAt && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  <span className="text-sm text-amber-700 font-medium">⏱ Expires in</span>
                  <Countdown expiresAt={expiresAt} />
                </div>
              )}

              {/* URL box */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Login URL</p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 font-mono text-xs text-gray-700 break-all leading-relaxed min-h-[72px] flex items-center select-all">
                  {loginUrl}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <CopyButton text={loginUrl} />
                <Button asChild variant="green" size="lg" className="flex-1">
                  <a href={loginUrl}>
                    <ExternalLink className="w-4 h-4" /> Open
                  </a>
                </Button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 mb-2">📋 How to use</p>
                <ol className="text-xs text-blue-600 space-y-1 list-decimal list-inside">
                  <li>Tap <strong>Copy Link</strong> above</li>
                  <li>Paste and open it in <strong>this browser</strong></li>
                  <li>You&apos;ll be logged in automatically ✓</li>
                </ol>
              </div>

              {/* Reset */}
              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-indigo-600 transition py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Use a different number
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Step 1: phone input ───────────────────────────────
  return (
    <div className="mobile-full bg-gradient-to-b from-indigo-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex flex-col items-center group">
            <span className="text-5xl mb-2 group-hover:scale-110 transition-transform">🇳🇵</span>
            <span className="font-bold text-indigo-700 text-2xl">NepalgGig</span>
            <span className="text-gray-400 text-sm mt-0.5">Nepal&apos;s Freelance Platform</span>
          </Link>
        </div>

        <Card className="shadow-xl border-0 ring-1 ring-gray-200 overflow-hidden">
          <CardContent className="p-6 space-y-5">

            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Sign in</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Enter your Nepal phone number. We&apos;ll generate a secure login link — no SMS, no password.
              </p>
            </div>

            {/* Error from URL redirect */}
            {urlError && ERROR_LABELS[urlError] && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                ⚠️ {ERROR_LABELS[urlError]}
              </div>
            )}

            {/* Inline error */}
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Phone field */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  Phone Number
                </label>
                {/* Composite input: flag prefix + number field */}
                <div className="flex rounded-xl border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring overflow-hidden transition-shadow">
                  <div className="flex items-center px-4 bg-muted border-r border-input text-gray-600 font-semibold text-sm shrink-0 gap-1.5 select-none">
                    🇳🇵 <span className="font-mono">+977</span>
                  </div>
                  <input
                    ref={inputRef}
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    value={localPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone('+977' + digits);
                      setError('');
                    }}
                    placeholder="98XXXXXXXX"
                    maxLength={10}
                    required
                    className="flex-1 px-4 py-3 outline-none bg-transparent text-base font-mono tracking-wider placeholder:text-gray-300"
                  />
                </div>
                <p className="text-xs text-gray-400">Nepal mobile: 98XXXXXXXX or 97XXXXXXXX</p>
              </div>

              <Button
                type="submit"
                variant="indigo"
                size="lg"
                disabled={loading || localPhone.length < 10}
                className="w-full"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating link…</>
                  : '🔐 Generate Login Link'
                }
              </Button>
            </form>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              {[
                { icon: '🔒', label: 'No password' },
                { icon: '📵', label: 'No SMS' },
                { icon: '⚡', label: '15 min link' },
              ].map(f => (
                <div key={f.label} className="text-center text-xs text-gray-400">
                  <div className="text-lg mb-0.5">{f.icon}</div>
                  {f.label}
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400">
              By signing in you agree to our{' '}
              <Link href="/terms" className="text-indigo-600 hover:underline">Terms</Link>.
            </p>
          </CardContent>
        </Card>
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
