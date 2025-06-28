/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Enable ESLint checks during production builds
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Enable TypeScript checks during production builds
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    domains: ['deckster.xyz'],
  },
  // Add production optimizations
  reactStrictMode: true,
  swcMinify: true,
  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
}

export default nextConfig
