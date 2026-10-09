import { describe, expect, it } from 'vitest'
import { ZoneSchema } from './entities/zone'
import { PositionSchema } from './units'
import {
  ScenarioValidationError,
  formatPath,
  validate,
  validateScenarioOrThrow,
} from './validation'

describe('formatPath (rutas de campo legibles)', () => {
  it('formatea segmentos anidados con índices de array', () => {
    expect(formatPath(['objects', 2, 'position', 'x'])).toBe('objects[2].position.x')
    expect(formatPath(['zones', 0, 'bounds', 'min', 'y'])).toBe('zones[0].bounds.min.y')
    expect(formatPath(['schemaVersion'])).toBe('schemaVersion')
    expect(formatPath([])).toBe('(raíz)')
  })
})

describe('validate (genérico con rutas)', () => {
  it('devuelve ok:true con los datos tipados', () => {
    const result = validate(PositionSchema, { x: 1, y: 2 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.x).toBe(1)
    }
  })

  it('acumula todos los problemas con sus rutas', () => {
    const result = validate(ZoneSchema, {
      id: 'mal',
      name: '',
      category: 'terraza',
      bounds: { min: { x: 5, y: 0 }, max: { x: 2, y: 8 } },
      allowedRoles: 'waiter',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const rutas = result.issues.map((i) => i.path)
      expect(rutas).toContain('id')
      expect(rutas).toContain('name')
      expect(rutas).toContain('category')
      expect(rutas).toContain('bounds.min')
      expect(rutas).toContain('allowedRoles')
    }
  })
})

describe('validateScenarioOrThrow', () => {
  it('lanza con todas las rutas en el mensaje', () => {
    let capturado: ScenarioValidationError | undefined
    try {
      validateScenarioOrThrow({
        schemaVersion: 7,
        id: 'scn_roto',
        name: 'Roto',
        world: { lengthUnit: 'm', size: { width: 1, depth: 1 } },
        seed: 1,
        objects: [],
        zones: [],
        agents: [],
        taskTemplates: [],
        equipment: [],
        orders: [],
        recipes: [],
        inventory: [],
        parameters: {},
      })
    } catch (error) {
      capturado = error as ScenarioValidationError
    }
    expect(capturado).toBeInstanceOf(ScenarioValidationError)
    expect(capturado?.message).toContain('schemaVersion')
    expect(capturado?.message).toContain('versión de esquema no soportada')
    expect(capturado?.issues.length).toBeGreaterThan(0)
  })

  it('no lanza cuando el escenario es válido', () => {
    expect(() =>
      validateScenarioOrThrow({
        schemaVersion: 1,
        id: 'scn_valido',
        name: 'Válido',
        world: { lengthUnit: 'm', size: { width: 4, depth: 4 } },
        seed: 0,
        objects: [],
        zones: [],
        agents: [],
        taskTemplates: [],
        equipment: [],
        orders: [],
        recipes: [],
        inventory: [],
        parameters: {},
      }),
    ).not.toThrow()
  })
})
