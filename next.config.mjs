/** @type {import('next').NextConfig} */
const nextConfig = {
  // === OUTPUT & BUILD ===
  output: 'standalone',
  poweredByHeader: false,
  trailingSlash: false,

  // === PERFORMANCE ===
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // === TYPESCRIPT & ESLINT ===
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
