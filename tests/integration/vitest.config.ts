import { defineConfig } from 'vitest/config'

// Configuración de Vitest para tests/integration.
//
// Diferencia deliberada respecto de los paquetes de producción: este workspace
// SOLO contiene pruebas, así que no aplica `--coverage` ni umbrales (no hay
// código de producción que proteger aquí; la cobertura vive en cada paquete).
// El reporte JUnit sí se genera para los artefactos de CI, igual que en el
// resto de workspaces.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: 'test-results/junit.xml',
    },
  },
})
