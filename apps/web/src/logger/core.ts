/**
 * Núcleo del logger de diagnóstico — LBA_Restaurant_Engine.
 *
 * Contrato (docs/guia/03_GITHUB_ACTIONS_LOGS_EVIDENCIAS.md):
 * - niveles: debug | info | warn | error
 * - cada entrada: timestampUtc (ISO 8601 UTC), level, eventCode, module,
 *   message, traceId?, simulationTimeSeconds?, details (sanitizados)
 * - sin telemetría remota; exportable localmente por el usuario
 * - sin secretos JAMÁS: los detalles se sanitizan antes de guardarse
 *
 * Este módulo es PURO: no importa React, DOM ni ninguna API de navegador.
 * Así podrá moverse a un package compartido cuando la arquitectura lo pida.
 */

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
export type LogLevel = (typeof LOG_LEVELS)[number]

const LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

export interface LogEntry {
  /** Marca temporal UTC en ISO 8601. */
  timestampUtc: string
  level: LogLevel
  /** Código legible del evento (p. ej. APP_BOOT, SIM_START, APP_UNHANDLED_ERROR). */
  eventCode: string
  /** Módulo emisor (p. ej. "app", "logger", "simulation"). */
  module: string
  message: string
  /** Identificador de correlación opcional. */
  traceId?: string
  /** Hora simulada si el evento pertenece a una simulación (no es la hora real). */
  simulationTimeSeconds?: number
  /** Detalles sanitizados: nunca secretos. */
  details?: Record<string, unknown>
}

/** Códigos de evento definidos por el contrato de la guía. */
export const EVENT_CODES = {
  APP_BOOT: 'APP_BOOT',
  APP_ERROR_DEMO: 'APP_ERROR_DEMO',
  APP_LOG_PANEL_EXPORT: 'APP_LOG_PANEL_EXPORT',
  APP_LOG_PANEL_CLEAR: 'APP_LOG_PANEL_CLEAR',
  SCENARIO_LOAD_FAILED: 'SCENARIO_LOAD_FAILED',
  SIM_START: 'SIM_START',
  SIM_PAUSE: 'SIM_PAUSE',
  TASK_QUEUED: 'TASK_QUEUED',
  TASK_BLOCKED: 'TASK_BLOCKED',
  RESOURCE_RESERVED: 'RESOURCE_RESERVED',
  DEVICE_POWER_ON: 'DEVICE_POWER_ON',
  DEVICE_READY: 'DEVICE_READY',
  AGENT_DECISION: 'AGENT_DECISION',
  ROUTE_BLOCKED: 'ROUTE_BLOCKED',
  INVENTORY_SHORTAGE: 'INVENTORY_SHORTAGE',
  ORDER_DELAYED: 'ORDER_DELAYED',
  SIM_INVARIANT_FAILED: 'SIM_INVARIANT_FAILED',
  APP_UNHANDLED_ERROR: 'APP_UNHANDLED_ERROR',
} as const
export type KnownEventCode = (typeof EVENT_CODES)[keyof typeof EVENT_CODES]
/** Se admiten códigos nuevos (módulos futuros), pero los conocidos quedan tipados. */
export type EventCode = KnownEventCode | (string & {})

export type LogSink = (entry: LogEntry) => void

const REDACTED = '[REDACTED]'

/** Claves cuyo valor jamás se registra (secreto por nombre). */
const SENSITIVE_KEY_PATTERN =
  /(token|secret|password|passwd|authorization|apikey|api_key|credential|cookie|sessionid|session_id|privatekey|private_key)/i

/** Fragmentos de valor que delatan un secreto (tokens de GitHub, Bearer, etc.). */
const SENSITIVE_VALUE_PATTERNS: RegExp[] = [
  /\bgithub_pat_[A-Za-z0-9_]+\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
  /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/g,
  /\b(sk|pk|rk)_(live|test)_[A-Za-z0-9]{16,}\b/g,
]

/** Sanitiza un valor de texto enmascarando patrones de secretos. */
function sanitizeText(text: string): string {
  let result = text
  for (const pattern of SENSITIVE_VALUE_PATTERNS) {
    result = result.replace(pattern, REDACTED)
  }
  return result
}

/** Sanitiza una estructura arbitraria de detalles (recursivo, con ciclo de seguridad). */
export function sanitizeDetails(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (depth > 6) return '[PROFUNDIDAD_MÁXIMA]'
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return sanitizeText(value)
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'function') return '[función]'
  if (typeof value === 'bigint' || typeof value === 'symbol') return String(value)
  if (Array.isArray(value)) {
    if (seen.has(value)) return '[ciclo]'
    seen.add(value)
    return value.map((item) => sanitizeDetails(item, depth + 1, seen))
  }
  if (typeof value === 'object') {
    if (seen.has(value as object)) return '[ciclo]'
    seen.add(value as object)
    const out: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY_PATTERN.test(key) ? REDACTED : sanitizeDetails(val, depth + 1, seen)
    }
    return out
  }
  return undefined
}

export interface LoggerOptions {
  module: string
  sink: LogSink
  /** Nivel mínimo registrado (por defecto, debug). */
  minLevel?: LogLevel
  /** Generador de traceId para correlacionar entradas. */
  traceId?: string
}

export interface Logger {
  debug(eventCode: EventCode, message: string, details?: Record<string, unknown>): void
  info(eventCode: EventCode, message: string, details?: Record<string, unknown>): void
  warn(eventCode: EventCode, message: string, details?: Record<string, unknown>): void
  error(eventCode: EventCode, message: string, details?: Record<string, unknown>): void
  /** Logger derivado con el mismo módulo y un traceId fijo. */
  withTrace(traceId: string): Logger
}

/** Crea un logger dirigido a un sink. Toda entrada se sanitiza antes de emitirse. */
export function createLogger(options: LoggerOptions): Logger {
  const { module, sink, minLevel = 'debug' } = options

  const makeEmit = (traceId?: string) => {
    return (
      level: LogLevel,
      eventCode: EventCode,
      message: string,
      details?: Record<string, unknown>,
    ): void => {
      if (LEVEL_SEVERITY[level] < LEVEL_SEVERITY[minLevel]) return
      const entry: LogEntry = {
        timestampUtc: new Date().toISOString(),
        level,
        eventCode,
        module,
        message: sanitizeText(message),
      }
      if (traceId !== undefined) entry.traceId = traceId
      if (details !== undefined) entry.details = sanitizeDetails(details) as Record<string, unknown>
      sink(entry)
    }
  }

  const wire = (emit: ReturnType<typeof makeEmit>): Logger => ({
    debug: (code, msg, details) => emit('debug', code, msg, details),
    info: (code, msg, details) => emit('info', code, msg, details),
    warn: (code, msg, details) => emit('warn', code, msg, details),
    error: (code, msg, details) => emit('error', code, msg, details),
    withTrace: (newTraceId: string) => wire(makeEmit(newTraceId)),
  })

  return wire(makeEmit(options.traceId))
}

/** Convierte una lista de entradas a JSON Lines (una por línea, exportable). */
export function entriesToJsonl(entries: readonly LogEntry[]): string {
  return entries.map((entry) => JSON.stringify(entry)).join('\n')
}
