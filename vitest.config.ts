import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // lib/prisma builds its pool at import time; tests never connect.
    env: { DATABASE_URL: 'postgresql://test:test@localhost:5432/test' },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
