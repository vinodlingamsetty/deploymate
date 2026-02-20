import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['src/__tests__/integration/**/*.integration.test.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
    pool: 'forks',
    // Run all test files sequentially to prevent concurrent TRUNCATE
    // deadlocks and FK violations on the shared test database
    fileParallelism: false,
    testTimeout: 30_000,
    sequence: {
      concurrent: false,
    },
  },
})
