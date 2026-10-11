/**
 * Verificaciones de invariantes (FASE 04, prompt 04.3).
 *
 * Contrato (docs/guia/04, sección 1) — invariantes verificadas aquí:
 *
 * 1. El tiempo jamás retrocede: las entradas del registro son monótonas y
 *    ninguna supera el reloj actual.
 * 2. Recursos: `used <= capacity` en todos los recursos (capacidad 1 jamás
 *    compartida entre titulares incompatibles).
 * 3. Ninguna tarea terminal (completed/failed/cancelled) conserva reservas.
 * 4. Ninguna tarea en ejecución sin precondiciones cumplidas (dependencias
 *    completadas al momento de iniciar).
 * 5. Toda tarea en ejecución con duración > 0 tiene su evento interno de fin
 *    pendiente en la cola (si no, nunca terminaría: stall estructural).
 * 6. Toda tarea blocked/queued conserva su explicación `blockedBy`.
 *
 * El motor protege la mayoría por construcción; estas verificaciones son la
 * red de defensa (contrato: «un bloqueo o condición imposible se refleja en
 * el registro y no se arregla silenciosamente»). `checkInvariants` devuelve
 * el informe completo; `assertInvariants` lanza con la primera violación.
 */

import type { SimulationEngine } from './engine'
import { EngineError, EngineErrorCodes } from './errors'
import { TASK_COMPLETE_EVENT, type TaskScheduler } from './tasks'

/** Código de cada invariante (estable, para pruebas y reportes). */
export const InvariantCodes = {
  log_time_not_monotonic: 'log_time_not_monotonic',
  log_time_after_clock: 'log_time_after_clock',
  resource_over_capacity: 'resource_over_capacity',
  terminal_task_holds_reservations: 'terminal_task_holds_reservations',
  running_without_preconditions: 'running_without_preconditions',
  running_without_completion_event: 'running_without_completion_event',
  waiting_without_reason: 'waiting_without_reason',
} as const

export type InvariantCode = (typeof InvariantCodes)[keyof typeof InvariantCodes]

/** Una violación de invariante con su contexto. */
export interface InvariantViolation {
  code: InvariantCode
  detail: string
  taskId?: string
  resourceId?: string
  simulationTimeSeconds: number
}

/**
 * Verifica todas las invariantes y devuelve las violaciones (vacío = sano).
 * Función pura de análisis: no muta el motor ni el planificador.
 */
export function checkInvariants(
  engine: SimulationEngine,
  scheduler: TaskScheduler,
): InvariantViolation[] {
  const violaciones: InvariantViolation[] = []
  const ahora = engine.simulationTimeSeconds

  // 1) Monotonía del registro y coherencia con el reloj.
  let anterior = -Number.POSITIVE_INFINITY
  for (const entrada of engine.log.entries()) {
    if (entrada.time < anterior) {
      violaciones.push({
        code: InvariantCodes.log_time_not_monotonic,
        detail: `entrada ${entrada.sequence} (${entrada.code}) en t=${entrada.time} es anterior a la previa t=${anterior}`,
        simulationTimeSeconds: ahora,
      })
    }
    anterior = entrada.time
    if (entrada.time > ahora) {
      violaciones.push({
        code: InvariantCodes.log_time_after_clock,
        detail: `entrada ${entrada.sequence} (${entrada.code}) en t=${entrada.time} supera el reloj t=${ahora}`,
        simulationTimeSeconds: ahora,
      })
    }
  }

  // 2) Capacidad de recursos.
  for (const info of scheduler.pool.snapshot()) {
    if (info.used > info.capacity) {
      violaciones.push({
        code: InvariantCodes.resource_over_capacity,
        detail: `uso ${info.used} supera capacidad ${info.capacity}`,
        resourceId: info.resourceId,
        simulationTimeSeconds: ahora,
      })
    }
  }

  // 3-6) Estado de las tareas.
  const eventosFinPendientes = new Set(
    engine
      .pendingEvents()
      .filter((e) => e.code === TASK_COMPLETE_EVENT)
      .map((e) => (e.payload as { taskId: string }).taskId),
  )
  for (const t of scheduler.tasks()) {
    if (esTerminal(t)) {
      if (scheduler.pool.reservationsOf(t.taskId).length > 0) {
        violaciones.push({
          code: InvariantCodes.terminal_task_holds_reservations,
          detail: `tarea ${t.state} conserva ${scheduler.pool.reservationsOf(t.taskId).length} reserva(s)`,
          taskId: t.taskId,
          simulationTimeSeconds: ahora,
        })
      }
      continue
    }
    if (t.state === 'running') {
      // 4) Precondiciones: dependencias completadas.
      const depsNoCompletadas = t.dependsOn.filter(
        (dep) => scheduler.task(dep)?.state !== 'completed',
      )
      if (depsNoCompletadas.length > 0) {
        violaciones.push({
          code: InvariantCodes.running_without_preconditions,
          detail: `en ejecución con dependencias sin completar: ${depsNoCompletadas.join(', ')}`,
          taskId: t.taskId,
          simulationTimeSeconds: ahora,
        })
      }
      // 5) Evento de fin pendiente (duración > 0).
      if (t.durationSeconds > 0 && !eventosFinPendientes.has(t.taskId)) {
        violaciones.push({
          code: InvariantCodes.running_without_completion_event,
          detail: `duración ${t.durationSeconds}s sin evento de fin pendiente: la tarea nunca terminaría`,
          taskId: t.taskId,
          simulationTimeSeconds: ahora,
        })
      }
    }
    if (t.state === 'blocked' || t.state === 'queued') {
      if (!t.blockedBy) {
        violaciones.push({
          code: InvariantCodes.waiting_without_reason,
          detail: `tarea ${t.state} sin explicación blockedBy`,
          taskId: t.taskId,
          simulationTimeSeconds: ahora,
        })
      }
    }
  }

  return violaciones
}

/** Como `checkInvariants` pero lanza `EngineError` con la primera violación. */
export function assertInvariants(engine: SimulationEngine, scheduler: TaskScheduler): void {
  const violaciones = checkInvariants(engine, scheduler)
  if (violaciones.length > 0) {
    const v = violaciones[0]
    throw new EngineError(
      EngineErrorCodes.invariant_violation,
      `invariante violada [${v.code}]: ${v.detail}`,
      {
        taskId: v.taskId,
        resourceId: v.resourceId,
        simulationTimeSeconds: v.simulationTimeSeconds,
        totalViolaciones: violaciones.length,
      },
    )
  }
}

function esTerminal(t: { state: string }): boolean {
  return t.state === 'completed' || t.state === 'failed' || t.state === 'cancelled'
}
