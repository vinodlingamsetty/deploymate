/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@node-rs/argon2', '@prisma/client'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, '@node-rs/argon2', '@prisma/client']
    }
    return config
  },
}

module.exports = nextConfig
