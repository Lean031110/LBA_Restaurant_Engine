import { describe, expect, it } from 'vitest'
import { CURRENT_SCENARIO_SCHEMA_VERSION, ScenarioSchema, type Scenario } from './scenario'
import { minimalScenarioExample } from './examples'
import { validate } from './validation'

/** Clona un escenario (los escenarios son datos JSON por diseño). */
function cloneScenario(scenario: Scenario): Scenario {
  return JSON.parse(JSON.stringify(scenario)) as Scenario
}

describe('ScenarioSchema', () => {
  it('el ejemplo mínimo pasa la validación completa', () => {
    const escenario = minimalScenarioExample()
    const result = validate(ScenarioSchema, escenario)
    expect(result.ok).toBe(true)
  })

  it('rechaza versiones de esquema desconocidas con ruta exacta', () => {
    const escenario = minimalScenarioExample()
    const result = validate(ScenarioSchema, {
      ...escenario,
      schemaVersion: CURRENT_SCENARIO_SCHEMA_VERSION + 41,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const issue = result.issues.find((i) => i.path === 'schemaVersion')
      expect(issue).toBeDefined()
      expect(issue?.message).toContain('versión de esquema no soportada')
    }
  })

  it('rechaza IDs duplicados con la ruta del duplicado', () => {
    const escenario = minimalScenarioExample()
    const duplicado = cloneScenario(escenario)
    duplicado.objects.push({ ...duplicado.objects[0]! })
    const result = validate(ScenarioSchema, duplicado)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const issue = result.issues.find((i) => i.path.startsWith('objects[1].id'))
      expect(issue).toBeDefined()
      expect(issue?.message).toContain('duplicado')
      expect(issue?.message).toContain('objects')
    }
  })

  it('detecta duplicados en cualquier colección (inventario)', () => {
    const escenario = minimalScenarioExample()
    const duplicado = cloneScenario(escenario)
    duplicado.inventory.push({ ...duplicado.inventory[0]! })
    const result = validate(ScenarioSchema, duplicado)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      // El ejemplo tiene 2 artículos: el duplicado queda en el índice 2.
      expect(result.issues.some((i) => i.path.startsWith('inventory[2].id'))).toBe(true)
    }
  })

  it('la semilla debe ser un entero no negativo', () => {
    const escenario = minimalScenarioExample()
    expect(validate(ScenarioSchema, { ...escenario, seed: -1 }).ok).toBe(false)
    expect(validate(ScenarioSchema, { ...escenario, seed: 1.5 }).ok).toBe(false)
  })

  it('el mundo exige unidad de longitud real y tamaño positivo', () => {
    const escenario = minimalScenarioExample()
    const px = validate(ScenarioSchema, {
      ...escenario,
      world: { lengthUnit: 'px', size: { width: 10, depth: 8 } },
    })
    expect(px.ok).toBe(false)
    if (!px.ok) {
      expect(px.issues[0].path).toBe('world.lengthUnit')
    }
    const negativo = validate(ScenarioSchema, {
      ...escenario,
      world: { lengthUnit: 'm', size: { width: -10, depth: 8 } },
    })
    expect(negativo.ok).toBe(false)
    if (!negativo.ok) {
      expect(negativo.issues[0].path).toBe('world.size.width')
    }
  })

  it('los parámetros globales se validan con el mismo registro', () => {
    const escenario = minimalScenarioExample()
    const result = validate(ScenarioSchema, {
      ...escenario,
      parameters: {
        'demanda-base': {
          value: 10,
          unit: 'persons',
          sourceType: 'estimated',
          confidence: 'low',
        },
      },
    })
    expect(result.ok).toBe(true)
    const mal = validate(ScenarioSchema, {
      ...escenario,
      parameters: {
        'demanda-base': {
          value: 10,
          unit: 'persons',
          sourceType: 'adivinado',
          confidence: 'low',
        },
      },
    })
    expect(mal.ok).toBe(false)
    if (!mal.ok) {
      expect(mal.issues[0].path).toBe('parameters.demanda-base.sourceType')
    }
  })
})
