import { z } from 'zod'
import { InventoryItemIdSchema, RecipeIdSchema } from '../ids'
import { NonEmptyStringSchema, PositiveFiniteNumberSchema } from '../units'
import { CelsiusParameterSchema, SecondsParameterSchema } from '../parameter'

/**
 * Recipe (contrato docs/guia/04, secciones 2 y 7): componentes, cantidades
 * con unidad, pasos con paralelismo, recursos, temperaturas/tiempos estimados
 * y condición final. El calentamiento del equipo se separa de la cocción del
 * alimento, del montaje y del emplatado.
 */

/** Tipo de paso de receta. */
export const RecipeStepKindSchema = z.enum([
  'prepare',
  'heat_equipment',
  'cook',
  'assemble',
  'plate',
])
export type RecipeStepKind = z.infer<typeof RecipeStepKindSchema>

/** Componente de receta: artículo de inventario + cantidad con unidad. */
export const RecipeComponentSchema = z.object({
  inventoryItemId: InventoryItemIdSchema,
  /** Cantidad consumida por unidad de receta (> 0). */
  quantity: PositiveFiniteNumberSchema,
  /** Unidad de la cantidad (debe coincidir con el artículo; se cruza en 02.3). */
  unit: z.enum(['unit', 'g', 'kg', 'ml', 'l'], {
    error: 'unidad de componente inválida (unit, g, kg, ml o l)',
  }),
})

export type RecipeComponent = z.infer<typeof RecipeComponentSchema>

/** Paso de receta. */
export const RecipeStepSchema = z.object({
  name: NonEmptyStringSchema,
  kind: RecipeStepKindSchema,
  /** Duración estimada del paso (parámetro con procedencia). */
  durationSeconds: SecondsParameterSchema.optional(),
  /** Temperatura de trabajo del paso (parámetro con procedencia). */
  targetTemperatureC: CelsiusParameterSchema.optional(),
  /** Si puede ejecutarse en paralelo con otros pasos. */
  parallelizable: z.boolean().optional(),
  /** Recursos requeridos (IDs de equipos; texto libre hasta FASE 06). */
  requiredResourceIds: z.array(NonEmptyStringSchema),
})

export type RecipeStep = z.infer<typeof RecipeStepSchema>

/** Receta del escenario. */
export const RecipeSchema = z
  .object({
    id: RecipeIdSchema,
    name: NonEmptyStringSchema,
    /** Componentes con cantidades y unidades (mínimo uno). */
    components: z.array(RecipeComponentSchema).min(1, {
      error: 'una receta necesita al menos un componente',
    }),
    /** Pasos ordenados (mínimo uno). */
    steps: z.array(RecipeStepSchema).min(1, {
      error: 'una receta necesita al menos un paso',
    }),
    /** Tiempo total estimado (parámetro, si se declara aparte de los pasos). */
    estimatedTotalSeconds: SecondsParameterSchema.optional(),
    /** Condición final de la receta (descriptiva, editable). */
    finalCondition: NonEmptyStringSchema.optional(),
  })
  .refine(
    (r) =>
      !r.steps.some((s) => s.kind === 'cook') ||
      r.steps.some((s) => s.kind === 'assemble' || s.kind === 'plate'),
    {
      error: 'una receta con cocción debe incluir un paso de montaje o emplatado',
      path: ['steps'],
    },
  )

export type Recipe = z.infer<typeof RecipeSchema>
