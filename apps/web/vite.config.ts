import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Configuración de Vite + Vitest para apps/web.
// Regla de la guía: el CI conserva reportes (JUnit, cobertura) incluso si falla.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['src/**'],
      exclude: ['src/main.tsx', 'src/test-setup.ts', 'src/**/*.test.{ts,tsx}'],
      // Umbral realista para FASE 01: el núcleo crítico (logger) debe quedar
      // muy por encima; los umbrales subirán con las fases siguientes.
      thresholds: {
        lines: 75,
        functions: 75,
        statements: 75,
        branches: 70,
      },
    },
  },
})
