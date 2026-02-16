// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================================
  // TYPESCRIPT (still supported in Next.js 16)
  // ============================================================================
  typescript: {
    // Enable TypeScript checking during builds - will fail build if type errors found
    ignoreBuildErrors: false,
  },

  // ============================================================================
  // TURBOPACK CONFIGURATION (replaces webpack in Next.js 16)
  // ============================================================================
  turbopack: {
    resolveAlias: {
      // Handle canvas package (used for PDFs)
      canvas: './empty-module.js',
    },
  },

  // ============================================================================
  // IMAGE OPTIMIZATION
  // ============================================================================
  images: {
    remotePatterns: [
      // Add external image domains here if needed
      // {
      //   protocol: 'https',
      //   hostname: '**.example.com',
      // },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // ============================================================================
  // PERFORMANCE & OPTIMIZATION
  // ============================================================================
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // ============================================================================
  // HEADERS & SECURITY
  // ============================================================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // ============================================================================
  // REDIRECTS
  // ============================================================================
  async redirects() {
    return [
      // Add permanent redirects here if needed
    ]
  },

  // ============================================================================
  // EXPERIMENTAL FEATURES (Next.js 16)
  // ============================================================================
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
    ],
  },

  // ============================================================================
  // OUTPUT & DEPLOYMENT
  // ============================================================================
  // Uncomment for Docker/containerized deployments
  // output: 'standalone',

  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`
  },

  // ============================================================================
  // LOGGING
  // ============================================================================
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // ============================================================================
  // ENVIRONMENT VARIABLES
  // ============================================================================
  env: {
    // Expose specific env vars to the client (use sparingly)
  },
}

export default nextConfig
