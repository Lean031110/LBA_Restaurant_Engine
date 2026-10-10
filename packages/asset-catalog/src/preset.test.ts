import { describe, expect, it } from 'vitest'
import {
  CatalogObjectPresetSchema,
  CatalogZonePresetSchema,
  INTERACTION_POINT_MAX_OFFSET_M,
  estimatedSpec,
  flagSpec,
  frontInteractionPoint,
  centerInteractionPoint,
  type CatalogObjectPreset,
} from './preset'

/**
 * Pruebas de los esquemas del catálogo: aceptan lo válido y rechazan lo
 * inválido con la ruta exacta del campo. Los fixtures JSON cubren los casos
 * de archivo (fixtures.test.ts); aquí se prueban las reglas cruzadas y los
 * helpers a nivel de objeto.
 */

/** Preset base válido y mínimo para mutar en cada caso. */
function basePreset(): CatalogObjectPreset {
  return CatalogObjectPresetSchema.parse({
    id: 'cat_test-table-4',
    group: 'table',
    label: 'Mesa de prueba',
    description: 'Preset base válido para pruebas.',
    family: 'furniture',
    layer: 'furniture',
    tags: ['prueba'],
    dimensions: { width: 0.9, depth: 0.9 },
    heightM: 0.75,
    interactionPoint: { x: 0, y: 0.9 },
    materials: [{ id: 'wood', label: 'Madera', suggestedColor: '#8b5a2b' }],
    defaultMaterialId: 'wood',
    parameters: {},
    flags: {},
    iconId: 'table',
    usageNotes: ['Nota de prueba.'],
  })
}

describe('CatalogObjectPresetSchema', () => {
  it('acepta un preset base válido', () => {
    const preset = basePreset()
    expect(preset.id).toBe('cat_test-table-4')
    expect(preset.group).toBe('table')
  })

  it('rechaza defaultMaterialId que no existe en materials, con ruta exacta', () => {
    const preset = basePreset()
    const result = CatalogObjectPresetSchema.safeParse({ ...preset, defaultMaterialId: 'marble' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'defaultMaterialId')
      expect(issue).toBeDefined()
      expect(issue?.message).toContain('no existe en materials')
    }
  })

  it('rechaza punto de interacción fuera del anillo ampliado, con ruta exacta', () => {
    const preset = basePreset()
    // Huella 0.9×0.9 → anillo y máx = 0.45 + 0.5 = 0.95; 0.96 queda fuera.
    const result = CatalogObjectPresetSchema.safeParse({
      ...preset,
      interactionPoint: { x: 0, y: 0.96 },
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'interactionPoint')
      expect(issue).toBeDefined()
      expect(issue?.message).toContain('m de la huella')
    }
  })

  it('acepta el punto de interacción exactamente en el límite del anillo (0,95 m)', () => {
    const preset = basePreset()
    const result = CatalogObjectPresetSchema.safeParse({
      ...preset,
      interactionPoint: { x: 0, y: 0.45 + INTERACTION_POINT_MAX_OFFSET_M },
    })
    expect(result.success).toBe(true)
  })

  it('exige equipmentKind cuando family es "equipment", con ruta exacta', () => {
    const preset = basePreset()
    const asEquipment = {
      ...preset,
      id: 'cat_test-griddle',
      family: 'equipment',
      layer: 'equipment',
    }
    const bad = CatalogObjectPresetSchema.safeParse(asEquipment)
    expect(bad.success).toBe(false)
    if (!bad.success) {
      const issue = bad.error.issues.find((i) => i.path[0] === 'equipmentKind')
      expect(issue?.message).toContain('family "equipment"')
    }
    const good = CatalogObjectPresetSchema.safeParse({ ...asEquipment, equipmentKind: 'griddle' })
    expect(good.success).toBe(true)
  })

  it('rechaza equipmentKind en presets que no son family "equipment"', () => {
    const preset = basePreset()
    const result = CatalogObjectPresetSchema.safeParse({ ...preset, equipmentKind: 'griddle' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === 'equipmentKind')
      expect(issue?.message).toContain('solo aplica a presets con family "equipment"')
    }
  })

  it('exige doorMechanism en presets de puerta y lo rechaza fuera de ellas', () => {
    const doorBase = {
      ...basePreset(),
      id: 'cat_test-door-90',
      group: 'door',
      family: 'door',
      iconId: 'door',
    }
    const missing = CatalogObjectPresetSchema.safeParse(doorBase)
    expect(missing.success).toBe(false)
    if (!missing.success) {
      const issue = missing.error.issues.find((i) => i.path[0] === 'doorMechanism')
      expect(issue?.message).toContain('"swing" o "sliding"')
    }
    const withMechanism = CatalogObjectPresetSchema.safeParse({
      ...doorBase,
      doorMechanism: 'swing',
    })
    expect(withMechanism.success).toBe(true)

    const tableWithMechanism = CatalogObjectPresetSchema.safeParse({
      ...basePreset(),
      doorMechanism: 'swing',
    })
    expect(tableWithMechanism.success).toBe(false)
  })
})

describe('CatalogZonePresetSchema', () => {
  it('acepta una zona válida y rechaza accessRules vacío con ruta exacta', () => {
    const base = {
      id: 'cat_zone-test',
      category: 'kitchen',
      label: 'Zona de prueba',
      description: 'Zona base válida.',
      tags: ['prueba'],
      suggestedSize: { width: 4, depth: 3 },
      defaultCapacity: estimatedSpec({
        label: 'Ocupación',
        value: 2,
        unit: 'persons',
        minValue: 1,
        maxValue: 10,
        assumptions: 'prueba',
      }),
      allowedRoles: ['staff'],
      accessRules: ['Regla de prueba.'],
      iconId: 'zone',
      usageNotes: ['Nota de prueba.'],
    }
    expect(CatalogZonePresetSchema.safeParse(base).success).toBe(true)
    const bad = CatalogZonePresetSchema.safeParse({ ...base, accessRules: [] })
    expect(bad.success).toBe(false)
    if (!bad.success) {
      const issue = bad.error.issues.find((i) => i.path[0] === 'accessRules')
      expect(issue).toBeDefined()
    }
  })
})

describe('estimatedSpec', () => {
  it('construye y valida una especificación estimada completa', () => {
    const spec = estimatedSpec({
      label: 'Limpieza',
      value: 300,
      unit: 's',
      minValue: 60,
      maxValue: 1800,
      assumptions: 'prueba',
    })
    expect(spec.editable).toBe(true)
    expect(spec.record.unit).toBe('s')
    expect(spec.record.sourceType).toBe('estimated')
    expect(spec.record.confidence).toBe('low')
    expect(spec.record.assumptions).toBe('prueba')
  })

  it('es editable por defecto y admite editable: false', () => {
    const editable = estimatedSpec({ label: 'x', value: 1, unit: 'unit', assumptions: 'p' })
    expect(editable.editable).toBe(true)
    const fixed = estimatedSpec({
      label: 'x',
      editable: false,
      value: 1,
      unit: 'unit',
      assumptions: 'p',
    })
    expect(fixed.editable).toBe(false)
  })

  it('lanza con la ruta del campo si el rango contradice a la unidad', () => {
    let thrown: unknown
    try {
      estimatedSpec({
        label: 'Ocupación',
        value: 120,
        unit: '%',
        maxValue: 200,
        assumptions: 'prueba',
      })
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBeDefined()
    expect(String(thrown)).toContain('%')
  })

  it('rechaza escenarioOverrideValue fuera del rango declarado', () => {
    expect(() =>
      estimatedSpec({
        label: 'Limpieza',
        value: 300,
        unit: 's',
        minValue: 60,
        maxValue: 1800,
        scenarioOverrideValue: -5,
        assumptions: 'prueba',
      }),
    ).toThrow()
  })
})

describe('flagSpec', () => {
  it('construye una especificación booleana con nota opcional', () => {
    const flag = flagSpec({ label: 'Requiere vaso libre', value: true, note: 'precondición' })
    expect(flag.value).toBe(true)
    expect(flag.note).toBe('precondición')
    const bare = flagSpec({ label: 'Bare', value: false })
    expect(bare.note).toBeUndefined()
  })
})

describe('puntos de interacción', () => {
  it('frontInteractionPoint coloca el punto a 0,45 m de la cara frontal', () => {
    const point = frontInteractionPoint({ width: 1.2, depth: 0.7 })
    expect(point.x).toBe(0)
    expect(point.y).toBeCloseTo(0.35 + 0.45, 10)
  })

  it('centerInteractionPoint devuelve el origen del preset', () => {
    expect(centerInteractionPoint()).toEqual({ x: 0, y: 0 })
  })
})
