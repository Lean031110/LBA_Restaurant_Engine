import { describe, expect, it } from 'vitest'
import {
  DimensionsSchema,
  FiniteNumberSchema,
  InventoryUnitSchema,
  NonNegativeFiniteNumberSchema,
  NonEmptyStringSchema,
  PositiveFiniteNumberSchema,
  PositionSchema,
  RotationSchema,
  WorldLengthUnitSchema,
} from './units'
import { validate } from './validation'

describe('números finitos del dominio', () => {
  it('acepta números finitos', () => {
    expect(validate(FiniteNumberSchema, 3.5).ok).toBe(true)
    expect(validate(FiniteNumberSchema, 0).ok).toBe(true)
    expect(validate(FiniteNumberSchema, -2).ok).toBe(true)
  })

  it('rechaza Infinity y NaN', () => {
    for (const malo of [Number.POSITIVE_INFINITY, Number.NaN]) {
      const result = validate(FiniteNumberSchema, malo)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.issues[0].message.toLowerCase()).toMatch(/infinity|nan|finito/)
      }
    }
  })

  it('positivo acepta > 0 y rechaza 0 y negativos', () => {
    expect(validate(PositiveFiniteNumberSchema, 0.1).ok).toBe(true)
    expect(validate(PositiveFiniteNumberSchema, 0).ok).toBe(false)
    expect(validate(PositiveFiniteNumberSchema, -1).ok).toBe(false)
  })

  it('no negativo acepta >= 0 y rechaza negativos', () => {
    expect(validate(NonNegativeFiniteNumberSchema, 0).ok).toBe(true)
    expect(validate(NonNegativeFiniteNumberSchema, 7).ok).toBe(true)
    expect(validate(NonNegativeFiniteNumberSchema, -0.001).ok).toBe(false)
  })
})

describe('unidades explícitas', () => {
  it('longitud del mundo: solo m o cm (nunca píxeles)', () => {
    expect(validate(WorldLengthUnitSchema, 'm').ok).toBe(true)
    expect(validate(WorldLengthUnitSchema, 'cm').ok).toBe(true)
    expect(validate(WorldLengthUnitSchema, 'px').ok).toBe(false)
    expect(validate(WorldLengthUnitSchema, 'metros').ok).toBe(false)
  })

  it('unidades de inventario permitidas', () => {
    for (const u of ['unit', 'g', 'kg', 'ml', 'l']) {
      expect(validate(InventoryUnitSchema, u).ok).toBe(true)
    }
    expect(validate(InventoryUnitSchema, 'kilos').ok).toBe(false)
    expect(validate(InventoryUnitSchema, 'onzas').ok).toBe(false)
  })
})

describe('geometría del mundo', () => {
  it('posición exige coordenadas finitas con ruta exacta', () => {
    const result = validate(PositionSchema, { x: 1, y: Number.POSITIVE_INFINITY })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('y')
    }
  })

  it('dimensiones exigen ancho y fondo positivos', () => {
    expect(validate(DimensionsSchema, { width: 1.2, depth: 0.8 }).ok).toBe(true)
    const result = validate(DimensionsSchema, { width: -1, depth: 0.8 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('width')
      expect(result.issues[0].message).toContain('mayor que 0')
    }
  })

  it('rotación vive en [0, 360)', () => {
    expect(validate(RotationSchema, 0).ok).toBe(true)
    expect(validate(RotationSchema, 359.9).ok).toBe(true)
    expect(validate(RotationSchema, 360).ok).toBe(false)
    expect(validate(RotationSchema, -5).ok).toBe(false)
  })
})

describe('cadenas no vacías', () => {
  it('rechaza cadenas vacías', () => {
    expect(validate(NonEmptyStringSchema, '').ok).toBe(false)
    expect(validate(NonEmptyStringSchema, 'Salón').ok).toBe(true)
  })
})
