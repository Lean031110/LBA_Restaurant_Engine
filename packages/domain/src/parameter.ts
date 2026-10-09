import { z } from 'zod'
import { NonNegativeFiniteNumberSchema, ParameterUnitSchema } from './units'

/**
 * Registro de parámetro de simulación (regla 10 del prompt maestro y
 * plantilla docs/guia/PLANTILLAS/REGISTRO_DE_PARAMETRO.md): cada duración,
 * temperatura, capacidad y porcentaje lleva unidad, procedencia y confianza.
 * Los valores de ejemplo son estimaciones editables, nunca mediciones.
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
 * Cuerpo del registro de parámetro (sin refinamientos de rango; se aplican
 * después para poder derivar variantes con unidad fija mediante `.extend`).
 */
const ParameterRecordObjectSchema = z.object({
  /** Valor nominal del parámetro. */
  value: z.number().refine((v) => Number.isFinite(v), {
    error: 'value debe ser un número finito',
  }),
  /** Unidad explícita del valor. */
  unit: ParameterUnitSchema,
  /** Rango permitido para edición del usuario (opcional). */
  minValue: NonNegativeFiniteNumberSchema.optional(),
  maxValue: NonNegativeFiniteNumberSchema.optional(),
  /** Procedencia del valor. */
  sourceType: ParameterSourceSchema,
  /** Confianza declarada del valor. */
  confidence: ParameterConfidenceSchema,
  /** Nombre de la fuente (opcional). */
  sourceName: z.string().min(1).optional(),
  /** URL de la fuente (opcional, formato verificado). */
  sourceUrl: z.url({ error: 'sourceUrl debe ser una URL válida' }).optional(),
  /** Fecha de verificación en ISO-8601 (opcional). */
  verifiedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, {
      error: 'verifiedAt debe ser una fecha ISO (YYYY-MM-DD)',
    })
    .optional(),
  /** Supuestos del modelo (opcional). */
  assumptions: z.string().min(1).optional(),
  /** Override del escenario: valor alternativo fijado por el usuario. */
  scenarioOverrideValue: z
    .number()
    .refine((v) => Number.isFinite(v), {
      error: 'scenarioOverrideValue debe ser un número finito',
    })
    .optional(),
})

type ParameterRecordObject = z.infer<typeof ParameterRecordObjectSchema>

/** Reglas de rango comunes a todo registro de parámetro. */
function withParameterRules<S extends z.ZodType<ParameterRecordObject>>(schema: S) {
  return schema
    .refine(
      (p) => p.minValue === undefined || p.maxValue === undefined || p.minValue <= p.maxValue,
      {
        error: 'minValue debe ser menor o igual que maxValue',
        path: ['minValue'],
      },
    )
    .refine((p) => p.minValue === undefined || p.value >= p.minValue, {
      error: 'value está por debajo del minValue declarado',
      path: ['value'],
    })
    .refine((p) => p.maxValue === undefined || p.value <= p.maxValue, {
      error: 'value supera el maxValue declarado',
      path: ['value'],
    })
}

/** Registro completo de un parámetro de simulación. */
export const ParameterRecordSchema = withParameterRules(ParameterRecordObjectSchema)

export type ParameterRecord = z.infer<typeof ParameterRecordSchema>

/** Parámetro de duración: unidad fija en segundos. */
export const SecondsParameterSchema = withParameterRules(
  ParameterRecordObjectSchema.extend({
    unit: z.literal('s', {
      error: 'la unidad de una duración debe ser "s" (segundos)',
    }),
  }),
)
export type SecondsParameter = z.infer<typeof SecondsParameterSchema>

/** Parámetro de temperatura: unidad fija en grados Celsius. */
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
