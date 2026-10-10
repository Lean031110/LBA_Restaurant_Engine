import { describe, expect, it } from 'vitest'
import { validateScenario } from '@lba/domain'
import type { ValidationIssue } from '@lba/domain'
import { exportScenario, loadScenarioJson } from './json'
import validMinimalObject from '../../../scenarios/fixtures/valid-minimal.json'
import validCompleteObject from '../../../scenarios/fixtures/valid-complete.json'
import validMinimalText from '../../../scenarios/fixtures/valid-minimal.json?raw'
import validCompleteText from '../../../scenarios/fixtures/valid-complete.json?raw'
import invalidVersionText from '../../../scenarios/fixtures/invalid-unknown-schema-version.json?raw'
import invalidDuplicateIdsText from '../../../scenarios/fixtures/invalid-duplicate-ids.json?raw'
import invalidNonFiniteText from '../../../scenarios/fixtures/invalid-nonfinite-position.json?raw'
import invalidUnitsText from '../../../scenarios/fixtures/invalid-bad-units.json?raw'
import invalidSourceText from '../../../scenarios/fixtures/invalid-bad-source-type.json?raw'
import invalidDimensionText from '../../../scenarios/fixtures/invalid-negative-dimension.json?raw'
import invalidDurationText from '../../../scenarios/fixtures/invalid-negative-duration.json?raw'
import invalidVersionObject from '../../../scenarios/fixtures/invalid-unknown-schema-version.json'
import invalidDuplicateIdsObject from '../../../scenarios/fixtures/invalid-duplicate-ids.json'
import invalidNonFiniteObject from '../../../scenarios/fixtures/invalid-nonfinite-position.json'
import invalidUnitsObject from '../../../scenarios/fixtures/invalid-bad-units.json'
import invalidSourceObject from '../../../scenarios/fixtures/invalid-bad-source-type.json'
import invalidDimensionObject from '../../../scenarios/fixtures/invalid-negative-dimension.json'
import invalidDurationObject from '../../../scenarios/fixtures/invalid-negative-duration.json'

/**
 * Pruebas del canal de importación/exportación (prompt 02.3). Los textos de
 * los fixtures se importan ?raw para no re-serializar (1e999 seguiría siendo
 * Infinity en el objeto, pero JSON.stringify lo convertiría en null).
 */

function firstPath(result: { ok: boolean; issues?: ValidationIssue[] }): string {
  if (result.ok || !result.issues || result.issues.length === 0) {
    return '(sin error)'
  }
  return result.issues[0]?.path ?? '(sin ruta)'
}

describe('loadScenarioJson — entradas válidas', () => {
  it('carga valid-minimal.json con datos nuevos (no la misma referencia)', () => {
    const result = loadScenarioJson(validMinimalText)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe('scn_fixture-minimo')
      expect(result.data as unknown as object).not.toBe(validMinimalObject)
    }
  })

  it('carga valid-complete.json y valida sus referencias cruzadas', () => {
    const result = loadScenarioJson(validCompleteText)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.zones).toHaveLength(3)
      expect(result.data.taskTemplates).toHaveLength(2)
    }
  })
})

describe('loadScenarioJson — canal de errores con rutas exactas', () => {
  const cases: { name: string; text: string; object: unknown }[] = [
    { name: 'versión desconocida', text: invalidVersionText, object: invalidVersionObject },
    { name: 'IDs duplicados', text: invalidDuplicateIdsText, object: invalidDuplicateIdsObject },
    { name: 'posición no finita', text: invalidNonFiniteText, object: invalidNonFiniteObject },
    { name: 'unidades inválidas', text: invalidUnitsText, object: invalidUnitsObject },
    { name: 'procedencia inválida', text: invalidSourceText, object: invalidSourceObject },
    { name: 'dimensión negativa', text: invalidDimensionText, object: invalidDimensionObject },
    { name: 'duración negativa', text: invalidDurationText, object: invalidDurationObject },
  ]

  for (const fixture of cases) {
    it(`rechaza ${fixture.name} con la misma primera ruta que el dominio`, () => {
      const domainResult = validateScenario(fixture.object)
      expect(domainResult.ok).toBe(false)
      const persistenceResult = loadScenarioJson(fixture.text)
      expect(persistenceResult.ok).toBe(false)
      expect(firstPath(persistenceResult), `dominio: ${firstPath(domainResult)}`).toBe(
        firstPath(domainResult),
      )
    })
  }

  it('la versión desconocida se explica con la política de migraciones', () => {
    const result = loadScenarioJson(invalidVersionText)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('schemaVersion')
      expect(result.issues[0]?.message).toContain('no se puede cargar')
    }
  })

  it('rechaza JSON mal formado en (raíz)', () => {
    for (const malformed of ['{', 'no es json', '{"a":']) {
      const result = loadScenarioJson(malformed)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.issues[0]?.path).toBe('(raíz)')
        expect(result.issues[0]?.code).toBe('json_syntax')
        expect(result.issues[0]?.message).toContain('JSON mal formado')
      }
    }
  })

  it('rechaza valores que no son objeto JSON (array, escalar) en (raíz)', () => {
    for (const nonObject of ['[1, 2, 3]', '"texto"', '42', 'null']) {
      const result = loadScenarioJson(nonObject)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.issues[0]?.path).toBe('(raíz)')
        expect(result.issues[0]?.message).toContain('debe ser un objeto JSON')
      }
    }
  })
})

describe('loadScenarioJson — versiones y migraciones (puerta)', () => {
  it('rechaza una versión futura con mensaje explícito', () => {
    const future = JSON.stringify({ ...validCompleteObject, schemaVersion: 2 })
    const result = loadScenarioJson(future)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('schemaVersion')
      expect(result.issues[0]?.message).toContain('posterior a la soportada')
    }
  })

  it('rechaza una versión antigua explicando la cadena vacía', () => {
    const old = JSON.stringify({ ...validCompleteObject, schemaVersion: 0 })
    const result = loadScenarioJson(old)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('schemaVersion')
      expect(result.issues[0]?.message).toContain('cadena de migraciones está vacía')
    }
  })
})

describe('loadScenarioJson — sin pérdida silenciosa', () => {
  it('rechaza campos desconocidos de nivel superior con su ruta', () => {
    const input = JSON.stringify({ ...validCompleteObject, temperature: 5 })
    const result = loadScenarioJson(input)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.map((i) => i.path)).toEqual(['temperature'])
      expect(result.issues[0]?.message).toContain('no se descarta en silencio')
    }
  })

  it('rechaza campos desconocidos anidados (world.extra)', () => {
    const withWorld = {
      ...validCompleteObject,
      world: { ...validCompleteObject.world, extra: 1 },
    }
    const result = loadScenarioJson(JSON.stringify(withWorld))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.map((i) => i.path)).toEqual(['world.extra'])
    }
  })

  it('rechaza campos desconocidos dentro de arrays (objects[i].custom)', () => {
    const parsed = JSON.parse(validCompleteText) as { objects: Record<string, unknown>[] }
    parsed.objects[0] = { ...parsed.objects[0], customField: 'x' }
    const result = loadScenarioJson(JSON.stringify(parsed))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.map((i) => i.path)).toEqual(['objects[0].customField'])
    }
  })

  it('enumera TODOS los campos desconocidos, no solo el primero', () => {
    const input = JSON.stringify({
      ...validCompleteObject,
      temperature: 5,
      debug: true,
      world: { ...validCompleteObject.world, extra: 1 },
    })
    const result = loadScenarioJson(input)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.map((i) => i.path).sort()).toEqual([
        'debug',
        'temperature',
        'world.extra',
      ])
    }
  })
})

describe('loadScenarioJson — pureza (nunca daña el escenario actual)', () => {
  it('no muta la entrada: objeto congelado idéntico tras la carga', () => {
    const input = JSON.parse(validCompleteText)
    const snapshot = JSON.stringify(input)
    const result = loadScenarioJson(JSON.stringify(input))
    expect(result.ok).toBe(true)
    expect(JSON.stringify(input)).toBe(snapshot)
    if (result.ok) {
      // El dato devuelto es un objeto nuevo, no la entrada reutilizada.
      expect(result.data as unknown as object).not.toBe(input)
      // Mutar la salida no afecta a la entrada (aislamiento total).
      if ('name' in (result.data as object)) {
        ;(result.data as { name: string }).name = 'mutado'
      }
      expect(JSON.stringify(input)).toBe(snapshot)
    }
  })

  it('una carga fallida no toca el escenario ya cargado', () => {
    const first = loadScenarioJson(validCompleteText)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const before = exportScenario(first.data)
    const failed = loadScenarioJson('{"roto":')
    expect(failed.ok).toBe(false)
    expect(exportScenario(first.data)).toBe(before)
    expect(first.data.name).toBe('Fixture completo válido')
  })
})

describe('exportScenario — formato exportable determinista', () => {
  it('dos exportaciones del mismo escenario son idénticas', () => {
    const loaded = loadScenarioJson(validCompleteText)
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    const first = exportScenario(loaded.data)
    const second = exportScenario(loaded.data)
    expect(first).toBe(second)
  })

  it('usa indentación de 2 espacios y termina en salto de línea', () => {
    const loaded = loadScenarioJson(validMinimalText)
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    const text = exportScenario(loaded.data)
    expect(text.endsWith('\n')).toBe(true)
    expect(text).toContain('{\n  "')
  })

  it('ida y vuelta: cargar la exportación devuelve un escenario igual (profundo)', () => {
    const loaded = loadScenarioJson(validCompleteText)
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    const exported = exportScenario(loaded.data)
    const roundTrip = loadScenarioJson(exported)
    expect(roundTrip.ok).toBe(true)
    if (roundTrip.ok) {
      expect(roundTrip.data).toEqual(loaded.data)
    }
  })

  it('re-exportar lo reimportado produce exactamente el mismo texto', () => {
    const loaded = loadScenarioJson(validCompleteText)
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) return
    const exported = exportScenario(loaded.data)
    const roundTrip = loadScenarioJson(exported)
    expect(roundTrip.ok).toBe(true)
    if (roundTrip.ok) {
      expect(exportScenario(roundTrip.data)).toBe(exported)
    }
  })
})
