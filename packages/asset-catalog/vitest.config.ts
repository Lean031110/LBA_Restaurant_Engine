import { defineConfig } from 'vitest/config'

// Configuración de Vitest para packages/asset-catalog.
// Mismo patrón que @lba/domain: entorno node (sin DOM, regla 11), reporte
// JUnit para CI y cobertura con los umbrales globales del proyecto (75/70).
// Los fixtures inválidos viven en src/fixtures.
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
      exclude: ['src/**/*.test.ts', 'src/fixtures/**'],
      thresholds: {
        lines: 75,
        functions: 75,
        statements: 75,
        branches: 70,
      },
    },
  },
})
