/** @type {import('next').NextConfig} */
const nextConfig = {
  // ============================================================================
  // CODE QUALITY CHECKS (ENABLED FOR PRODUCTION SAFETY)
  // ============================================================================
  eslint: {
    // Enable linting during builds - will fail build if linting errors found
    ignoreDuringBuilds: false,
    // Run linting on these directories during builds
    dirs: ['app', 'src', 'pages', 'components', 'lib', 'utils'],
  },
  
  typescript: {
    // Enable TypeScript checking during builds - will fail build if type errors found
    ignoreBuildErrors: false,
  },

  // ============================================================================
  // WEBPACK CONFIGURATION
  // ============================================================================
  webpack: (config, { isServer }) => {
    // Externalize Prisma for server-side rendering
    if (isServer) {
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        prisma: 'commonjs prisma',
      })
    }

    // Handle canvas package (if used for PDFs)
    config.resolve.alias.canvas = false

    // Suppress warnings for specific modules
    config.ignoreWarnings = [
      { module: /node_modules\/punycode/ },
      { module: /node_modules\/encoding/ },
    ]

    return config
  },

  // ============================================================================
  // IMAGE OPTIMIZATION
  // ============================================================================
  images: {
    // Add domains for external images (if needed)
    remotePatterns: [
      // Example: for user avatars or external content
      // {
      //   protocol: 'https',
      //   hostname: '**.example.com',
      // },
    ],
    // Image formats to support
    formats: ['image/avif', 'image/webp'],
    // Disable image optimization during development for faster builds
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // ============================================================================
  // PERFORMANCE & OPTIMIZATION
  // ============================================================================
  // Compress pages and API endpoints
  compress: true,

  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Enable SWC minification (faster than Terser)
  swcMinify: true,

  // ============================================================================
  // HEADERS & SECURITY
  // ============================================================================
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Security headers
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
  // REDIRECTS & REWRITES
  // ============================================================================
  async redirects() {
    return [
      // Add any permanent redirects here
      // Example:
      // {
      //   source: '/old-path',
      //   destination: '/new-path',
      //   permanent: true,
      // },
    ]
  },

  // ============================================================================
  // EXPERIMENTAL FEATURES (Next.js 15)
  // ============================================================================
  experimental: {
    // Enable Server Actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    
    // Optimize package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'recharts',
      'date-fns',
    ],

    // Use Turbopack in development (faster than webpack)
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // ============================================================================
  // OUTPUT & DEPLOYMENT
  // ============================================================================
  // Output standalone for Docker/containerized deployments
  // output: 'standalone',

  // Generate build ID for cache busting
  generateBuildId: async () => {
    // Use git commit hash or timestamp
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
    // NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

export default nextConfig
