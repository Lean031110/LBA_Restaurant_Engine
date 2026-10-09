import { z } from 'zod'
import { EquipmentIdSchema } from '../ids'
import { NonEmptyStringSchema } from '../units'
import { CelsiusParameterSchema, SecondsParameterSchema } from '../parameter'

/**
 * Equipment (contrato docs/guia/04, secciones 2, 3 y 7): equipo del local con
 * capacidad, máquina de estados y tiempos/temperaturas como parámetros
 * separados con unidad y procedencia.
 */

/** Tipos de equipo del contrato (sección 3). */
export const EquipmentKindSchema = z.enum([
  'griddle',
  'range',
  'fryer',
  'oven',
  'pizza_oven',
  'fridge',
  'freezer',
  'blender',
  'sink',
  'dishwasher',
  'ticket_printer',
  'pos',
])
export type EquipmentKind = z.infer<typeof EquipmentKindSchema>

/** Estados del equipo (contrato sección 2: off…cleaning). */
export const EquipmentStateSchema = z.enum([
  'off',
  'starting',
  'heating',
  'ready',
  'in_use',
  'cooling',
  'fault',
  'cleaning',
])
export type EquipmentState = z.infer<typeof EquipmentStateSchema>

/**
 * Definición de un equipo del escenario. Todos los tiempos y temperaturas
 * son ParameterRecord con unidad fija (regla 10: unidad + procedencia).
 */
export const EquipmentSchema = z.object({
  id: EquipmentIdSchema,
  /** Nombre visible (opcional). */
  name: NonEmptyStringSchema.optional(),
  /** Tipo de equipo. */
  kind: EquipmentKindSchema,
  /** Capacidad simultánea de trabajos (mínimo 1). */
  capacity: z
    .number()
    .int({ error: 'capacity debe ser un entero' })
    .refine((v) => v >= 1, { error: 'capacity debe ser mayor o igual que 1' }),
  /** Estado inicial declarado. */
  initialState: EquipmentStateSchema,
  /** Tiempo hasta estar operativo tras encender (contrato sección 7). */
  powerOnSeconds: SecondsParameterSchema.optional(),
  /** Tiempo de calentamiento hasta la temperatura objetivo. */
  warmupSeconds: SecondsParameterSchema.optional(),
  /** Temperatura objetivo de trabajo. */
  targetTemperatureC: CelsiusParameterSchema.optional(),
  /** Tiempo de recuperación de temperatura tras abrir/cargar. */
  heatRecoverySeconds: SecondsParameterSchema.optional(),
  /** Duración de un ciclo de trabajo típico. */
  cycleSeconds: SecondsParameterSchema.optional(),
  /** Tiempo de limpieza. */
  cleaningSeconds: SecondsParameterSchema.optional(),
  /** Tiempo de enfriamiento/apagado. */
  cooldownSeconds: SecondsParameterSchema.optional(),
  /** Reglas de uso descriptivas (editables). */
  usageRules: z.array(NonEmptyStringSchema),
})

export type Equipment = z.infer<typeof EquipmentSchema>
