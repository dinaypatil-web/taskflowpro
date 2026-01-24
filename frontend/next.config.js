/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api/v1',
  },
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    domains: [],
    unoptimized: true,
  },
}

module.exports = nextConfig