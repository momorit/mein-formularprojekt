/** @type {import('next').NextConfig} */
const nextConfig = {
  // === OUTPUT & BUILD ===
  output: 'standalone',
  poweredByHeader: false,
  trailingSlash: false,

  // === API ROUTES & BACKEND INTEGRATION ===
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    
    return [
      {
        source: '/backend/:path*',
        destination: `${backendUrl}/:path*`
      }
    ]
  },

  // === CORS HEADERS ===
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },

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