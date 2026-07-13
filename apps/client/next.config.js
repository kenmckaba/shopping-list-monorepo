/** @type {import('next').NextConfig} */
const path = require('node:path')

const nextConfig = {
  // Allow HMR websocket/origin checks from local and LAN development hosts.
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.5.230'],
  turbopack: {
    root: process.cwd()?.includes('apps')
      ? path.resolve(process.cwd(), '../../')
      : process.cwd(),
  },
  // Output standalone for serverless deployment compatibility
  output: 'standalone',
}

module.exports = nextConfig
