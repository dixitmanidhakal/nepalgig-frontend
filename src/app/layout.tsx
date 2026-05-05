import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TRPCProvider } from './providers';

const inter = Inter({
  subsets:  ['latin'],
  display:  'swap',
  variable: '--font-inter',
});

// ── PWA + SEO metadata ────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default:  'NepalgGig — Nepal Freelance Platform',
    template: '%s · NepalgGig',
  },
  description:
    "Nepal's trusted freelance marketplace. Secure escrow in NPR. " +
    "Magic link login — no password, no SMS.",
  keywords: [
    'Nepal freelance', 'freelancer Nepal', 'NepalgGig',
    'nepali freelancer', 'gig work Nepal', 'NPR payment',
  ],
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'default',
    title:          'NepalgGig',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title:       'NepalgGig — Nepal Freelance Platform',
    description: "Nepal's trusted freelance marketplace. Secure escrow in NPR.",
    locale:      'ne_NP',
    type:        'website',
    siteName:    'NepalgGig',
  },
};

// ── Viewport / theme-color (Next.js 14 separate export) ──
export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor:   '#4f46e5',   // indigo-600
  viewportFit:  'cover',     // safe-area-inset-* on notched phones
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ne" className={inter.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
