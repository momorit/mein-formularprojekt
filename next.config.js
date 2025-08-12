/** @type {import('next').NextConfig} */
const nextConfig = {
  // === PERFORMANCE ===
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // === API ROUTES & BACKEND INTEGRATION ===
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    
    return [
      // Proxy für direkte Backend-Calls (falls gewünscht)
      {
        source: '/backend/:path*',
        destination: `${backendUrl}/:path*`
      }
    ];
  },

  // === HEADERS FÜR CORS ===
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
    ];
  },

  // === TYPESCRIPT & ESLINT ===
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // === OUTPUT & BUILD ===
  output: 'standalone',
  poweredByHeader: false,

  // === IMAGES (falls verwendet) ===
  images: {
    domains: ['drive.google.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // === STATIC FILE SERVING ===
  trailingSlash: false,
};

// Logging für Debugging
console.log('🔧 NextJS Config loaded');
console.log('📡 Backend URL:', process.env.BACKEND_URL || 'http://127.0.0.1:8000');

export default nextConfig;