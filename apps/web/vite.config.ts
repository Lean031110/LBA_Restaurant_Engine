import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Configuración de Vite + Vitest para apps/web.
// Regla de la guía: el CI conserva reportes (JUnit, cobertura) incluso si falla.
//
// Nota de pruebas: Konva necesita un canvas 2D real que jsdom no ofrece, así
// que los tests de componente usan el mock de react-konva (siluetas DOM con
// data-konva) mediante alias SOLO en pruebas; la interacción real del lienzo
// la cubren las pruebas E2E de Playwright (tests/e2e) en un navegador real.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    alias: {
      'react-konva': fileURLToPath(
        new URL('./src/editor/__mocks__/react-konva.tsx', import.meta.url),
      ),
    },
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      include: ['src/**'],
      exclude: [
        'src/main.tsx',
        'src/test-setup.ts',
        'src/**/*.test.{ts,tsx}',
        'src/editor/__mocks__/**',
      ],
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
