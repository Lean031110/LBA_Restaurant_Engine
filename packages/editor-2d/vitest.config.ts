import { defineConfig } from 'vitest/config'

// Configuración de Vitest para packages/editor-2d.
// Mismo patrón que el resto de paquetes: entorno node (regla 11: el paquete
// no toca DOM), reporte JUnit para CI y cobertura con umbrales globales.
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
      // index.ts es un barrel de re-exportaciones (sin lógica) y los tests
      // son código de prueba: ambos quedan fuera de la cobertura.
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
      thresholds: {
        lines: 75,
        functions: 75,
        statements: 75,
        branches: 70,
      },
    },
  },
})
