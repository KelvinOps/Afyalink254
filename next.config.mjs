//next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': 'commonjs @prisma/client',
        prisma: 'commonjs prisma',
      })
    }
    return config
  },
  // Add these to prevent other common errors
  images: {
    domains: [],
  },
  experimental: {
    // Optional: Add any experimental features you need
  }
}

export default nextConfig