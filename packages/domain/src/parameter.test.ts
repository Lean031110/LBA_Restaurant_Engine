import { describe, expect, it } from 'vitest'
import {
  CelsiusParameterSchema,
  ParameterRecordSchema,
  SecondsParameterSchema,
  estimatedCelsius,
  estimatedSeconds,
} from './parameter'
import { validate } from './validation'

const base = {
  value: 120,
  unit: 's',
  sourceType: 'estimated',
  confidence: 'low',
} as const

describe('ParameterRecord (regla 10: unidad + procedencia + confianza)', () => {
  it('acepta un registro completo válido', () => {
    const result = validate(ParameterRecordSchema, {
      ...base,
      sourceName: 'Manual del fabricante',
      sourceUrl: 'https://ejemplo.com/manual',
      verifiedAt: '2026-10-09',
      assumptions: 'A plena carga',
      scenarioOverrideValue: 90,
    })
    expect(result.ok).toBe(true)
  })

  it('rechaza procedencias no permitidas con ruta de campo', () => {
    const result = validate(ParameterRecordSchema, {
      ...base,
      sourceType: 'inventado',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('sourceType')
    }
  })

  it('rechaza unidades fuera de la lista', () => {
    const result = validate(ParameterRecordSchema, {
      ...base,
      unit: 'minutos',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('unit')
    }
  })

  it('exige confianza declarada', () => {
    const result = validate(ParameterRecordSchema, {
      value: 5,
      unit: 's',
      sourceType: 'measured',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === 'confidence')).toBe(true)
    }
  })

  it('valida el formato de la URL de fuente', () => {
    const result = validate(ParameterRecordSchema, {
      ...base,
      sourceUrl: 'no-es-una-url',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === 'sourceUrl')).toBe(true)
    }
  })

  it('rechaza minValue > maxValue con la ruta del problema', () => {
    const result = validate(ParameterRecordSchema, {
      ...base,
      minValue: 200,
      maxValue: 100,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((i) => i.message.includes('minValue'))).toBe(true)
    }
  })

  it('rechaza valores fuera del rango declarado', () => {
    const result = validate(ParameterRecordSchema, {
      ...base,
      minValue: 0,
      maxValue: 60,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === 'value')).toBe(true)
    }
  })

  it('rechaza valores no finitos', () => {
    const result = validate(ParameterRecordSchema, {
      ...base,
      value: Number.POSITIVE_INFINITY,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('value')
    }
  })
})

describe('parámetros con unidad fija', () => {
  it('SecondsParameter exige unidad "s"', () => {
    expect(validate(SecondsParameterSchema, base).ok).toBe(true)
    const result = validate(SecondsParameterSchema, {
      ...base,
      unit: 'C',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].message).toContain('"s"')
    }
  })

  it('CelsiusParameter exige unidad "C"', () => {
    expect(validate(CelsiusParameterSchema, { ...base, unit: 'C' }).ok).toBe(true)
    const result = validate(CelsiusParameterSchema, base)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].message).toContain('"C"')
    }
  })
})

describe('helpers de ejemplo (estimaciones editables)', () => {
  it('estimatedSeconds crea un parámetro válido en segundos', () => {
    const p = estimatedSeconds(240, 'estimación de cocina de prueba')
    expect(p.unit).toBe('s')
    expect(p.sourceType).toBe('estimated')
    expect(p.confidence).toBe('low')
    expect(p.assumptions).toContain('estimación')
  })

  it('estimatedCelsius crea un parámetro válido en Celsius', () => {
    const p = estimatedCelsius(190)
    expect(p.unit).toBe('C')
    expect(p.value).toBe(190)
  })
})
