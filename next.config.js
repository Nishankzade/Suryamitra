/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['edge-tts-universal'],
  experimental: {
    serverComponentsExternalPackages: ['ws', 'bufferutil', 'utf-8-validate'],
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
}

module.exports = nextConfig
