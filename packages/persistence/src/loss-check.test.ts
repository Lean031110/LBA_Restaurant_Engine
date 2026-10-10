import { describe, expect, it } from 'vitest'
import { collectUnknownFields, unknownFieldIssues } from './loss-check'
import validCompleteText from '../../../scenarios/fixtures/valid-complete.json?raw'
import { loadScenarioJson } from './json'

/**
 * Pruebas de la comparación entrada→salida que detecta claves que zod
 * habría descartado en silencio (strip) en cualquier nivel de profundidad.
 */

describe('collectUnknownFields', () => {
  it('no reporta nada para una entrada sin campos extraños', () => {
    const loaded = loadScenarioJson(validCompleteText)
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    const input = JSON.parse(validCompleteText)
    expect(collectUnknownFields(input, loaded.data)).toEqual([])
  })

  it('reporta un campo de nivel superior', () => {
    expect(collectUnknownFields({ a: 1, extra: 2 }, { a: 1 })).toEqual(['extra'])
  })

  it('reporta campos anidados', () => {
    expect(
      collectUnknownFields(
        { world: { lengthUnit: 'm', extra: 1 } },
        { world: { lengthUnit: 'm' } },
      ),
    ).toEqual(['world.extra'])
  })

  it('reporta campos dentro de arrays con índice en la ruta', () => {
    expect(
      collectUnknownFields(
        { objects: [{ id: 'obj_a', custom: 1 }] },
        { objects: [{ id: 'obj_a' }] },
      ),
    ).toEqual(['objects[0].custom'])
  })

  it('enumera varios campos desconocidos en el mismo objeto', () => {
    expect(collectUnknownFields({ a: 1, x: 1, y: 2 }, { a: 1 })).toEqual(['x', 'y'])
  })

  it('no reporta claves de la salida ausentes en la entrada (opcionales)', () => {
    // Dirección única: entrada → salida. Los opcionales que faltan en la
    // entrada no son pérdida, son ausencia legítima.
    expect(collectUnknownFields({ a: 1 }, { a: 1, optional: 'presente' })).toEqual([])
  })

  it('sigue bajando en objetos conocidos para encontrar extras profundos', () => {
    const input = {
      world: { lengthUnit: 'm', size: { width: 1, depth: 1, ghost: 0 } },
    }
    const parsed = { world: { lengthUnit: 'm', size: { width: 1, depth: 1 } } }
    expect(collectUnknownFields(input, parsed)).toEqual(['world.size.ghost'])
  })
})

describe('unknownFieldIssues', () => {
  it('convierte rutas en issues con mensaje de no pérdida', () => {
    const issues = unknownFieldIssues(['world.extra'])
    expect(issues).toHaveLength(1)
    expect(issues[0]?.path).toBe('world.extra')
    expect(issues[0]?.code).toBe('unknown_field')
    expect(issues[0]?.message).toContain('no se descarta en silencio')
  })
})
