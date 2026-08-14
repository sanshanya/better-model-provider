import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
    environment: 'jsdom',
    environmentOptions: { jsdom: { url: 'http://localhost' } },
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**'],
      exclude: ['src/index.ts'],
      // Branch slack admits defensive guards whose only tests would fake a
      // corrupted document (judged meaningless, 2026-08); the rest stays 100.
      thresholds: { lines: 100, functions: 100, branches: 95, statements: 100, perFile: true },
    },
  },
})
