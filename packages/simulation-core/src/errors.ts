/**
 * Errores del motor de simulación (FASE 04, prompt 04.3).
 *
 * Regla del contrato (docs/guia/04, sección 1): «un bloqueo o condición
 * imposible se refleja en el registro y no se arregla silenciosamente».
 * Todo error del motor es un `EngineError` con un `code` estable del
 * catálogo, un mensaje legible en español y el contexto disponible
 * (tiempo simulado, taskId, resourceId, actor, eventCode).
 */

/** Catálogo estable de códigos de error del motor. */
export const EngineErrorCodes = {
  /** Se intentó programar un evento en un tiempo anterior al actual. */
  schedule_in_past: 'schedule_in_past',
  /** Tiempo de evento inválido (no finito o negativo). */
  invalid_event_time: 'invalid_event_time',
  /** Prioridad fuera del rango 0..100. */
  invalid_priority: 'invalid_priority',
  /** Código de evento sin handler registrado (fallo temprano, no silencioso). */
  unhandled_event_code: 'unhandled_event_code',
  /** El reloj jamás retrocede (invariante). */
  time_went_backwards: 'time_went_backwards',
  /** Límite de eventos procesados superado (loop runaway). */
  runaway_limit: 'runaway_limit',
  /** Límite de tiempo simulado superado. */
  time_limit_exceeded: 'time_limit_exceeded',
  /** Tarea desconocida. */
  task_unknown: 'task_unknown',
  /** Definición de tarea inválida (validación al registrar). */
  task_invalid: 'task_invalid',
  /** La tarea ya está en estado terminal. */
  task_already_terminal: 'task_already_terminal',
  /** La tarea no está en ejecución. */
  task_not_running: 'task_not_running',
  /** Dependencia circular entre tareas. */
  dependency_cycle: 'dependency_cycle',
  /** Recurso desconocido. */
  resource_unknown: 'resource_unknown',
  /** Capacidad de recurso inválida (entero >= 1). */
  resource_capacity_invalid: 'resource_capacity_invalid',
  /** Cantidad a reservar inválida (entero >= 1). */
  reservation_amount_invalid: 'reservation_amount_invalid',
  /** Reserva que excedería la capacidad (invariante atómica). */
  reservation_exceeded: 'reservation_exceeded',
  /** Liberación sin reserva previa válida. */
  release_without_reservation: 'release_without_reservation',
  /** Invariante del contrato violada (detallado en `details`). */
  invariant_violation: 'invariant_violation',
  /** Operación inválida en el estado actual del motor. */
  invalid_engine_state: 'invalid_engine_state',
} as const

export type EngineErrorCode = (typeof EngineErrorCodes)[keyof typeof EngineErrorCodes]

/** Contexto incluido en los errores del motor (todo opcional, según disponible). */
export interface EngineErrorContext {
  simulationTimeSeconds?: number
  taskId?: string
  resourceId?: string
  actor?: string
  eventCode?: string
  eventId?: number
  [clave: string]: unknown
}

/** Error del motor: código estable + mensaje legible + contexto. */
export class EngineError extends Error {
  readonly code: EngineErrorCode
  readonly context: EngineErrorContext

  constructor(code: EngineErrorCode, message: string, context: EngineErrorContext = {}) {
    const detalle = Object.entries(context)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${String(v)}`)
      .join(' ')
    super(detalle ? `${message} (${detalle})` : message)
    this.name = 'EngineError'
    this.code = code
    this.context = context
  }
}
