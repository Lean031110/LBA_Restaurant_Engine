import { defineConfig } from 'vitest/config'

// Configuración de Vitest para packages/persistence.
// Mismo patrón que @lba/domain y @lba/asset-catalog: entorno node (regla 11),
// reporte JUnit para CI y cobertura con los umbrales globales (75/70).
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
      exclude: ['src/**/*.test.ts', 'src/raw.d.ts'],
      thresholds: {
        lines: 75,
        functions: 75,
        statements: 75,
        branches: 70,
      },
    },
  },
})
