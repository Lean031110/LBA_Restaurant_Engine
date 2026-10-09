import { z } from 'zod'
import { InventoryItemIdSchema, WorldObjectIdSchema } from '../ids'
import {
  InventoryUnitSchema,
  NonEmptyStringSchema,
  NonNegativeFiniteNumberSchema,
  PositiveFiniteNumberSchema,
} from '../units'

/**
 * InventoryItem (contrato docs/guia/04, sección 2): unidad, existencias,
 * reserva, consumo, reposición y ubicación física. La reserva nunca puede
 * superar el stock disponible.
 */

/** Artículo de inventario del escenario. */
export const InventoryItemSchema = z
  .object({
    id: InventoryItemIdSchema,
    /** Nombre visible. */
    name: NonEmptyStringSchema,
    /** Unidad de medida del artículo. */
    unit: InventoryUnitSchema,
    /** Existencias iniciales (≥ 0). */
    stock: NonNegativeFiniteNumberSchema,
    /** Cantidad reservada (nunca superior al stock). */
    reserved: NonNegativeFiniteNumberSchema.optional(),
    /** Punto de reposición (cuando el stock cae por debajo, se repone). */
    reorderPoint: NonNegativeFiniteNumberSchema.optional(),
    /** Cantidad típica de reposición (> 0, si se declara). */
    replenishmentQuantity: PositiveFiniteNumberSchema.optional(),
    /** Ubicación física (objeto del mundo donde se guarda). */
    locationWorldObjectId: WorldObjectIdSchema.optional(),
  })
  .refine((i) => i.reserved === undefined || i.reserved <= i.stock, {
    error: 'la cantidad reservada no puede superar el stock disponible',
    path: ['reserved'],
  })

export type InventoryItem = z.infer<typeof InventoryItemSchema>
