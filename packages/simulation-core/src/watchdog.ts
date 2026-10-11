/**
 * Watchdog lógico de progreso y deadlock (FASE 04, prompt 04.3).
 *
 * Responde: «¿la simulación puede avanzar?». Tres estados:
 *
 * - `ok`: hay eventos pendientes (la simulación avanza por sí sola) o todas
 *   las tareas están en estado terminal.
 * - `stalled`: NO hay eventos pendientes y existen tareas no terminales;
 *   nada volverá a ocurrir jamás (sus esperas nunca se satisfarán). Se
 *   reporta cada tarea con su motivo exacto.
 * - `deadlock`: el grafo de espera («quién espera a quién») contiene un
 *   ciclo. En el v1 actual los ciclos son estructuralmente imposibles por
 *   el registro topológico de dependencias y porque las tareas en ejecución
 *   no esperan a nadie, pero el detector existe como defensa ante fases
 *   futuras (agentes, condiciones compuestas) y ante errores de integración.
 *
 * Grafo de espera (aristas «A espera a B»):
 * - tarea `blocked` → cada dependencia no terminal;
 * - tarea `queued` → cada titular actual del recurso que le falta.
 */

import type { SimulationEngine } from './engine'
import type { TaskScheduler } from './tasks'

/** Estado del watchdog. */
export type WatchdogStatus = 'ok' | 'stalled' | 'deadlock'

/** Motivo por el que una tarea concreta no puede avanzar. */
export interface StallReason {
  taskId: string
  state: string
  reason: string
  waitingOn: string[]
}

/** Informe del watchdog. */
export interface WatchdogReport {
  status: WatchdogStatus
  /** Eventos pendientes en la cola del motor. */
  pendingEvents: number
  /** Tareas no terminales en este momento. */
  nonTerminalTasks: number
  /** Motivos de bloqueo (solo con status stalled/deadlock). */
  stalls: StallReason[]
  /** Miembros del ciclo detectado (solo con status deadlock). */
  cycle: string[]
}

/**
 * Detección de ciclos en un grafo genérico «nodo → nodos a los que espera».
 * Función pura: devuelve los miembros del primer ciclo encontrado (vacío si
 * no hay). Determinista: los nodos se recorren en orden lexicográfico.
 */
export function findCycle(grafo: Map<string, string[]>): string[] {
  const visitando = new Set<string>()
  const visitados = new Set<string>()
  let ciclo: string[] = []

  const dfs = (nodo: string, camino: string[]): void => {
    if (ciclo.length > 0) return
    visitando.add(nodo)
    camino.push(nodo)
    for (const siguiente of [...(grafo.get(nodo) ?? [])].sort()) {
      if (ciclo.length > 0) return
      if (visitando.has(siguiente)) {
        const inicio = camino.indexOf(siguiente)
        ciclo = camino.slice(inicio)
        return
      }
      if (!visitados.has(siguiente)) dfs(siguiente, camino)
    }
    camino.pop()
    visitando.delete(nodo)
    visitados.add(nodo)
  }

  for (const nodo of [...grafo.keys()].sort()) {
    if (!visitados.has(nodo)) dfs(nodo, [])
    if (ciclo.length > 0) break
  }
  return ciclo
}

/**
 * Construye el grafo de espera actual del planificador: taskId → taskIds de
 * quienes le bloquean (dependencias no terminales o titulares de recursos).
 */
export function buildWaitsFor(scheduler: TaskScheduler): Map<string, string[]> {
  const grafo = new Map<string, string[]>()
  for (const t of scheduler.tasks()) {
    if (t.state === 'blocked') {
      const deps = t.dependsOn.filter((dep) => {
        const d = scheduler.task(dep)
        return (
          d !== undefined &&
          d.state !== 'completed' &&
          d.state !== 'failed' &&
          d.state !== 'cancelled'
        )
      })
      if (deps.length > 0) grafo.set(t.taskId, deps)
    } else if (t.state === 'queued') {
      const titulares = [
        ...new Set(t.requires.flatMap((r) => scheduler.pool.holders(r.resourceId))),
      ]
      if (titulares.length > 0) grafo.set(t.taskId, titulares)
    }
  }
  return grafo
}

/**
 * Watchdog completo: analiza la capacidad de progreso de la simulación.
 * Función pura de diagnóstico: no muta nada.
 */
export function watchdog(engine: SimulationEngine, scheduler: TaskScheduler): WatchdogReport {
  const pendientes = engine.pendingCount
  const noTerminales = scheduler.tasks().filter((t) => !esTerminal(t))
  const ciclo = findCycle(buildWaitsFor(scheduler))

  if (ciclo.length > 0) {
    return {
      status: 'deadlock',
      pendingEvents: pendientes,
      nonTerminalTasks: noTerminales.length,
      stalls: noTerminales.map((t) => motivoDe(t, scheduler)),
      cycle: ciclo,
    }
  }

  if (pendientes === 0 && noTerminales.length > 0) {
    return {
      status: 'stalled',
      pendingEvents: 0,
      nonTerminalTasks: noTerminales.length,
      stalls: noTerminales.map((t) => motivoDe(t, scheduler)),
      cycle: [],
    }
  }

  return {
    status: 'ok',
    pendingEvents: pendientes,
    nonTerminalTasks: noTerminales.length,
    stalls: [],
    cycle: [],
  }
}

function motivoDe(
  t: { taskId: string; state: string; blockedBy?: { detail: string; waitingOn: string[] } },
  _scheduler: TaskScheduler,
): StallReason {
  if (t.state === 'running') {
    return {
      taskId: t.taskId,
      state: t.state,
      reason: 'en ejecución sin evento de fin pendiente (nunca terminará)',
      waitingOn: [],
    }
  }
  return {
    taskId: t.taskId,
    state: t.state,
    reason: t.blockedBy?.detail ?? 'sin razón registrada',
    waitingOn: t.blockedBy?.waitingOn ?? [],
  }
}

function esTerminal(t: { state: string }): boolean {
  return t.state === 'completed' || t.state === 'failed' || t.state === 'cancelled'
}
