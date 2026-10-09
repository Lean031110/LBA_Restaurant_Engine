import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Sin `globals: true`, React Testing Library no limpia el DOM entre pruebas.
// La limpieza explícita evita elementos duplicados entre tests.
afterEach(cleanup)
