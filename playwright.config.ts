import { defineConfig, devices } from '@playwright/test'

// Runs against an already running production image (CI starts it from the
// same Dockerfile the deploy uses); E2E_BASE_URL points elsewhere if needed.
export default defineConfig({
  testDir: './e2e',
  forbidOnly: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
