/**
 * Tareas con precondiciones, dependencias y registro (FASE 04, prompt 04.2).
 *
 * Estados de una tarea (contrato docs/guia/04 sección 2):
 *
 * - `blocked`: alguna dependencia no está completada (espera a otras tareas).
 * - `ready`: dependencias completadas, aún sin intentar arrancar.
 * - `queued`: se intentó arrancar pero falta capacidad de recurso; espera
 *   con `blockedBy` explicando QUÉ recurso falta y cuánto hay disponible.
 *   Nunca se inicia parcialmente (reserva atómica todo-o-nada).
 * - `running`: iniciada; posee sus reservas y (si durationSeconds > 0) tiene
 *   un evento interno `__task.complete` programado.
 * - `completed` / `failed` / `cancelled`: terminales.
 *
 * Reglas documentadas:
 *
 * - **Arranque automático determinista**: cuando una tarea queda lista, el
 *   planificador intenta arrancarla; entre candidatas se elige por
 *   `(priority DESC, taskId ASC)` (misma escala del dominio: 0 baja, 100
 *   alta; desempate lexicográfico estable). El re-intento tras liberar
 *   recursos sigue el mismo orden.
 * - **Duración**: `durationSeconds > 0` programa el fin en
 *   `inicio + duración`; `0` significa completación atómica al iniciar.
 * - **Fallo de dependencia**: si una dependencia termina en `failed` o
 *   `cancelled`, las tareas que dependen de ella pasan a `failed` con código
 *   `dependency_failed` (explícito, nunca bloqueo eterno silencioso).
 * - **Liberación en fallo/cancelación/fin**: TODAS las reservas del titular
 *   se liberan en orden inverso de adquisición (`pool.releaseAll`) y cada
 *   liberación queda registrada (`resource.released`).
 * - **Eventos internos**: `__task.complete` usa prioridad 50 y el orden de
 *   programación normal; un fin explícito (`completeTask`) cancela el evento
 *   interno pendiente para no duplicar.
 */

import type { SimulationEngine } from './engine'
import { EngineError, EngineErrorCodes } from './errors'
import { ResourcePool, type ResourceDefinition, type ResourceRequest } from './resources'

/** Código interno del evento de fin de tarea (espacio de nombres reservado). */
export const TASK_COMPLETE_EVENT = '__task.complete'

/** Estados de una tarea (contrato sección 2). */
export type TaskState =
  'blocked' | 'ready' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

/** Por qué una tarea no avanza (solo en blocked/queued). */
export interface BlockedInfo {
  kind: 'dependency' | 'resource'
  detail: string
  waitingOn: string[]
}

/** Definición para registrar una tarea. */
export interface TaskDefinition {
  /** Identificador estable (no la posición). */
  taskId: string
  /** Nombre visible (opcional). */
  name?: string
  /** Prioridad 0 (baja) .. 100 (alta), escala del dominio. */
  priority: number
  /** Tareas que deben completarse antes (deben existir al registrar). */
  dependsOn?: string[]
  /** Recursos requeridos (deben existir al registrar; cantidad 1 por defecto). */
  requires?: ResourceRequest[]
  /** Duración simulada en segundos (>= 0; 0 = completación atómica). */
  durationSeconds: number
  /** Actor que ejecuta la tarea (opcional). */
  actor?: string
  /** Enlace con plantillas del dominio (FASE 06; opcional). */
  templateId?: string
}

/** Instancia observable de una tarea (estado de ejecución). */
export interface TaskInstance {
  readonly taskId: string
  readonly name: string
  readonly priority: number
  readonly actor?: string
  readonly templateId?: string
  readonly dependsOn: string[]
  readonly requires: Array<{ resourceId: string; amount: number }>
  readonly durationSeconds: number
  state: TaskState
  registeredAt: number
  startedAt?: number
  endedAt?: number
  blockedBy?: BlockedInfo
  failCode?: string
}

/** Payload del evento interno de fin de tarea. */
interface CompletePayload {
  taskId: string
}

/** Resumen ejecutable de la corrida (métricas mínimas del contrato sección 8). */
export interface SchedulerSummary {
  tasks: Record<TaskState, number>
  events: Record<string, number>
  resources: Record<
    string,
    {
      capacity: number
      used: number
      peakUsed: number
      totalReservations: number
      totalReleases: number
    }
  >
  simulationTimeSeconds: number
}

/**
 * Planificador de tareas sobre el motor: registra recursos y tareas,
 * arranca automáticamente en orden determinista, programa los fines y
 * libera locks en cada transición terminal. Se limpia con `engine.reset()`.
 */
export class TaskScheduler {
  private readonly tareas = new Map<string, TaskInstance>()
  private readonly pendientesFin = new Map<string, number>()

  constructor(
    private readonly motor: SimulationEngine,
    readonly pool: ResourcePool = new ResourcePool(),
  ) {
    motor.on(TASK_COMPLETE_EVENT, (evento) => {
      const { taskId } = evento.payload as CompletePayload
      this.completar(taskId, 'duración cumplida')
    })
    motor.onReset(() => {
      this.tareas.clear()
      this.pendientesFin.clear()
      this.pool.clear()
    })
  }

  /** Registra un recurso (valida capacidad e ids). */
  registerResource(def: ResourceDefinition): this {
    this.pool.register(def)
    this.motor.log.push({
      time: this.motor.simulationTimeSeconds,
      code: 'resource.registered',
      resourceId: def.resourceId,
      detail: `capacidad ${def.capacity}`,
    })
    return this
  }

  /**
   * Registra una tarea. Valida ids, prioridad, duración, existencia de
   * dependencias y recursos, y ausencia de autodependencia. La tarea entra
   * como `blocked` o `ready` y se intenta arrancar de inmediato si procede.
   */
  registerTask(def: TaskDefinition): TaskInstance {
    const ahora = this.motor.simulationTimeSeconds
    this.validar(def)
    if (this.tareas.has(def.taskId)) {
      throw new EngineError(EngineErrorCodes.task_invalid, 'taskId ya registrado', {
        taskId: def.taskId,
      })
    }
    const dependsOn = def.dependsOn ?? []
    const requires = (def.requires ?? []).map((r) => ({
      resourceId: r.resourceId,
      amount: r.amount ?? 1,
    }))
    const instancia: TaskInstance = {
      taskId: def.taskId,
      name: def.name ?? def.taskId,
      priority: def.priority,
      actor: def.actor,
      templateId: def.templateId,
      dependsOn,
      requires,
      durationSeconds: def.durationSeconds,
      state: 'blocked',
      registeredAt: ahora,
    }
    this.tareas.set(def.taskId, instancia)
    this.motor.log.push({
      time: ahora,
      code: 'task.registered',
      taskId: def.taskId,
      actor: def.actor,
      detail: `prioridad ${def.priority}, duración ${def.durationSeconds}s`,
    })
    this.evaluarDependencias()
    this.intentarArrancar()
    return instancia
  }

  /** Instancia de una tarea (undefined si no existe). */
  task(taskId: string): TaskInstance | undefined {
    return this.tareas.get(taskId)
  }

  /** Todas las instancias (orden de registro). */
  tasks(): TaskInstance[] {
    return [...this.tareas.values()]
  }

  /** Instancias filtradas por estado. */
  tasksByState(estado: TaskState): TaskInstance[] {
    return this.tasks().filter((t) => t.state === estado)
  }

  /**
   * Completa explícitamente una tarea en ejecución (pruebas/handlers).
   * Estricta: una tarea no en ejecución es un error del llamador (el evento
   * interno sí tolera la raza con fines explícitos ya procesados).
   */
  completeTask(taskId: string, detail = 'completada explícitamente'): void {
    const t = this.exigir(taskId)
    if (t.state !== 'running') {
      throw new EngineError(
        EngineErrorCodes.task_not_running,
        'solo se completan tareas en ejecución',
        {
          taskId,
          estado: t.state,
        },
      )
    }
    this.completar(taskId, detail)
  }

  /** Falla una tarea desde cualquier estado no terminal y libera sus locks. */
  failTask(taskId: string, failCode: string, detail?: string): void {
    const t = this.exigir(taskId)
    if (esTerminal(t)) {
      throw new EngineError(
        EngineErrorCodes.task_already_terminal,
        'la tarea ya está en estado terminal',
        {
          taskId,
          estado: t.state,
        },
      )
    }
    this.terminal(t, 'failed', failCode, detail ?? `fallo: ${failCode}`)
  }

  /** Cancela una tarea desde cualquier estado no terminal y libera sus locks. */
  cancelTask(taskId: string, detail = 'cancelada'): void {
    const t = this.exigir(taskId)
    if (esTerminal(t)) {
      throw new EngineError(
        EngineErrorCodes.task_already_terminal,
        'la tarea ya está en estado terminal',
        {
          taskId,
          estado: t.state,
        },
      )
    }
    this.terminal(t, 'cancelled', 'cancelled', detail)
  }

  /**
   * Resumen de la corrida: tareas por estado, conteo de eventos del registro
   * y utilización de recursos (capacidad, uso actual, pico y totales).
   */
  summary(): SchedulerSummary {
    const tareas: Record<TaskState, number> = {
      blocked: 0,
      ready: 0,
      queued: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    }
    for (const t of this.tareas.values()) tareas[t.state]++
    const resources: SchedulerSummary['resources'] = {}
    for (const info of this.pool.snapshot()) {
      resources[info.resourceId] = {
        capacity: info.capacity,
        used: info.used,
        peakUsed: info.peakUsed,
        totalReservations: info.totalReservations,
        totalReleases: info.totalReleases,
      }
    }
    return {
      tasks: tareas,
      events: this.motor.log.counts(),
      resources,
      simulationTimeSeconds: this.motor.simulationTimeSeconds,
    }
  }

  // ---- Internos ---------------------------------------------------------

  private validar(def: TaskDefinition): void {
    if (typeof def.taskId !== 'string' || def.taskId.length === 0) {
      throw new EngineError(EngineErrorCodes.task_invalid, 'taskId inválido (cadena no vacía)')
    }
    if (!Number.isInteger(def.priority) || def.priority < 0 || def.priority > 100) {
      throw new EngineError(EngineErrorCodes.task_invalid, 'prioridad debe ser entero 0..100', {
        taskId: def.taskId,
        priority: def.priority,
      })
    }
    if (!Number.isFinite(def.durationSeconds) || def.durationSeconds < 0) {
      throw new EngineError(
        EngineErrorCodes.task_invalid,
        'durationSeconds inválido (finito y >= 0)',
        {
          taskId: def.taskId,
        },
      )
    }
    for (const dep of def.dependsOn ?? []) {
      if (dep === def.taskId) {
        throw new EngineError(
          EngineErrorCodes.task_invalid,
          'una tarea no puede depender de sí misma',
          {
            taskId: def.taskId,
          },
        )
      }
      if (!this.tareas.has(dep)) {
        throw new EngineError(
          EngineErrorCodes.task_unknown,
          'dependencia no registrada (registrar en orden topológico)',
          {
            taskId: def.taskId,
            dependencia: dep,
          },
        )
      }
    }
    for (const req of def.requires ?? []) {
      if (!this.pool.has(req.resourceId)) {
        throw new EngineError(
          EngineErrorCodes.resource_unknown,
          'recurso requerido no registrado',
          {
            taskId: def.taskId,
            resourceId: req.resourceId,
          },
        )
      }
    }
  }

  /** Recalcula estados de dependencia (blocked ⇄ ready) y propaga fallos. */
  private evaluarDependencias(): void {
    // 1) Propagar fallo/cancelación de dependencias a las dependientes.
    for (const t of this.tareas.values()) {
      if (t.state !== 'blocked') continue
      const rota = t.dependsOn.find((dep) => {
        const d = this.tareas.get(dep)
        return d !== undefined && (d.state === 'failed' || d.state === 'cancelled')
      })
      if (rota !== undefined) {
        t.state = 'failed'
        t.failCode = 'dependency_failed'
        t.endedAt = this.motor.simulationTimeSeconds
        t.blockedBy = undefined
        this.motor.log.push({
          time: this.motor.simulationTimeSeconds,
          code: 'task.dependency_failed',
          taskId: t.taskId,
          actor: t.actor,
          detail: `dependencia '${rota}' terminó sin completarse`,
        })
      }
    }
    // 2) Deps completadas: blocked → ready.
    for (const t of this.tareas.values()) {
      if (t.state !== 'blocked') continue
      if (t.dependsOn.every((dep) => this.tareas.get(dep)?.state === 'completed')) {
        t.state = 'ready'
        t.blockedBy = undefined
        this.motor.log.push({
          time: this.motor.simulationTimeSeconds,
          code: 'task.ready',
          taskId: t.taskId,
          actor: t.actor,
        })
      } else {
        const pendientes = t.dependsOn.filter((dep) => this.tareas.get(dep)?.state !== 'completed')
        t.blockedBy = {
          kind: 'dependency',
          detail: `espera a: ${pendientes.join(', ')}`,
          waitingOn: pendientes,
        }
      }
    }
  }

  /**
   * Intenta arrancar las tareas arrancables (ready/queued) en orden
   * `(priority DESC, taskId ASC)`. Reserva atómicamente; si falta capacidad,
   * la tarea queda `queued` con el recurso conflictivo documentado.
   */
  private intentarArrancar(): void {
    const candidatas = this.tasks()
      .filter((t) => t.state === 'ready' || t.state === 'queued')
      .sort((a, b) => b.priority - a.priority || (a.taskId < b.taskId ? -1 : 1))
    for (const t of candidatas) {
      if (t.state === 'ready' || t.state === 'queued') this.intentar(t)
    }
  }

  private intentar(t: TaskInstance): void {
    const ahora = this.motor.simulationTimeSeconds
    const resultado = this.pool.tryReserveAll(t.requires, t.taskId, ahora)
    if (!resultado.ok) {
      t.state = 'queued'
      t.blockedBy = {
        kind: 'resource',
        detail: `recurso '${resultado.resourceId}': necesita ${resultado.needed}, disponible ${resultado.available}`,
        waitingOn: [resultado.resourceId],
      }
      this.motor.log.push({
        time: ahora,
        code: 'task.queued',
        taskId: t.taskId,
        actor: t.actor,
        resourceId: resultado.resourceId,
        detail: `necesita ${resultado.needed}, disponible ${resultado.available}`,
      })
      return
    }
    t.state = 'running'
    t.startedAt = ahora
    t.blockedBy = undefined
    for (const r of resultado.reservations) {
      this.motor.log.push({
        time: ahora,
        code: 'resource.reserved',
        taskId: t.taskId,
        actor: t.actor,
        resourceId: r.resourceId,
        detail: `cantidad ${r.amount}`,
      })
    }
    this.motor.log.push({
      time: ahora,
      code: 'task.started',
      taskId: t.taskId,
      actor: t.actor,
      detail:
        t.requires.length > 0
          ? `recursos: ${t.requires.map((r) => r.resourceId).join(', ')}`
          : 'sin recursos',
    })
    if (t.durationSeconds === 0) {
      this.completar(t.taskId, 'duración 0 (atómica)')
    } else {
      const evento = this.motor.schedule({
        time: ahora + t.durationSeconds,
        code: TASK_COMPLETE_EVENT,
        actor: t.actor,
        target: t.taskId,
        payload: { taskId: t.taskId } satisfies CompletePayload,
      })
      this.pendientesFin.set(t.taskId, evento.id)
    }
  }

  /** Transición a completada (por evento interno o explícita). */
  private completar(taskId: string, detalle: string): void {
    const t = this.exigir(taskId)
    if (t.state !== 'running') {
      // El evento interno puede llegar tras un fin explícito ya procesado:
      // no es un error del motor, la tarea ya terminó por otra vía registrada.
      if (esTerminal(t)) return
      throw new EngineError(
        EngineErrorCodes.task_not_running,
        'solo se completan tareas en ejecución',
        {
          taskId,
          estado: t.state,
        },
      )
    }
    this.cancelarEventoInterno(taskId)
    this.terminal(t, 'completed', undefined, detalle)
  }

  /** Transición terminal común: libera locks (LIFO) y reintenta arranques. */
  private terminal(
    t: TaskInstance,
    estado: 'completed' | 'failed' | 'cancelled',
    failCode: string | undefined,
    detalle: string,
  ): void {
    t.state = estado
    t.endedAt = this.motor.simulationTimeSeconds
    t.failCode = failCode
    t.blockedBy = undefined
    this.cancelarEventoInterno(t.taskId)
    const liberadas = this.pool.releaseAll(t.taskId)
    for (const r of liberadas) {
      this.motor.log.push({
        time: t.endedAt,
        code: 'resource.released',
        taskId: t.taskId,
        actor: t.actor,
        resourceId: r.resourceId,
        detail: `cantidad ${r.amount}`,
      })
    }
    this.motor.log.push({
      time: t.endedAt,
      code: `task.${estado}`,
      taskId: t.taskId,
      actor: t.actor,
      detail: detalle,
    })
    this.pool.checkInvariant()
    this.evaluarDependencias()
    this.intentarArrancar()
  }

  private cancelarEventoInterno(taskId: string): void {
    const id = this.pendientesFin.get(taskId)
    if (id !== undefined) {
      this.motor.cancel(id)
      this.pendientesFin.delete(taskId)
    }
  }

  private exigir(taskId: string): TaskInstance {
    const t = this.tareas.get(taskId)
    if (!t) {
      throw new EngineError(EngineErrorCodes.task_unknown, 'tarea desconocida', { taskId })
    }
    return t
  }
}

function esTerminal(t: TaskInstance): boolean {
  return t.state === 'completed' || t.state === 'failed' || t.state === 'cancelled'
}

/** Crea un planificador sobre el motor (con pool propio por defecto). */
export function createTaskScheduler(engine: SimulationEngine, pool?: ResourcePool): TaskScheduler {
  return new TaskScheduler(engine, pool)
}
