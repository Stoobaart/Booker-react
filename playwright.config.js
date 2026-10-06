import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT) || 4789;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Matches the 1920x980 game canvas, so --game-scale is 1
    viewport: { width: 1920, height: 980 },
    trace: 'retain-on-failure',
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 980 } } }],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Never reuse a dev server, and override .env so e2e runs can't use the real API key
    reuseExistingServer: false,
    env: { VITE_ANTHROPIC_API_KEY: 'e2e-test-key' },
  },
});
