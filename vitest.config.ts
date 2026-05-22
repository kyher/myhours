import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)))

export default defineConfig({
  resolve: {
    alias: {
      '#': resolve(root, 'src'),
    },
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    setupFiles: ['./src/tests/helpers/setup.ts'],
    env: {
      DATABASE_URL: 'file:test.db',
    },
  },
})
