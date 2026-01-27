import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // domains: ['files.edgestore.dev']
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'files.edgestore.dev',
        port: '',
        pathname: '/**'
      }
    ]
  }
}

export default nextConfig
