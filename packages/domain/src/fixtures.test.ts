import { describe, expect, it } from 'vitest'
import { isPlainObject, minimalScenarioExample } from './examples'
import { validateScenario } from './validation'

// Fixtures del repositorio (scenarios/fixtures): cada inválido contiene
// exactamente UNA violación documentada y el test exige la ruta de campo
// del error correspondiente (requisito de FASE 02).
import validMinimal from '../../../scenarios/fixtures/valid-minimal.json'
import validComplete from '../../../scenarios/fixtures/valid-complete.json'
import invalidVersion from '../../../scenarios/fixtures/invalid-unknown-schema-version.json'
import invalidDuplicateIds from '../../../scenarios/fixtures/invalid-duplicate-ids.json'
import invalidNonFinite from '../../../scenarios/fixtures/invalid-nonfinite-position.json'
import invalidUnits from '../../../scenarios/fixtures/invalid-bad-units.json'
import invalidSource from '../../../scenarios/fixtures/invalid-bad-source-type.json'
import invalidDimension from '../../../scenarios/fixtures/invalid-negative-dimension.json'

describe('fixtures válidos', () => {
  it('valid-minimal.json pasa la validación completa', () => {
    const result = validateScenario(validMinimal)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.id).toBe('scn_fixture-minimo')
      expect(result.data.objects).toHaveLength(1)
      expect(result.data.world.lengthUnit).toBe('m')
    }
  })

  it('valid-complete.json pasa la validación completa', () => {
    const result = validateScenario(validComplete)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.zones).toHaveLength(3)
      expect(result.data.objects).toHaveLength(5)
      expect(result.data.agents).toHaveLength(2)
      expect(result.data.equipment).toHaveLength(2)
      expect(result.data.orders).toHaveLength(2)
      expect(result.data.recipes).toHaveLength(2)
      expect(result.data.inventory).toHaveLength(5)
      expect(result.data.parameters['demanda-por-hora']?.scenarioOverrideValue).toBe(22)
    }
  })

  it('el ejemplo en código y el fixture JSON son coherentes', () => {
    const ejemplo = minimalScenarioExample()
    const fixture = validateScenario(validMinimal)
    expect(fixture.ok).toBe(true)
    if (fixture.ok) {
      expect(ejemplo.schemaVersion).toBe(fixture.data.schemaVersion)
      expect(ejemplo.world).toEqual(fixture.data.world)
    }
  })

  it('todos los fixtures son objetos planos', () => {
    for (const fixture of [
      validMinimal,
      validComplete,
      invalidVersion,
      invalidDuplicateIds,
      invalidNonFinite,
      invalidUnits,
      invalidSource,
      invalidDimension,
    ]) {
      expect(isPlainObject(fixture)).toBe(true)
    }
  })
})

describe('fixtures inválidos: rechazo con la ruta de campo exacta', () => {
  type CasoInvalido = {
    nombre: string
    entrada: unknown
    rutaEsperada: string
    fragmentoMensaje: string
  }

  const casos: CasoInvalido[] = [
    {
      nombre: 'versión de esquema desconocida',
      entrada: invalidVersion,
      rutaEsperada: 'schemaVersion',
      fragmentoMensaje: 'versión de esquema no soportada',
    },
    {
      nombre: 'IDs duplicados en zonas',
      entrada: invalidDuplicateIds,
      rutaEsperada: 'zones[1].id',
      fragmentoMensaje: 'duplicado',
    },
    {
      nombre: 'posición no finita (Infinity vía 1e999)',
      entrada: invalidNonFinite,
      rutaEsperada: 'objects[0].position.x',
      fragmentoMensaje: 'infinity',
    },
    {
      nombre: 'unidad de inventario inválida',
      entrada: invalidUnits,
      rutaEsperada: 'inventory[0].unit',
      fragmentoMensaje: 'unit',
    },
    {
      nombre: 'procedencia de parámetro inválida',
      entrada: invalidSource,
      rutaEsperada: 'equipment[0].warmupSeconds.sourceType',
      fragmentoMensaje: 'measured',
    },
    {
      nombre: 'dimensión negativa',
      entrada: invalidDimension,
      rutaEsperada: 'objects[0].dimensions.width',
      fragmentoMensaje: 'mayor que 0',
    },
  ]

  it.each(casos)('rechaza: $nombre', ({ entrada, rutaEsperada, fragmentoMensaje }) => {
    const result = validateScenario(entrada)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.length).toBeGreaterThan(0)
      const issue = result.issues.find((i) => i.path === rutaEsperada)
      expect(issue).toBeDefined()
      expect(issue?.message.toLowerCase()).toContain(fragmentoMensaje.toLowerCase())
    }
  })
})
