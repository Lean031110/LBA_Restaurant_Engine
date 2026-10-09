import { z } from 'zod'
import { AgentIdSchema, ZoneIdSchema } from '../ids'
import {
  NonEmptyStringSchema,
  PositiveFiniteNumberSchema,
  PositionSchema,
  RotationSchema,
} from '../units'

/**
 * Agent (contrato docs/guia/04, secciones 2 y 5): persona simulada con rol,
 * habilidades, posición, zona asignada, política y estado. Las instancias de
 * tarea y la traza de decisiones son datos de ejecución (FASE 04+), no del
 * escenario validado.
 */

/** Roles del restaurante (los clientes entran como agentes en FASE 08). */
export const AgentRoleSchema = z.enum([
  'waiter',
  'cook',
  'pizza_maker',
  'bartender',
  'lunch_runner',
  'dishwasher',
  'manager',
  'customer',
])
export type AgentRole = z.infer<typeof AgentRoleSchema>

/** Estado inicial declarado del agente. */
export const AgentStateSchema = z.enum(['idle', 'busy', 'walking', 'blocked'])
export type AgentState = z.infer<typeof AgentStateSchema>

/** Política del agente: orden de prioridades editable por el usuario. */
export const AgentPolicySchema = z.object({
  /** Prioridades ordenadas de mayor a menor urgencia (contrato sección 5). */
  priorityOrder: z
    .array(NonEmptyStringSchema)
    .refine((list) => new Set(list).size === list.length, {
      error: 'priorityOrder no puede repetir prioridades',
    }),
})

export type AgentPolicy = z.infer<typeof AgentPolicySchema>

/** Persona simulada del escenario. */
export const AgentSchema = z.object({
  id: AgentIdSchema,
  /** Nombre visible. */
  displayName: NonEmptyStringSchema,
  /** Rol principal. */
  role: AgentRoleSchema,
  /** Habilidades declaradas (afectan a qué tareas puede emprender). */
  skills: z.array(NonEmptyStringSchema),
  /** Posición inicial en unidades del mundo. */
  position: PositionSchema,
  /** Orientación inicial en grados [0, 360). */
  orientation: RotationSchema.optional(),
  /** Velocidad de desplazamiento en metros por segundo. */
  speedMps: PositiveFiniteNumberSchema.optional(),
  /** Zona principal asignada (opcional). */
  homeZoneId: ZoneIdSchema.optional(),
  /** Estado inicial. */
  state: AgentStateSchema.optional(),
  /** Política editable (prioridades de decisión). */
  policy: AgentPolicySchema.optional(),
})

export type Agent = z.infer<typeof AgentSchema>
