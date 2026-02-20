/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone only for production build (Docker/deploy); avoids dev asset issues
  ...(process.env.NODE_ENV === 'production' && { output: 'standalone' }),
  // serverExternalPackages replaces the deprecated experimental.serverComponentsExternalPackages
  serverExternalPackages: ['@node-rs/argon2', '@prisma/client', '@prisma/adapter-pg', 'pg', 'bullmq', 'ioredis', 'pino', 'pino-pretty'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, '@node-rs/argon2', '@prisma/client', '@prisma/adapter-pg', 'pg', 'bullmq', 'ioredis', 'pino', 'pino-pretty']
    }
    return config
  },
}

module.exports = nextConfig
