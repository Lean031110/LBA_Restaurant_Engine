import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright para LBA_Restaurant_Engine (prompt 03.4).
 *
 * Prueba la BUILD REAL de apps/web (vite preview): los arrastres del lienzo,
 * el guardado/recarga del escenario y la consola del navegador. El servidor
 * requiere un build previo (`npm run build` en la raíz), igual que en CI.
 */
export default defineConfig({
  testDir: './specs',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    cwd: '../apps/web',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
