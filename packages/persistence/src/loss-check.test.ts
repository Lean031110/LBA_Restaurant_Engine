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

/**
 * Regresión post-integración (defecto detectado en la revisión del
 * propietario, 2026-10-11): la comprobación de existencia usaba el operador
 * `in`, que consulta también la cadena de prototipos. Un campo desconocido
 * llamado "constructor", "toString" o "__proto__" que zod descartaba se daba
 * por existente (miembro heredado de Object.prototype) y la pérdida era
 * silenciosa. La comparación debe considerar SOLO propiedades propias.
 */

/** Nombres de miembros del prototipo usados como campos desconocidos. */
const PROTOTYPE_NAMED_FIELDS = ['constructor', 'toString', '__proto__'] as const

/**
 * Define claves PROPIAS de forma segura para cualquier nombre:
 * Object.defineProperty no dispara el setter de "__proto__" (a diferencia
 * de la asignación) ni se confunde con miembros heredados.
 */
function withOwnProps(
  target: Record<string, unknown>,
  props: Record<string, unknown>,
): Record<string, unknown> {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(target, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    })
  }
  return target
}

describe('collectUnknownFields — regresión: solo propiedades PROPIAS cuentan', () => {
  it.each(PROTOTYPE_NAMED_FIELDS)(
    'detecta el campo desconocido propio "%s" (valor simple) que zod descartó',
    (field) => {
      // Con el operador `in` (defecto): `"toString" in { a: 1 }` → true
      // (heredado) → el campo NO se reportaba → pérdida silenciosa.
      const input = withOwnProps({ a: 1 }, { [field]: 'valor inesperado' })
      expect(collectUnknownFields(input, { a: 1 })).toEqual([field])
    },
  )

  it.each(PROTOTYPE_NAMED_FIELDS)(
    'detecta el campo desconocido propio "%s" con valor objeto (dentro de arrays)',
    (field) => {
      const input = {
        objects: [withOwnProps({ id: 'obj_mesa-01' }, { [field]: { tramposo: true } })],
      }
      const parsed = { objects: [{ id: 'obj_mesa-01' }] }
      expect(collectUnknownFields(input, parsed)).toEqual([`objects[0].${field}`])
    },
  )

  it('las claves heredadas del prototipo NO se reportan si la entrada no las declara', () => {
    // La entrada { a: 1 } no tiene "toString" propio: no hay nada que perder.
    expect(collectUnknownFields({ a: 1 }, { a: 1 })).toEqual([])
  })
})
