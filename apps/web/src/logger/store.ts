/**
 * Almacén en memoria de entradas de log — búfer circular con suscripción.
 *
 * La UI se suscribe con useSyncExternalStore; las pruebas pueden usarlo sin
 * navegador. No forma parte del motor de simulación: el historial de eventos
 * simulados será un sistema separado (regla de la guía).
 */
import { entriesToJsonl, type LogEntry } from './core'

export interface LogStore {
  append(entry: LogEntry): void
  getAll(): readonly LogEntry[]
  clear(): void
  size(): number
  toJsonl(): string
  subscribe(listener: () => void): () => void
}

export interface LogStoreOptions {
  /** Máximo de entradas retenidas (FIFO). Por defecto 1000. */
  maxEntries?: number
}

export function createLogStore(options: LogStoreOptions = {}): LogStore {
  const maxEntries = options.maxEntries ?? 1000
  let entries: LogEntry[] = []
  const listeners = new Set<() => void>()

  const notify = (): void => {
    for (const listener of listeners) listener()
  }

  return {
    append(entry) {
      entries = entries.length >= maxEntries ? [...entries.slice(1), entry] : [...entries, entry]
      notify()
    },
    getAll() {
      return entries
    },
    clear() {
      entries = []
      notify()
    },
    size() {
      return entries.length
    },
    toJsonl() {
      return entriesToJsonl(entries)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
