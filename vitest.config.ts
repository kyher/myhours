import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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
    env: loadEnv('test', root, ''),
  },
})
