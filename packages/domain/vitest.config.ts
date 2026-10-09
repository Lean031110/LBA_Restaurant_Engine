import { defineConfig } from 'vitest/config'

// Configuración de Vitest para packages/domain.
// El dominio es puro (sin DOM): entorno node, JUnit y cobertura con los mismos
// umbrales que apps/web (75/70). Los fixtures viven en scenarios/fixtures.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['src/**'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        lines: 75,
        functions: 75,
        statements: 75,
        branches: 70,
      },
    },
  },
})
