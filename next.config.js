/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  images: {
    domains: ['nepalgig.com'],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverComponentsExternalPackages: ['pg', 'drizzle-orm'],
  },
};

module.exports = nextConfig;
