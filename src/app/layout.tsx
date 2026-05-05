import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TRPCProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NepalgGig — Nepal Freelance Platform',
  description: "Connect Nepal's best freelancers with clients. Secure escrow. NPR payments.",
  keywords: ['Nepal freelance', 'freelancer Nepal', 'NepalgGig', 'neplai kaam'],
  openGraph: {
    title: 'NepalgGig',
    description: "Nepal's trusted freelance marketplace",
    locale: 'ne_NP',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ne">
      <body className={inter.className}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
