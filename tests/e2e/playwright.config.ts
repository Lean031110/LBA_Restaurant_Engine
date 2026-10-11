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
    // El informe HTML vive FUERA de test-results (outputDir): Playwright limpia
    // su carpeta al regenerarse y anidarla dentro provocaría pérdida de
    // artefactos de fallo (advertencia de configuración en Playwright ≥1.55).
    // 'playwright-report' ya está en .gitignore y se sube como artefacto de CI.
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
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
    // Playwright resuelve `cwd` relativo al DIRECTORIO DE ESTE CONFIG
    // (tests/e2e), no al directorio del proceso: desde tests/e2e se necesitan
    // DOS niveles hacia arriba para llegar a apps/web. Con un solo '..' el
    // servidor apuntaba a tests/apps/web (inexistente) y el arranque fallaba
    // con «spawn /bin/sh ENOENT» salvo que ya hubiera un servidor en el puerto
    // (reuseExistingServer), lo que enmascaraba el defecto.
    cwd: '../../apps/web',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
