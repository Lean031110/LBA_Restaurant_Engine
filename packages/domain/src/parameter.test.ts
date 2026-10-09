import { describe, expect, it } from 'vitest'
import {
  CelsiusParameterSchema,
  ParameterRecordSchema,
  SecondsParameterSchema,
  UNIT_CONSTRAINTS,
  estimatedCelsius,
  estimatedSeconds,
} from './parameter'
import { ParameterUnitSchema } from './units'
import { validate } from './validation'

const base = {
  value: 120,
  unit: 's',
  sourceType: 'estimated',
  confidence: 'low',
} as const

const baseCelsius = {
  value: 190,
  unit: 'C',
  sourceType: 'estimated',
  confidence: 'low',
} as const

const basePercent = {
  value: 50,
  unit: '%',
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

  it('rechaza minValue y maxValue no finitos', () => {
    for (const campo of ['minValue', 'maxValue'] as const) {
      const result = validate(ParameterRecordSchema, {
        ...base,
        [campo]: Number.NaN,
      })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.issues.some((i) => i.path === campo)).toBe(true)
      }
    }
  })
})

describe('duraciones en segundos: nunca negativas (invariante de simulación)', () => {
  it('acepta duraciones positivas, cero y decimales', () => {
    expect(validate(SecondsParameterSchema, { ...base, value: 240 }).ok).toBe(true)
    // Cero: tiene sentido operacional (encendido instantáneo, paso inmediato).
    expect(validate(SecondsParameterSchema, { ...base, value: 0 }).ok).toBe(true)
    expect(validate(SecondsParameterSchema, { ...base, value: 0.5 }).ok).toBe(true)
  })

  it('rechaza value negativo con ruta exacta y mensaje de la unidad', () => {
    const result = validate(SecondsParameterSchema, { ...base, value: -30 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === 'value')).toBe(true)
      expect(result.issues.some((i) => i.message.includes('no puede ser negativa'))).toBe(true)
    }
  })

  it('rechaza minValue y maxValue negativos aunque value sea válido', () => {
    const minNegativo = validate(SecondsParameterSchema, { ...base, minValue: -10 })
    expect(minNegativo.ok).toBe(false)
    if (!minNegativo.ok) {
      expect(minNegativo.issues.some((i) => i.path === 'minValue')).toBe(true)
    }
    const maxNegativo = validate(SecondsParameterSchema, { ...base, maxValue: -1 })
    expect(maxNegativo.ok).toBe(false)
    if (!maxNegativo.ok) {
      expect(maxNegativo.issues.some((i) => i.path === 'maxValue')).toBe(true)
    }
  })

  it('rechaza scenarioOverrideValue negativo', () => {
    const result = validate(SecondsParameterSchema, { ...base, scenarioOverrideValue: -1 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === 'scenarioOverrideValue')).toBe(true)
    }
  })

  it('no impone tope superior arbitrario: un día entero sin rango declarado es válido', () => {
    const result = validate(SecondsParameterSchema, { ...base, value: 86_400 })
    expect(result.ok).toBe(true)
  })

  it('un rango declarado más estricto sigue siendo editable por el usuario', () => {
    const result = validate(SecondsParameterSchema, {
      ...base,
      value: 30,
      minValue: 10,
      maxValue: 60,
    })
    expect(result.ok).toBe(true)
    expect(validate(SecondsParameterSchema, { ...base, value: 5, minValue: 10 }).ok).toBe(false)
    expect(validate(SecondsParameterSchema, { ...base, value: 61, maxValue: 60 }).ok).toBe(false)
  })
})

describe('porcentajes: rango inclusivo 0–100 en todos los campos', () => {
  it('acepta los límites exactos 0 y 100 en value', () => {
    expect(validate(ParameterRecordSchema, { ...basePercent, value: 0 }).ok).toBe(true)
    expect(validate(ParameterRecordSchema, { ...basePercent, value: 100 }).ok).toBe(true)
  })

  it('rechaza value por debajo de 0 y por encima de 100', () => {
    const negativo = validate(ParameterRecordSchema, { ...basePercent, value: -0.5 })
    expect(negativo.ok).toBe(false)
    if (!negativo.ok) {
      expect(negativo.issues.some((i) => i.path === 'value')).toBe(true)
      expect(negativo.issues.some((i) => i.message.includes('porcentaje'))).toBe(true)
    }
    const excesivo = validate(ParameterRecordSchema, { ...basePercent, value: 100.5 })
    expect(excesivo.ok).toBe(false)
    if (!excesivo.ok) {
      expect(excesivo.issues.some((i) => i.path === 'value')).toBe(true)
    }
  })

  it('aplica el rango a minValue, maxValue y scenarioOverrideValue', () => {
    for (const caso of [
      { campo: 'minValue', valor: -10 },
      { campo: 'maxValue', valor: 150 },
      { campo: 'scenarioOverrideValue', valor: 120 },
    ] as const) {
      const result = validate(ParameterRecordSchema, { ...basePercent, [caso.campo]: caso.valor })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.issues.some((i) => i.path === caso.campo)).toBe(true)
      }
    }
  })

  it('un rango declarado no puede contradecir las cotas de la unidad', () => {
    // Propiedad anti-contradicción para el catálogo 02.2: las cotas de la
    // unidad son del dominio y se aplican también a minValue/maxValue; un
    // registro % con maxValue 200 se rechaza aunque value esté dentro de 0–100.
    const resultado = validate(ParameterRecordSchema, { ...basePercent, maxValue: 200 })
    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      expect(resultado.issues.some((i) => i.path === 'maxValue')).toBe(true)
      expect(
        resultado.issues.some((i) => i.path === 'maxValue' && i.message.includes('porcentaje')),
      ).toBe(true)
    }
  })

  it('acepta overrides y límites en los bordes exactos 0 y 100', () => {
    const result = validate(ParameterRecordSchema, {
      ...basePercent,
      minValue: 0,
      maxValue: 100,
      scenarioOverrideValue: 100,
    })
    expect(result.ok).toBe(true)
  })
})

describe('temperaturas Celsius: los rangos negativos son legítimos', () => {
  it('acepta valores negativos sin rango declarado', () => {
    expect(validate(CelsiusParameterSchema, { ...baseCelsius, value: -18 }).ok).toBe(true)
  })

  it('acepta un congelador con rango −25 a −15 y value −20', () => {
    const result = validate(CelsiusParameterSchema, {
      ...baseCelsius,
      value: -20,
      minValue: -25,
      maxValue: -15,
    })
    expect(result.ok).toBe(true)
  })

  it('sigue exigiendo el orden de los límites en negativos', () => {
    const result = validate(CelsiusParameterSchema, {
      ...baseCelsius,
      value: -20,
      minValue: -15,
      maxValue: -25,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === 'minValue')).toBe(true)
      expect(result.issues.some((i) => i.message.includes('minValue'))).toBe(true)
    }
  })

  it('sigue exigiendo coherencia de value con el rango declarado', () => {
    const porDebajo = validate(CelsiusParameterSchema, {
      ...baseCelsius,
      value: -30,
      minValue: -25,
      maxValue: -15,
    })
    expect(porDebajo.ok).toBe(false)
    if (!porDebajo.ok) {
      expect(porDebajo.issues.some((i) => i.path === 'value')).toBe(true)
    }
    const porEncima = validate(CelsiusParameterSchema, {
      ...baseCelsius,
      value: 0,
      minValue: -25,
      maxValue: -15,
    })
    expect(porEncima.ok).toBe(false)
    if (!porEncima.ok) {
      expect(porEncima.issues.some((i) => i.path === 'value')).toBe(true)
    }
  })

  it('acepta un override negativo dentro del rango del congelador', () => {
    const result = validate(CelsiusParameterSchema, {
      ...baseCelsius,
      value: -20,
      minValue: -25,
      maxValue: -15,
      scenarioOverrideValue: -18,
    })
    expect(result.ok).toBe(true)
  })
})

describe('scenarioOverrideValue: mismos límites que el parámetro base', () => {
  it('acepta un override dentro del rango declarado', () => {
    const result = validate(ParameterRecordSchema, {
      ...base,
      minValue: 60,
      maxValue: 300,
      scenarioOverrideValue: 90,
    })
    expect(result.ok).toBe(true)
  })

  it('rechaza un override por debajo del minValue declarado', () => {
    const result = validate(ParameterRecordSchema, {
      ...base,
      minValue: 60,
      maxValue: 300,
      scenarioOverrideValue: 30,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((i) => i.path === 'scenarioOverrideValue')).toBe(true)
      expect(
        result.issues.some(
          (i) => i.path === 'scenarioOverrideValue' && i.message.includes('minValue'),
        ),
      ).toBe(true)
    }
  })

  it('rechaza un override por encima del maxValue declarado', () => {
    const result = validate(ParameterRecordSchema, {
      ...base,
      minValue: 60,
      maxValue: 300,
      scenarioOverrideValue: 400,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(
        result.issues.some(
          (i) => i.path === 'scenarioOverrideValue' && i.message.includes('maxValue'),
        ),
      ).toBe(true)
    }
  })

  it('el override también respeta las cotas de la unidad (no solo el rango)', () => {
    // Duración: dentro del rango declarado pero negativo → inválido por unidad.
    const duracion = validate(SecondsParameterSchema, {
      ...base,
      minValue: -100,
      scenarioOverrideValue: -50,
    })
    expect(duracion.ok).toBe(false)
    if (!duracion.ok) {
      expect(duracion.issues.some((i) => i.path === 'scenarioOverrideValue')).toBe(true)
    }
    // Porcentaje: dentro de un rango declarado erróneo pero fuera de 0–100.
    const porcentaje = validate(ParameterRecordSchema, {
      ...basePercent,
      minValue: 0,
      maxValue: 200,
      scenarioOverrideValue: 150,
    })
    expect(porcentaje.ok).toBe(false)
    if (!porcentaje.ok) {
      expect(porcentaje.issues.some((i) => i.path === 'scenarioOverrideValue')).toBe(true)
    }
  })
})

describe('unidades persons, unit, m y cm', () => {
  it('persons exige cantidades enteras no negativas', () => {
    const basePersons = {
      value: 18,
      unit: 'persons',
      sourceType: 'estimated',
      confidence: 'low',
    } as const
    expect(validate(ParameterRecordSchema, basePersons).ok).toBe(true)
    expect(validate(ParameterRecordSchema, { ...basePersons, value: 0 }).ok).toBe(true)
    const fraccion = validate(ParameterRecordSchema, { ...basePersons, value: 2.5 })
    expect(fraccion.ok).toBe(false)
    if (!fraccion.ok) {
      expect(fraccion.issues.some((i) => i.path === 'value' && i.message.includes('entero'))).toBe(
        true,
      )
    }
    const negativo = validate(ParameterRecordSchema, { ...basePersons, value: -1 })
    expect(negativo.ok).toBe(false)
    if (!negativo.ok) {
      expect(negativo.issues.some((i) => i.path === 'value')).toBe(true)
    }
    // El override hereda la restricción de enteros.
    const overrideFraccion = validate(ParameterRecordSchema, {
      ...basePersons,
      scenarioOverrideValue: 22.5,
    })
    expect(overrideFraccion.ok).toBe(false)
    if (!overrideFraccion.ok) {
      expect(overrideFraccion.issues.some((i) => i.path === 'scenarioOverrideValue')).toBe(true)
    }
  })

  it('unit exige cantidades enteras no negativas', () => {
    const baseUnit = {
      value: 3,
      unit: 'unit',
      sourceType: 'estimated',
      confidence: 'low',
    } as const
    expect(validate(ParameterRecordSchema, baseUnit).ok).toBe(true)
    expect(validate(ParameterRecordSchema, { ...baseUnit, value: 3.5 }).ok).toBe(false)
    expect(validate(ParameterRecordSchema, { ...baseUnit, value: -2 }).ok).toBe(false)
  })

  it('m y cm admiten decimales no negativos y rechazan negativos', () => {
    const baseMetros = {
      value: 0.85,
      unit: 'm',
      sourceType: 'estimated',
      confidence: 'low',
    } as const
    expect(validate(ParameterRecordSchema, baseMetros).ok).toBe(true)
    expect(validate(ParameterRecordSchema, { ...baseMetros, value: 0 }).ok).toBe(true)
    expect(validate(ParameterRecordSchema, { ...baseMetros, value: -0.1 }).ok).toBe(false)

    const baseCentimetros = { ...baseMetros, value: 42.5, unit: 'cm' } as const
    expect(validate(ParameterRecordSchema, baseCentimetros).ok).toBe(true)
    expect(validate(ParameterRecordSchema, { ...baseCentimetros, value: -1 }).ok).toBe(false)
  })

  it('m/cm: la no negatividad alcanza minValue, maxValue y scenarioOverrideValue', () => {
    // Decisión de diseño confirmada contra el contrato (documentada en
    // parameter.ts): los parámetros de longitud son magnitudes; la cota se
    // aplica por igual a los cuatro campos numéricos. Las coordenadas con
    // signo tienen su propio hogar en PositionSchema (probado en units.test).
    const baseLongitud = {
      value: 0.85,
      unit: 'm',
      sourceType: 'estimated',
      confidence: 'low',
    } as const
    for (const campo of ['minValue', 'maxValue', 'scenarioOverrideValue'] as const) {
      for (const unidad of ['m', 'cm'] as const) {
        const result = validate(ParameterRecordSchema, {
          ...baseLongitud,
          unit: unidad,
          [campo]: -0.01,
        })
        expect(result.ok, `${unidad}.${campo} = -0.01 debe rechazarse`).toBe(false)
        if (!result.ok) {
          expect(result.issues.some((i) => i.path === campo)).toBe(true)
        }
      }
    }
    // Contrapartida positiva: magnitud decimal y override decimal dentro del rango.
    const valido = validate(ParameterRecordSchema, {
      ...baseLongitud,
      minValue: 0,
      maxValue: 2,
      scenarioOverrideValue: 1.25,
    })
    expect(valido.ok).toBe(true)
  })

  it('la tabla UNIT_CONSTRAINTS cubre todas las unidades permitidas', () => {
    for (const unidad of ParameterUnitSchema.options) {
      expect(UNIT_CONSTRAINTS[unidad]).toBeDefined()
    }
    // Coherencia con la semántica documentada.
    expect(UNIT_CONSTRAINTS.s).toEqual({ min: 0 })
    expect(UNIT_CONSTRAINTS.C).toEqual({})
    expect(UNIT_CONSTRAINTS['%']).toEqual({ min: 0, max: 100 })
    expect(UNIT_CONSTRAINTS.persons).toEqual({ min: 0, integer: true })
    expect(UNIT_CONSTRAINTS.unit).toEqual({ min: 0, integer: true })
    expect(UNIT_CONSTRAINTS.m).toEqual({ min: 0 })
    expect(UNIT_CONSTRAINTS.cm).toEqual({ min: 0 })
  })
})

describe('verifiedAt: fechas de calendario reales, no solo formato', () => {
  it('rechaza fechas imposibles con formato YYYY-MM-DD correcto', () => {
    for (const imposible of [
      '2026-02-30', // febrero nunca tiene 30 días
      '2026-04-31', // abril tiene 30 días
      '2026-13-01', // mes 13
      '2026-00-10', // mes 0
      '2026-01-00', // día 0
      '2026-02-29', // 2026 no es bisiesto
    ]) {
      const result = validate(ParameterRecordSchema, { ...base, verifiedAt: imposible })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.issues.some((i) => i.path === 'verifiedAt')).toBe(true)
        expect(result.issues.some((i) => i.message.includes('calendario'))).toBe(true)
      }
    }
  })

  it('acepta bisiestos reales y fechas pasadas válidas', () => {
    // Solo fechas pasadas o de hoy: la regla de no-futuro (describe
    // siguiente) rechaza cualquier fecha por delante de la UTC en curso.
    for (const valida of ['2024-02-29', '2000-02-29', '2020-02-29', '2026-01-01', '2026-10-09']) {
      expect(validate(ParameterRecordSchema, { ...base, verifiedAt: valida }).ok).toBe(true)
    }
  })

  it('sigue rechazando cadenas que no son fechas ISO', () => {
    for (const malFormato of ['2026-1-1', '26-01-01', '2026/10/09', 'hoy', '']) {
      expect(validate(ParameterRecordSchema, { ...base, verifiedAt: malFormato }).ok).toBe(false)
    }
  })
})

describe('verifiedAt: la fecha de verificación no puede ser futura', () => {
  /** Fecha UTC (YYYY-MM-DD) desplazada ± días desde hoy; estable cualquier día que se ejecute. */
  function fechaUtcDesdeHoy(dias: number): string {
    const hoy = new Date()
    const ms =
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()) + dias * 86_400_000
    return new Date(ms).toISOString().slice(0, 10)
  }

  it('acepta hoy, ayer y fechas pasadas lejanas', () => {
    for (const pasada of [fechaUtcDesdeHoy(0), fechaUtcDesdeHoy(-1), fechaUtcDesdeHoy(-3650)]) {
      expect(validate(ParameterRecordSchema, { ...base, verifiedAt: pasada }).ok).toBe(true)
    }
  })

  it('tolera hasta 1 día por delante de la fecha UTC (zonas horarias hasta UTC+14)', () => {
    // La tolerancia cubre la fecha local «de hoy» de un verificador en una
    // zona por delante de UTC; no abre la puerta a fechas futuras reales.
    expect(validate(ParameterRecordSchema, { ...base, verifiedAt: fechaUtcDesdeHoy(1) }).ok).toBe(
      true,
    )
  })

  it('rechaza fechas futuras con ruta exacta y mensaje específico', () => {
    for (const futura of [fechaUtcDesdeHoy(2), '2999-12-31']) {
      const result = validate(ParameterRecordSchema, { ...base, verifiedAt: futura })
      expect(result.ok, `verifiedAt ${futura} debe rechazarse`).toBe(false)
      if (!result.ok) {
        expect(result.issues.some((i) => i.path === 'verifiedAt')).toBe(true)
        expect(
          result.issues.some((i) => i.path === 'verifiedAt' && i.message.includes('futura')),
        ).toBe(true)
      }
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

  it('estimatedSeconds rechaza duraciones negativas (el helper no esquiva la regla)', () => {
    expect(() => estimatedSeconds(-1)).toThrow()
  })

  it('estimatedCelsius admite temperaturas negativas (congelador)', () => {
    const p = estimatedCelsius(-20, 'congelador doméstico estimado')
    expect(p.value).toBe(-20)
    expect(p.unit).toBe('C')
  })
})
