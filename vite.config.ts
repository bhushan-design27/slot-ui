/// <reference types="vitest/config" />
import path from 'node:path'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    // Keep failure details: the JSON report has every failure message and
    // stack (CI uploads test-results/ when a run fails).
    reporters: ['default', 'json'],
    outputFile: { json: 'test-results/a11y.json' },
    projects: [
      {
        // Every story runs as a test in headless Chromium; the a11y addon
        // runs axe on each one (`npm run test:a11y`).
        // https://storybook.js.org/docs/writing-tests/integrations/vitest-addon
        extends: true,
        plugins: [storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
