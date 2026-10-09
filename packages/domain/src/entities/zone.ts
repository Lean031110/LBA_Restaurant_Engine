import { z } from 'zod'
import { ZoneIdSchema } from '../ids'
import { NonEmptyStringSchema, PositionSchema } from '../units'

/**
 * Zone (contrato docs/guia/04, sección 2): límites, categoría, permisos,
 * capacidad, estación/función y reglas de acceso.
 */

/** Categorías funcionales de zona del local. */
export const ZoneCategorySchema = z.enum([
  'kitchen',
  'dining',
  'bar',
  'vip',
  'pizzeria',
  'dishwashing',
  'storage',
  'restroom',
  'exit',
  'corridor',
  'preparation',
])
export type ZoneCategory = z.infer<typeof ZoneCategorySchema>

/** Rectángulo de límites de la zona (esquinas min/max en unidades del mundo). */
export const ZoneBoundsSchema = z
  .object({
    min: PositionSchema,
    max: PositionSchema,
  })
  .refine((b) => b.min.x < b.max.x && b.min.y < b.max.y, {
    error: 'los límites son inválidos: min debe ser estrictamente menor que max en ambos ejes',
    path: ['min'],
  })

export type ZoneBounds = z.infer<typeof ZoneBoundsSchema>

/** Zona funcional del local. */
export const ZoneSchema = z.object({
  id: ZoneIdSchema,
  /** Nombre visible. */
  name: NonEmptyStringSchema,
  /** Categoría funcional. */
  category: ZoneCategorySchema,
  /** Límites rectangulares. */
  bounds: ZoneBoundsSchema,
  /** Capacidad de personas simultáneas (opcional, mínimo 1). */
  capacity: z
    .number()
    .int({ error: 'capacity debe ser un entero' })
    .refine((v) => v >= 1, { error: 'capacity debe ser mayor o igual que 1' })
    .optional(),
  /** Roles con permiso de acceso (vacío = sin restricción declarada). */
  allowedRoles: z.array(NonEmptyStringSchema),
  /** Estación/función principal dentro de la zona (opcional). */
  stationFunction: NonEmptyStringSchema.optional(),
  /** Reglas de acceso descriptivas (editables; el motor las formaliza en fases 06+). */
  accessRules: z.array(NonEmptyStringSchema),
})

export type Zone = z.infer<typeof ZoneSchema>
