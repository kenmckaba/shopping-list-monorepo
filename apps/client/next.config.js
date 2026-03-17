/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_GRAPHQL_URL:
      process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://192.168.5.106:4000/graphql',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://192.168.5.106:4000/graphql',
  },
  turbopack: {
    root: process.cwd().includes('apps') ? '../../' : './',
  },
  // Output standalone for serverless deployment compatibility
  output: 'standalone',
}

module.exports = nextConfig
