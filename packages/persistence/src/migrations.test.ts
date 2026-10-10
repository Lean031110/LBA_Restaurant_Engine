import { describe, expect, it } from 'vitest'
import { CURRENT_SCENARIO_SCHEMA_VERSION } from '@lba/domain'
import { MIGRATION_CHAIN, describeMigrationPath } from './migrations'

/**
 * Pruebas de la política de migraciones (estado inicial: cadena vacía porque
 * la versión 1 es la primera del formato).
 */

describe('MIGRATION_CHAIN', () => {
  it('está vacía en el estado inicial de FASE 02', () => {
    expect(MIGRATION_CHAIN).toEqual([])
  })
})

describe('describeMigrationPath', () => {
  it('la versión actual no necesita pasos', () => {
    const result = describeMigrationPath(CURRENT_SCENARIO_SCHEMA_VERSION)
    expect(result.ok).toBe(true)
    expect(result.steps).toEqual([])
  })

  it('una versión antigua falla: la cadena está vacía (v1 es la primera)', () => {
    const result = describeMigrationPath(0)
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('cadena de migraciones está vacía')
    expect(result.reason).toContain('primera del formato')
  })

  it('una versión futura se rechaza explícitamente', () => {
    for (const future of [2, 5, 99]) {
      const result = describeMigrationPath(future)
      expect(result.ok, `versión ${future}`).toBe(false)
      expect(result.reason).toContain('posterior a la soportada')
    }
  })
})
