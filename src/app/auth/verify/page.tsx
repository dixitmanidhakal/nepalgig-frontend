'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getDeviceHash } from '@/lib/device';

type Status = 'verifying' | 'success' | 'error';

const ERROR_LABELS: Record<string, string> = {
  invalid:           'This login link is invalid.',
  expired:           'This link has expired (15 min TTL). Please request a new one.',
  used:              'This link has already been used. Please request a new one.',
  too_many_attempts: 'Too many failed attempts. Please request a new link.',
  banned:            'This account has been suspended. Contact support@nepalgig.com.',
  phone_mismatch:    'Phone number mismatch. Please use the correct link.',
  device_conflict:   'Login blocked: device fingerprint conflict detected. Your account has been flagged for security review.',
  server_error:      'A server error occurred. Please try again.',
};

function VerifyContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token');
  const phone        = searchParams.get('phone');

  const [status, setStatus]   = useState<Status>('verifying');
  const [error, setError]     = useState('');
  const [role, setRole]       = useState('');
  const [isNewUser, setIsNew] = useState(false);

  useEffect(() => {
    if (!token || !phone) {
      setError('Missing token or phone in URL.');
      setStatus('error');
      return;
    }
    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyToken() {
    try {
      // Compute full device fingerprint — this is the authoritative hash
      // that gets stored in the DB and in the ng_device cookie
      const deviceHash = await getDeviceHash();

      const res  = await fetch('/api/auth/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, phone, deviceHash }),
      });
      const data = await res.json() as {
        success?: boolean;
        error?: string;
        role?: string;
        isNewUser?: boolean;
      };

      if (!res.ok || !data.success) {
        setError(ERROR_LABELS[data.error ?? ''] ?? 'Verification failed.');
        setStatus('error');
        return;
      }

      setRole(data.role ?? 'pending');
      setIsNew(data.isNewUser ?? false);
      setStatus('success');

      // Redirect after short delay
      const dest = data.isNewUser || data.role === 'pending'
        ? '/onboarding'
        : data.role === 'freelancer'
          ? '/dashboard/freelancer'
          : '/dashboard/client';

      setTimeout(() => router.push(dest), 1500);

    } catch {
      setError('Network error. Please try again.');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 text-center">

          {/* Logo */}
          <div className="text-3xl mb-1">🇳🇵</div>
          <div className="font-bold text-indigo-700 text-lg mb-8">NepalgGig</div>

          {status === 'verifying' && (
            <>
              <div className="flex justify-center mb-5">
                <svg className="animate-spin h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Verifying your link…</h2>
              <p className="text-gray-500 text-sm">This takes just a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {isNewUser ? 'Welcome to NepalgGig! 🎉' : 'Logged in! 👋'}
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                {isNewUser
                  ? "Let's set up your account. Redirecting…"
                  : `Redirecting to your ${role} dashboard…`}
              </p>
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Verification Failed</h2>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">{error}</p>
              <a
                href="/login"
                className="inline-block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition text-sm"
              >
                ← Back to Login
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
