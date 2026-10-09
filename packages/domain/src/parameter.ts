import { z } from 'zod'
import { FiniteNumberSchema, ParameterUnitSchema } from './units'
import type { ParameterUnit } from './units'

/**
 * Registro de parámetro de simulación (regla 10 del prompt maestro y
 * plantilla docs/guia/PLANTILLAS/REGISTRO_DE_PARAMETRO.md): cada duración,
 * temperatura, capacidad y porcentaje lleva unidad, procedencia y confianza.
 * Los valores de ejemplo son estimaciones editables, nunca mediciones.
 *
 * Invariantes semánticos por unidad (se aplican por igual a `value`,
 * `minValue`, `maxValue` y `scenarioOverrideValue`):
 *
 * - `s` (duración): no negativa. Todo tiempo de simulación representado en
 *   segundos — encendido y calentamiento de equipos, cocción y preparación,
 *   ciclos de trabajo, limpieza, recuperación térmica, enfriamiento, pasos
 *   de tareas/recetas y totales estimados — es tiempo transcurrido y no
 *   puede ser negativo. El 0 se admite donde tiene sentido operacional
 *   (encendido instantáneo, paso inmediato); un rango más estricto lo
 *   declara el usuario con `minValue`/`maxValue`. No se impone tope superior
 *   alguno: no se inventan límites arbitrarios que el usuario no pueda editar.
 * - `C` (temperatura): solo se exige número finito. Las temperaturas Celsius
 *   pueden ser negativas (p. ej. un congelador con rango −25 a −15 °C); no
 *   se imponen cotas físicas no declaradas por el contrato. Se mantiene el
 *   orden de los límites y la coherencia valor–unidad–rango declarado.
 * - `m`/`cm` (longitud): no negativas, con decimales. Los parámetros de
 *   longitud son magnitudes (alturas, distancias, profundidades); las
 *   coordenadas con signo viven en `PositionSchema`, no aquí.
 * - `persons` (personas): entero no negativo; cuenta personas discretas.
 * - `unit` (artículos): entero no negativo; cuenta artículos discretos.
 * - `%` (porcentaje): entre 0 y 100 inclusive, por definición de la unidad
 *   (docs de unidades: «porcentaje (0–100)»).
 */

/** Procedencia del valor (regla 10 y riesgo R-02). */
export const ParameterSourceSchema = z.enum([
  'measured',
  'official_source',
  'manufacturer',
  'estimated',
  'user_calibrated',
])
export type ParameterSource = z.infer<typeof ParameterSourceSchema>

/** Nivel de confianza declarado del valor. */
export const ParameterConfidenceSchema = z.enum(['low', 'medium', 'high'])
export type ParameterConfidence = z.infer<typeof ParameterConfidenceSchema>

/**
 * Restricciones numéricas que la propia unidad impone a los cuatro campos
 * numéricos del registro. `min`/`max` son inclusivos; `integer` exige
 * cantidades enteras. La ausencia de cota («undefined») significa que la
 * unidad solo exige un número finito: el rango editable lo define el
 * usuario con `minValue`/`maxValue`, nunca esta tabla.
 */
export interface UnitConstraints {
  /** Límite inferior inclusivo de la unidad, si la magnitud lo justifica. */
  min?: number
  /** Límite superior inclusivo de la unidad, si la magnitud lo justifica. */
  max?: number
  /** Si la unidad representa cantidades enteras (discretas). */
  integer?: boolean
}

/**
 * Restricciones por unidad del dominio (justificación en la documentación
 * del módulo). Es la única fuente de verdad de estos límites: el catálogo
 * de presets (02.2) y el editor la reutilizan en lugar de duplicarlas.
 */
export const UNIT_CONSTRAINTS: Record<ParameterUnit, UnitConstraints> = {
  s: { min: 0 },
  C: {},
  m: { min: 0 },
  cm: { min: 0 },
  persons: { min: 0, integer: true },
  unit: { min: 0, integer: true },
  '%': { min: 0, max: 100 },
}

/** Explicación humana de la restricción de cada unidad (mensajes de error). */
const UNIT_EXPLANATIONS: Record<ParameterUnit, string> = {
  s: 'una duración de simulación no puede ser negativa',
  C: 'las temperaturas en grados Celsius admiten valores negativos',
  m: 'una longitud en metros no puede ser negativa',
  cm: 'una longitud en centímetros no puede ser negativa',
  persons: 'un conteo de personas es un entero no negativo',
  unit: 'un conteo de artículos es un entero no negativo',
  '%': 'un porcentaje vive entre 0 y 100',
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Comprueba que la fecha existe en el calendario real: rechaza
 * «2026-02-30», «2026-13-01» o «2026-04-31», y acepta bisiestos reales
 * como «2024-02-29». No basta con el formato YYYY-MM-DD.
 */
function isRealCalendarDate(raw: string): boolean {
  if (!ISO_DATE_PATTERN.test(raw)) {
    return false
  }
  const year = Number(raw.slice(0, 4))
  const month = Number(raw.slice(5, 7))
  const day = Number(raw.slice(8, 10))
  if (month < 1 || month > 12) {
    return false
  }
  // Día 0 del mes siguiente = último día del mes consultado (maneja bisiestos).
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return day >= 1 && day <= daysInMonth
}

/** Fecha de verificación ISO-8601 que existe en el calendario real. */
export const VerifiedAtSchema = z.string().refine(isRealCalendarDate, {
  error: 'verifiedAt debe ser una fecha real del calendario en formato ISO (YYYY-MM-DD)',
})
export type VerifiedAt = z.infer<typeof VerifiedAtSchema>

/**
 * Cuerpo del registro de parámetro (sin refinamientos de rango; se aplican
 * después para poder derivar variantes con unidad fija mediante `.extend`).
 * Los cuatro campos numéricos solo exigen ser finitos aquí: el signo, la
 * integralidad y las cotas de la unidad se comprueban en `withParameterRules`
 * para poder distinguir temperaturas negativas legítimas de duraciones
 * negativas inválidas.
 */
const ParameterRecordObjectSchema = z.object({
  /** Valor nominal del parámetro. */
  value: FiniteNumberSchema,
  /** Unidad explícita del valor. */
  unit: ParameterUnitSchema,
  /** Rango permitido para edición del usuario (opcional). */
  minValue: FiniteNumberSchema.optional(),
  maxValue: FiniteNumberSchema.optional(),
  /** Procedencia del valor. */
  sourceType: ParameterSourceSchema,
  /** Confianza declarada del valor. */
  confidence: ParameterConfidenceSchema,
  /** Nombre de la fuente (opcional). */
  sourceName: z.string().min(1).optional(),
  /** URL de la fuente (opcional, formato verificado). */
  sourceUrl: z.url({ error: 'sourceUrl debe ser una URL válida' }).optional(),
  /** Fecha de verificación en ISO-8601 con calendario real (opcional). */
  verifiedAt: VerifiedAtSchema.optional(),
  /** Supuestos del modelo (opcional). */
  assumptions: z.string().min(1).optional(),
  /** Override del escenario: valor alternativo fijado por el usuario. */
  scenarioOverrideValue: FiniteNumberSchema.optional(),
})

type ParameterRecordObject = z.infer<typeof ParameterRecordObjectSchema>

/** Campos numéricos del registro sujetos a las restricciones de la unidad. */
const NUMERIC_FIELDS = ['value', 'minValue', 'maxValue', 'scenarioOverrideValue'] as const
type NumericFieldName = (typeof NUMERIC_FIELDS)[number]

/** Aplica a un campo numérico las restricciones de la unidad declarada. */
function applyUnitConstraints(
  ctx: z.RefinementCtx,
  field: NumericFieldName,
  raw: number,
  unit: ParameterUnit,
): void {
  const constraints = UNIT_CONSTRAINTS[unit]
  if (constraints.integer && !Number.isInteger(raw)) {
    ctx.addIssue({
      code: 'custom',
      path: [field],
      message: `${field} debe ser un número entero (${UNIT_EXPLANATIONS[unit]})`,
    })
  }
  if (constraints.min !== undefined && raw < constraints.min) {
    ctx.addIssue({
      code: 'custom',
      path: [field],
      message: `${field} = ${raw} no es válido para la unidad "${unit}" (${UNIT_EXPLANATIONS[unit]})`,
    })
  }
  if (constraints.max !== undefined && raw > constraints.max) {
    ctx.addIssue({
      code: 'custom',
      path: [field],
      message: `${field} = ${raw} no es válido para la unidad "${unit}" (${UNIT_EXPLANATIONS[unit]})`,
    })
  }
}

/**
 * Reglas semánticas comunes a todo registro de parámetro: cotas de la unidad
 * en los cuatro campos numéricos, orden de los límites declarados,
 * coherencia de `value` con su rango y los mismos límites para
 * `scenarioOverrideValue` (un override fuera de rango es inválido igual
 * que lo sería el valor base).
 */
function withParameterRules<S extends z.ZodType<ParameterRecordObject>>(schema: S) {
  return schema.superRefine((p, ctx) => {
    // 1. Cotas de la unidad aplicadas por igual a value, minValue, maxValue
    //    y scenarioOverrideValue.
    for (const field of NUMERIC_FIELDS) {
      const raw = p[field]
      if (raw !== undefined) {
        applyUnitConstraints(ctx, field, raw, p.unit)
      }
    }
    // 2. Orden de los límites declarados.
    if (p.minValue !== undefined && p.maxValue !== undefined && p.minValue > p.maxValue) {
      ctx.addIssue({
        code: 'custom',
        path: ['minValue'],
        message: 'minValue debe ser menor o igual que maxValue',
      })
    }
    // 3. Coherencia de value con el rango declarado.
    if (p.minValue !== undefined && p.value < p.minValue) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'value está por debajo del minValue declarado',
      })
    }
    if (p.maxValue !== undefined && p.value > p.maxValue) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'value supera el maxValue declarado',
      })
    }
    // 4. El override respeta el rango declarado del parámetro base.
    if (p.scenarioOverrideValue !== undefined) {
      if (p.minValue !== undefined && p.scenarioOverrideValue < p.minValue) {
        ctx.addIssue({
          code: 'custom',
          path: ['scenarioOverrideValue'],
          message: 'scenarioOverrideValue está por debajo del minValue declarado',
        })
      }
      if (p.maxValue !== undefined && p.scenarioOverrideValue > p.maxValue) {
        ctx.addIssue({
          code: 'custom',
          path: ['scenarioOverrideValue'],
          message: 'scenarioOverrideValue supera el maxValue declarado',
        })
      }
    }
  })
}

/** Registro completo de un parámetro de simulación. */
export const ParameterRecordSchema = withParameterRules(ParameterRecordObjectSchema)

export type ParameterRecord = z.infer<typeof ParameterRecordSchema>

/** Parámetro de duración: unidad fija en segundos (no negativa). */
export const SecondsParameterSchema = withParameterRules(
  ParameterRecordObjectSchema.extend({
    unit: z.literal('s', {
      error: 'la unidad de una duración debe ser "s" (segundos)',
    }),
  }),
)
export type SecondsParameter = z.infer<typeof SecondsParameterSchema>

/** Parámetro de temperatura: unidad fija en grados Celsius (admite negativos). */
export const CelsiusParameterSchema = withParameterRules(
  ParameterRecordObjectSchema.extend({
    unit: z.literal('C', {
      error: 'la unidad de una temperatura debe ser "C" (grados Celsius)',
    }),
  }),
)
export type CelsiusParameter = z.infer<typeof CelsiusParameterSchema>

/**
 * Crea un parámetro estimado en segundos (helper para fixtures y ejemplos;
 * los valores de ejemplo son estimaciones editables por diseño).
 */
export function estimatedSeconds(value: number, notes?: string): SecondsParameter {
  return SecondsParameterSchema.parse({
    value,
    unit: 's',
    sourceType: 'estimated',
    confidence: 'low',
    assumptions: notes,
  })
}

/** Crea un parámetro estimado en grados Celsius (helper de ejemplos). */
export function estimatedCelsius(value: number, notes?: string): CelsiusParameter {
  return CelsiusParameterSchema.parse({
    value,
    unit: 'C',
    sourceType: 'estimated',
    confidence: 'low',
    assumptions: notes,
  })
}
