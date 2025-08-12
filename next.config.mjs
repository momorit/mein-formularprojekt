/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint komplett deaktivieren
  eslint: {
    ignoreDuringBuilds: true,
  },
  // TypeScript komplett deaktivieren
  typescript: {
    ignoreBuildErrors: true,
  },
  // Experimentell
  swcMinify: false,
  experimental: {
    forceSwcTransforms: false,
  }
}

export default nextConfig