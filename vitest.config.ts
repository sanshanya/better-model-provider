import { defineConfig } from 'vitest/config'

/**
 * Only the two full-chain golden lanes are tests: they boot a real harness from
 * BMP_DSH_DIR (and, for the functional lane, drive a real browser), and both
 * skip themselves when that variable is unset. No unit/coverage gate remains —
 * a hand-projected fake face can be green while the real contract has moved,
 * which is exactly what this suite is meant to catch.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    globals: false,
  },
})
