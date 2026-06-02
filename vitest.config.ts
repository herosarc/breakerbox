import { defineConfig } from 'vitest/config'

// Unit tests target the pure-TypeScript domain layer (no React/Expo imports),
// so the default node environment is all we need.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
