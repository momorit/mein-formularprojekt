/** @type {import('next').NextConfig} */
const nextConfig = {
  // === PERFORMANCE ===
  experimental: {
    optimizePackageImports: ['lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js'
        }
      }
    }
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
  output: 'standalone', // Für Docker/Vercel deployment
  poweredByHeader: false,
  
  // === SECURITY ===
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // === IMAGES (falls verwendet) ===
  images: {
    domains: ['drive.google.com'], // Falls Google Drive Images angezeigt werden
    formats: ['image/webp', 'image/avif'],
  },

  // === STATIC FILE SERVING ===
  trailingSlash: false,
  
  // === WEBPACK KONFIGURATION ===
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Development optimizations
      config.watchOptions = {
        ignored: /node_modules/,
        poll: 1000,
      };
    }

    return config;
  },
};

// Logging für Debugging
console.log('🔧 NextJS Config loaded');
console.log('📡 Backend URL:', process.env.BACKEND_URL || 'http://127.0.0.1:8000');

module.exports = nextConfig;