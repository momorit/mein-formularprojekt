/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-optimierte Konfiguration
  reactStrictMode: true,
  swcMinify: true,
  
  // Custom redirects - leitet / automatisch zu /study weiter
  async redirects() {
    return [
      // Hauptroute-Redirect entfernt - wird jetzt in page.tsx gehandhabt
    ]
  },

  // Rewrites für saubere URLs
  async rewrites() {
    return [
      // API-Proxy für lokale Entwicklung
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:8000/api/:path*'  // Lokales Backend
          : '/api/:path*'  // Production API
      }
    ]
  },

  // Headers für CORS und Sicherheit
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ]
  },

  // Environment Variables für Client-Side
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV,
  },

  // Build-Optimierungen
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental Features
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:8000']
    }
  },

  // Output-Konfiguration für verschiedene Deployment-Plattformen
  output: 'standalone',

  // Bilder-Optimierung
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development'
  },

  // TypeScript-Konfiguration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint-Konfiguration  
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Webpack-Konfiguration für bessere Performance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig