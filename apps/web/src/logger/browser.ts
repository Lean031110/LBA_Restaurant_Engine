/**
 * Adaptador de navegador del logger: consola + descarga local JSONL.
 * Único punto del logger que toca APIs del DOM (separado del núcleo puro).
 */
import type { LogEntry, LogLevel } from './core'

/** Mapea niveles del logger a métodos de consola (resueltos en cada llamada). */
const CONSOLE_METHOD: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
}

/** Sink hacia la consola del navegador con formato legible. */
export function consoleSink(entry: LogEntry): void {
  const prefix = `[${entry.timestampUtc}] [${entry.level.toUpperCase()}] [${entry.eventCode}] (${entry.module})`
  const method = CONSOLE_METHOD[entry.level]
  if (entry.details !== undefined) {
    console[method](prefix, entry.message, entry.details)
  } else {
    console[method](prefix, entry.message)
  }
}

/**
 * Descarga las entradas como archivo JSON Lines.
 * Nombre determinista con fecha para que el usuario archive sus diagnósticos.
 */
export function downloadJsonl(entriesJsonl: string, filenameBase = 'lba-diagnostic-log'): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${filenameBase}-${stamp}.jsonl`
  const blob = new Blob([entriesJsonl], { type: 'application/x-ndjson' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
  return filename
}
