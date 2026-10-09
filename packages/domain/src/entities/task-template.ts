import { z } from 'zod'
import { EquipmentIdSchema, TaskTemplateIdSchema } from '../ids'
import { NonEmptyStringSchema } from '../units'
import { SecondsParameterSchema } from '../parameter'

/**
 * TaskTemplate (contrato docs/guia/04, sección 2): plantilla de tarea con
 * precondiciones, pasos, dependencias, recursos, duración, efectos,
 * prioridad, condición de interrupción y alternativa ante bloqueo.
 * Las instancias (TaskInstance) son datos de ejecución (FASE 04+).
 */

/** Paso de una plantilla de tarea. */
export const TaskStepSchema = z.object({
  /** Nombre visible del paso. */
  name: NonEmptyStringSchema,
  /** Duración estimada del paso (parámetro con procedencia). */
  durationSeconds: SecondsParameterSchema.optional(),
  /** Equipo requerido durante el paso (opcional). */
  requiresEquipmentId: EquipmentIdSchema.optional(),
  /** Si el paso puede ejecutarse en paralelo con otros (contrato sección 7). */
  parallelizable: z.boolean().optional(),
})

export type TaskStep = z.infer<typeof TaskStepSchema>

/** Plantilla de tarea reutilizable. */
export const TaskTemplateSchema = z
  .object({
    id: TaskTemplateIdSchema,
    /** Nombre visible. */
    name: NonEmptyStringSchema,
    /** Precondiciones descriptivas (el motor las formaliza en FASE 06). */
    preconditions: z.array(NonEmptyStringSchema),
    /** Pasos ordenados de la tarea. */
    steps: z.array(TaskStepSchema).min(1, {
      error: 'una plantilla de tarea necesita al menos un paso',
    }),
    /** Identificadores de tareas que deben completarse antes (opcional). */
    dependencies: z.array(TaskTemplateIdSchema),
    /** Recursos requeridos (IDs de equipos/zonas como texto; FASE 06 los tipa). */
    requiredResourceIds: z.array(NonEmptyStringSchema),
    /** Duración total estimada, si se declara aparte de los pasos. */
    durationSeconds: SecondsParameterSchema.optional(),
    /** Efectos descriptivos al completar (inventario, estado, etc.). */
    effects: z.array(NonEmptyStringSchema),
    /** Prioridad base 0 (baja) a 100 (alta). */
    priority: z
      .number()
      .int({ error: 'priority debe ser un entero' })
      .refine((v) => v >= 0 && v <= 100, {
        error: 'priority debe estar entre 0 y 100',
      }),
    /** Condición de interrupción (descriptiva, editable). */
    interruptCondition: NonEmptyStringSchema.optional(),
    /** Tarea alternativa ante bloqueo (opcional). */
    fallbackTaskId: TaskTemplateIdSchema.optional(),
  })
  .refine((t) => t.fallbackTaskId === undefined || t.fallbackTaskId !== t.id, {
    error: 'fallbackTaskId no puede apuntar a la propia plantilla',
    path: ['fallbackTaskId'],
  })

export type TaskTemplate = z.infer<typeof TaskTemplateSchema>
