/**
 * Motor de simulación de eventos discretos (FASE 04, prompt 04.1).
 *
 * Núcleo matemático puro: sin React, sin DOM y sin temporizadores reales
 * (regla 11 y contrato docs/guia/04 sección 1). La UI puede ejecutar todos
 * los eventos hasta una hora (`runUntil`), ejecutar uno (`step`), pausar y
 * reanudar (`pause`/`resume`) o reiniciar (`reset`) SIN alterar las reglas
 * matemáticas: el orden y los tiempos de los eventos son idénticos sin
 * importar cómo se trocee la ejecución. La velocidad visual (1x/10x) es
 * responsabilidad de la UI; el motor solo conoce tiempo simulado.
 *
 * Semántica documentada:
 *
 * - **Orden**: tupla `(time, priority, sequence)` — tiempo ascendente,
 *   prioridad DESCENDENTE en el empate (100 = máxima urgencia, misma escala
 *   que `TaskTemplate.priority` del dominio), y `sequence` de programación
 *   ascendente como desempate final (ver `queue.ts`).
 * - **Programar en el pasado**: error `schedule_in_past`. Programar en el
 *   instante actual es válido y se despacha a continuación.
 * - **Handler obligatorio**: programar un código sin handler registrado es
 *   error `unhandled_event_code` (fallo temprano, nunca un no-op silencioso).
 * - **Cancelación**: explícita y con resultado (`cancelled` o
 *   `already_cancelled`/`not_found`); el evento cancelado NO se ejecuta y se
 *   registra en el historial con `engine.event_cancelled`.
 * - **Pausa**: `pause()` solicita que `runUntil` se detenga ANTES de
 *   despachar el siguiente evento (el evento en curso termina de ejecutarse).
 *   `step()` es control manual explícito y funciona incluso en pausa; el
 *   orden resultante es idéntico al de una corrida continua.
 * - **Error de handler/invariante**: se registra `engine.error`, la corrida se
 *   aborta y el motor queda en estado `error`; solo `reset()` lo devuelve a
 *   un estado utilizable (nada se arregla silenciosamente).
 * - **Runaway**: `runUntil` despacha como máximo `maxEvents` eventos por
 *   llamada (por defecto 1 000 000); superarlo es el error `runaway_limit`,
 *   que expone loops infinitos (p. ej. eventos que se reprograman sin
 *   avanzar el tiempo).
 * - **Reset**: devuelve el motor al estado inicial (reloj a 0, cola y
 *   registro vacíos, pausa retirada) y elimina tareas/reservas del run
 *   anterior; los handlers registrados y la semilla son configuración y
 *   se conservan.
 */

import { SimulationClock } from './clock'
import { EventQueue, type ScheduledEvent } from './queue'
import { EventLog, type LogEntry } from './log'
import { EngineError, EngineErrorCodes } from './errors'
import { createRng, type Rng } from './random'

/** Versión del motor (se registra en cada exportación; contrato sección 8). */
export const ENGINE_VERSION = '0.1.0'

/** Entrada para programar un evento. */
export interface ScheduleInput<P = unknown> {
  /** Tiempo simulado de ejecución (>= tiempo actual). */
  time: number
  /** Código semántico (debe tener handler registrado). */
  code: string
  /** Urgencia 0 (baja) .. 100 (alta); por defecto 50. */
  priority?: number
  /** Actor que lo dispara (opcional). */
  actor?: string
  /** Objetivo del evento (opcional). */
  target?: string
  /** Datos asociados (opcional). */
  payload?: P
}

/** Handler de evento: sincrónico y determinista (puede programar más eventos). */
export type EventHandler<P = unknown> = (event: ScheduledEvent<P>, engine: SimulationEngine) => void

/** Handler almacenado (registro heterogéneo de payloads). */
type StoredHandler = (event: ScheduledEvent<unknown>, engine: SimulationEngine) => void

/** Resultado de una corrida `runUntil`. */
export interface RunResult {
  /** `completed` = se alcanzó el objetivo; `paused` = se detuvo por pausa. */
  status: 'completed' | 'paused'
  /** Eventos despachados en esta llamada. */
  processed: number
  /** Tiempo simulado al empezar la llamada. */
  fromTime: number
  /** Tiempo simulado al terminar la llamada. */
  toTime: number
}

/** Opciones de creación del motor. */
export interface EngineOptions {
  /** Semilla reproducible (por defecto 0). Misma semilla ⇒ misma secuencia aleatoria. */
  seed?: number
  /** Límite de eventos despachados por llamada a `runUntil` (runaway). */
  maxEvents?: number
  /** Límite de tiempo simulado: programar más allá es error. Por defecto sin límite. */
  maxTime?: number
}

/** Estado interno del motor. */
export type EngineState = 'idle' | 'running' | 'paused' | 'error'

/**
 * Motor de eventos discretos determinista. Ver semántica en la cabecera del
 * archivo. `simulation-core` no conoce restaurantes: las entidades de dominio
 * llegan en fases posteriores (05+); este núcleo solo ordena, despacha y
 * protege invariantes.
 */
export class SimulationEngine {
  readonly version = ENGINE_VERSION
  readonly seed: number

  private readonly clock = new SimulationClock()
  private readonly queue = new EventQueue()
  private readonly registro = new EventLog()
  private readonly handlers = new Map<string, StoredHandler>()
  private readonly maxEvents: number
  private readonly maxTime: number
  private pausado = false
  private estado: EngineState = 'idle'
  private readonly rng: Rng
  private readonly alRestablecer: Array<() => void> = []

  constructor(options: EngineOptions = {}) {
    const { seed = 0, maxEvents = 1_000_000, maxTime = Number.POSITIVE_INFINITY } = options
    if (!Number.isFinite(seed) || !Number.isInteger(seed) || seed < 0) {
      throw new EngineError(
        EngineErrorCodes.invalid_engine_state,
        'semilla inválida: entero >= 0',
        { seed },
      )
    }
    if (!Number.isFinite(maxEvents) || maxEvents < 1) {
      throw new EngineError(EngineErrorCodes.invalid_engine_state, 'maxEvents inválido: >= 1', {
        maxEvents,
      })
    }
    const maxTimeValido =
      (Number.isFinite(maxTime) && maxTime >= 0) || maxTime === Number.POSITIVE_INFINITY
    if (!maxTimeValido) {
      throw new EngineError(
        EngineErrorCodes.invalid_engine_state,
        'maxTime inválido: finito >= 0 o Infinity',
        { maxTime },
      )
    }
    this.seed = seed
    this.maxEvents = maxEvents
    this.maxTime = maxTime
    this.rng = createRng(seed)
  }

  /** Generador reproducible de la corrida (misma semilla ⇒ misma secuencia). */
  get generador(): Rng {
    return this.rng
  }

  /**
   * Suscribe una función al reset del motor (la usan los subsystemas como
   * el planificador de tareas para limpiar su estado). Las suscripciones son
   * configuración: se conservan entre corridas.
   */
  onReset(fn: () => void): this {
    this.alRestablecer.push(fn)
    return this
  }

  /** Tiempo simulado actual (segundos). */
  get simulationTimeSeconds(): number {
    return this.clock.seconds
  }

  /** Estado del motor. */
  get state(): EngineState {
    return this.estado
  }

  /** ¿Hay pausa solicitada? */
  get paused(): boolean {
    return this.pausado
  }

  /** Registro (historial) de la ejecución. */
  get log(): EventLog {
    return this.registro
  }

  /** Registra el handler de un código de evento (idempotente: reemplaza). */
  on<P>(code: string, handler: EventHandler<P>): this {
    if (typeof code !== 'string' || code.length === 0) {
      throw new EngineError(EngineErrorCodes.unhandled_event_code, 'código de evento vacío')
    }
    this.handlers.set(code, handler as unknown as StoredHandler)
    return this
  }

  /** ¿Existe handler registrado para el código? */
  hasHandler(code: string): boolean {
    return this.handlers.has(code)
  }

  /**
   * Programa un evento. Asigna `id` (identificador estable para cancelar) y
   * `sequence` (orden de programación). Valida tiempo, prioridad, límite de
   * tiempo del motor y existencia de handler (fallo temprano).
   */
  schedule<P>(input: ScheduleInput<P>): ScheduledEvent<P> {
    this.exigirUtilizable()
    const { time, code, priority = 50, actor, target, payload } = input
    if (typeof code !== 'string' || code.length === 0) {
      throw new EngineError(EngineErrorCodes.unhandled_event_code, 'código de evento vacío')
    }
    if (!Number.isFinite(time) || time < 0) {
      throw new EngineError(
        EngineErrorCodes.invalid_event_time,
        'tiempo de evento inválido (finito y >= 0)',
        {
          eventCode: code,
          simulationTimeSeconds: this.clock.seconds,
        },
      )
    }
    if (time < this.clock.seconds) {
      throw new EngineError(
        EngineErrorCodes.schedule_in_past,
        'no se puede programar en el pasado',
        {
          eventCode: code,
          simulationTimeSeconds: this.clock.seconds,
          tiempoSolicitado: time,
        },
      )
    }
    if (time > this.maxTime) {
      throw new EngineError(
        EngineErrorCodes.time_limit_exceeded,
        'el evento supera maxTime del motor',
        {
          eventCode: code,
          maxTime: this.maxTime,
          tiempoSolicitado: time,
        },
      )
    }
    if (!Number.isInteger(priority) || priority < 0 || priority > 100) {
      throw new EngineError(EngineErrorCodes.invalid_priority, 'prioridad debe ser entero 0..100', {
        eventCode: code,
        priority,
      })
    }
    if (!this.handlers.has(code)) {
      throw new EngineError(
        EngineErrorCodes.unhandled_event_code,
        'código sin handler registrado',
        {
          eventCode: code,
        },
      )
    }
    // El payload viaja opaco por la cola; el cast es seguro porque el dato
    // proviene del llamador tipado de `schedule<P>`.
    return this.queue.push({ time, code, priority, actor, target, payload }) as ScheduledEvent<P>
  }

  /**
   * Cancela un evento programado por id. Explícito y sin silencios: si el id
   * no existe en la cola (nunca programado o ya despachado) o ya estaba
   * cancelado, se devuelve el motivo. Las cancelaciones se registran.
   */
  cancel(eventId: number): { cancelled: boolean; reason?: 'not_found' | 'already_cancelled' } {
    const resultado = this.queue.cancel(eventId)
    if (resultado.cancelled) {
      this.registro.push({
        time: this.clock.seconds,
        code: 'engine.event_cancelled',
        eventId,
        detail: `evento ${eventId} cancelado antes de ejecutarse`,
      })
    }
    return resultado
  }

  /**
   * Despacha eventos hasta `target` (inclusive). Devuelve el resultado con
   * el estado final. Si hay pausa solicitada, se detiene antes del siguiente
   * evento y el estado pasa a `paused`.
   */
  runUntil(target: number): RunResult {
    this.exigirUtilizable()
    if (!Number.isFinite(target) || target < 0) {
      throw new EngineError(
        EngineErrorCodes.invalid_event_time,
        'objetivo de runUntil inválido (finito y >= 0)',
        {
          simulationTimeSeconds: this.clock.seconds,
          objetivo: target,
        },
      )
    }
    if (target < this.clock.seconds) {
      throw new EngineError(
        EngineErrorCodes.time_went_backwards,
        'runUntil no puede retroceder el reloj',
        {
          simulationTimeSeconds: this.clock.seconds,
          objetivo: target,
        },
      )
    }
    const fromTime = this.clock.seconds
    let procesados = 0
    this.estado = 'running'
    try {
      for (;;) {
        if (this.pausado) {
          this.estado = 'paused'
          return { status: 'paused', processed: procesados, fromTime, toTime: this.clock.seconds }
        }
        if (procesados >= this.maxEvents) {
          throw new EngineError(
            EngineErrorCodes.runaway_limit,
            'límite de eventos por corrida superado (posible loop infinito)',
            {
              simulationTimeSeconds: this.clock.seconds,
              eventosDespachados: procesados,
              maxEvents: this.maxEvents,
            },
          )
        }
        const siguiente = this.queue.peek()
        if (siguiente === null || siguiente.time > target) break
        this.despachar(this.queue.pop() as ScheduledEvent)
        procesados++
      }
      this.clock.advanceTo(target)
      this.estado = 'idle'
      return { status: 'completed', processed: procesados, fromTime, toTime: this.clock.seconds }
    } catch (error) {
      this.estado = 'error'
      throw error
    }
  }

  /**
   * Despacha exactamente el siguiente evento (control manual explícito;
   * funciona incluso en pausa). Devuelve el evento ejecutado o `null` si la
   * cola está vacía. El reloj avanza al tiempo del evento, jamás retrocede.
   */
  step(): ScheduledEvent | null {
    this.exigirUtilizable()
    const siguiente = this.queue.pop()
    if (siguiente === null) return null
    this.estado = 'running'
    try {
      this.despachar(siguiente)
      this.estado = this.pausado ? 'paused' : 'idle'
    } catch (error) {
      this.estado = 'error'
      throw error
    }
    return siguiente
  }

  /** Solicita que `runUntil` se detenga antes del siguiente evento. */
  pause(): void {
    this.pausado = true
    if (this.estado === 'idle') this.estado = 'paused'
  }

  /** Retira la solicitud de pausa (el orden de eventos no cambia). */
  resume(): void {
    this.pausado = false
    if (this.estado === 'paused') this.estado = 'idle'
  }

  /**
   * Reinicia por completo: reloj a 0, cola vacía, registro vacío, pausa
   * retirada y generador re-sembrado. Elimina tareas y reservas del run
   * anterior (vía suscripciones onReset). Conserva handlers, suscripciones
   * y semilla (configuración, no estado de corrida).
   */
  reset(): void {
    this.clock.reset()
    this.queue.clear()
    this.registro.clear()
    this.pausado = false
    this.estado = 'idle'
    this.rng.reseed(this.seed)
    for (const fn of this.alRestablecer) fn()
  }

  /** Eventos pendientes ordenados (copia de diagnóstico; no muta la cola). */
  pendingEvents(): ScheduledEvent[] {
    return this.queue.snapshot()
  }

  /** Cantidad de eventos pendientes. */
  get pendingCount(): number {
    return this.queue.size
  }

  /** Exportación serializable de la corrida (semilla + versión + historial). */
  exportHistory(): ReturnType<EventLog['export']> {
    return this.registro.export({ seed: this.seed, engineVersion: this.version })
  }

  /** Despacha un evento: reloj, registro, handler y captura de errores. */
  private despachar(event: ScheduledEvent): void {
    if (event.time < this.clock.seconds) {
      // Invariante de orden: no puede ocurrir con la cola bien ordenada;
      // se protege igualmente (defensa en profundidad, contrato sección 1).
      throw new EngineError(
        EngineErrorCodes.time_went_backwards,
        'el evento a despachar es anterior al reloj',
        {
          eventId: event.id,
          eventCode: event.code,
          simulationTimeSeconds: this.clock.seconds,
          tiempoEvento: event.time,
        },
      )
    }
    this.clock.advanceTo(event.time)
    this.registro.push({
      time: event.time,
      code: event.code,
      actor: event.actor,
      target: event.target,
      eventId: event.id,
    })
    const handler = this.handlers.get(event.code)
    if (!handler) {
      // schedule() ya valida esto; se repite en el despacho por robustez.
      throw new EngineError(
        EngineErrorCodes.unhandled_event_code,
        'código sin handler en el despacho',
        {
          eventId: event.id,
          eventCode: event.code,
        },
      )
    }
    try {
      handler(event, this)
    } catch (error) {
      const contexto = {
        eventId: event.id,
        eventCode: event.code,
        simulationTimeSeconds: this.clock.seconds,
      }
      this.registro.push({
        time: this.clock.seconds,
        code: 'engine.error',
        eventId: event.id,
        eventCode: event.code,
        detail: error instanceof Error ? error.message : String(error),
      })
      if (error instanceof EngineError) throw error
      throw new EngineError(
        EngineErrorCodes.invariant_violation,
        `el handler de '${event.code}' lanzó una excepción`,
        contexto,
      )
    }
  }

  /** El motor debe estar utilizable (no en error) para operar. */
  private exigirUtilizable(): void {
    if (this.estado === 'error') {
      throw new EngineError(
        EngineErrorCodes.invalid_engine_state,
        'el motor está en estado error: usa reset() para recuperar',
        {
          simulationTimeSeconds: this.clock.seconds,
        },
      )
    }
  }
}

/** Crea un motor con las opciones dadas (semilla 0 por defecto). */
export function createEngine(options?: EngineOptions): SimulationEngine {
  return new SimulationEngine(options)
}

export type { LogEntry }
