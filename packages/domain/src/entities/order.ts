import { z } from 'zod'
import { OrderIdSchema, RecipeIdSchema } from '../ids'
import { NonEmptyStringSchema, NonNegativeFiniteNumberSchema } from '../units'

/**
 * Order (contrato docs/guia/04, sección 2): items, notas, prioridad y
 * tiempos de creación/promesa. La entrega y los estados de ejecución son
 * datos de runtime (FASE 04+); aquí se declara el estado inicial.
 */

/** Prioridad del pedido. */
export const OrderPrioritySchema = z.enum(['low', 'normal', 'urgent'])
export type OrderPriority = z.infer<typeof OrderPrioritySchema>

/** Línea de pedido: receta, cantidad y modificadores. */
export const OrderItemSchema = z.object({
  recipeId: RecipeIdSchema,
  /** Cantidad solicitada (entero ≥ 1). */
  quantity: z
    .number()
    .int({ error: 'quantity debe ser un entero' })
    .refine((v) => v >= 1, { error: 'quantity debe ser mayor o igual que 1' }),
  /** Modificadores (variante doble, sin cebolla, etc.). */
  modifiers: z.array(NonEmptyStringSchema),
})

export type OrderItem = z.infer<typeof OrderItemSchema>

/** Pedido del escenario. */
export const OrderSchema = z
  .object({
    id: OrderIdSchema,
    /** Líneas del pedido (mínimo una). */
    items: z.array(OrderItemSchema).min(1, {
      error: 'un pedido necesita al menos un item',
    }),
    /** Notas libres del cliente. */
    notes: NonEmptyStringSchema.optional(),
    /** Prioridad. */
    priority: OrderPrioritySchema,
    /** Tiempo de creación en segundos de simulación (≥ 0). */
    createdAtSeconds: NonNegativeFiniteNumberSchema,
    /** Tiempo prometido de entrega (debe ser posterior a la creación). */
    promisedAtSeconds: NonNegativeFiniteNumberSchema.optional(),
    /** Estado inicial (texto libre: los estados completos son configurables). */
    initialStatus: NonEmptyStringSchema.optional(),
  })
  .refine((o) => o.promisedAtSeconds === undefined || o.promisedAtSeconds > o.createdAtSeconds, {
    error: 'promisedAtSeconds debe ser posterior a createdAtSeconds',
    path: ['promisedAtSeconds'],
  })

export type Order = z.infer<typeof OrderSchema>
