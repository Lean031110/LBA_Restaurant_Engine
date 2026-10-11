import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Sin `globals: true`, React Testing Library no limpia el DOM entre pruebas.
// La limpieza explícita evita elementos duplicados entre tests.
afterEach(cleanup)

// jsdom no implementa ResizeObserver (lo usa el lienzo para medir su
// contenedor). Este polyfill de prueba notifica un tamaño fijo; la
// interacción real con el observador la cubren las E2E de Playwright.
class ResizeObserverStub implements ResizeObserver {
  observe(): void {
    /* sin notificaciones en pruebas */
  }
  unobserve(): void {
    /* sin notificaciones en pruebas */
  }
  disconnect(): void {
    /* sin notificaciones en pruebas */
  }
}
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub
}
