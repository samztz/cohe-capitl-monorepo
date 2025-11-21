/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  /**
   * API Rewrites for Admin Panel
   *
   * When running in Docker with direct port access (http://localhost:3002),
   * all /api/* requests are proxied to the API container.
   *
   * This ensures:
   * - All admin code can use relative /api paths
   * - No need for NEXT_PUBLIC_ADMIN_API_PORT environment variable
   * - Works consistently in both development and production
   * - Nginx (port 80) and direct access (port 3002) both work
   */
  async rewrites() {
    // In production (via Nginx), rewrites are handled by Nginx
    // In development (direct access), Next.js handles the rewrites

    // Check if we should proxy to API container
    // API_INTERNAL_URL is for Docker internal networking (api:3001)
    const apiUrl = process.env.API_INTERNAL_URL || 'http://api:3001'

    console.log('[Admin Next.js Rewrites] Proxying /api/* to:', apiUrl)

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
