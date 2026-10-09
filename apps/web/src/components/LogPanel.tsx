/**
 * Panel de diagnóstico: historial del logger de la aplicación.
 *
 * Muestra las entradas (nivel, código, módulo, mensaje), permite descargar el
 * registro en JSONL, limpiarlo y provocar un error controlado de prueba para
 * verificar la sanitización (FASE 01, prompt D).
 */
import { useSyncExternalStore } from 'react'
import { EVENT_CODES, type Logger } from '../logger/core'
import type { LogStore } from '../logger/store'
import { downloadJsonl } from '../logger/browser'

interface LogPanelProps {
  store: LogStore
  logger: Logger
}

export function LogPanel({ store, logger }: LogPanelProps): React.JSX.Element {
  const entries = useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getAll(),
  )

  const handleExport = (): void => {
    const filename = downloadJsonl(store.toJsonl())
    logger.info(
      EVENT_CODES.APP_LOG_PANEL_EXPORT,
      `Registro de diagnóstico exportado: ${filename}`,
      {
        entries: store.size(),
      },
    )
  }

  const handleClear = (): void => {
    store.clear()
    logger.info(EVENT_CODES.APP_LOG_PANEL_CLEAR, 'Registro de diagnóstico limpiado por el usuario')
  }

  const handleControlledError = (): void => {
    // Error controlado de prueba: verifica código de evento + sanitización.
    logger.error(EVENT_CODES.APP_ERROR_DEMO, 'Error controlado de prueba (sin impacto real)', {
      description:
        'Entrada de diagnóstico generada por el botón de prueba. Los secretos deben aparecer como [REDACTED].',
      fakeGithubToken: ['github', 'pat_11DEMO', 'NO_REAL_0000000000000000'].join('_'),
      fakePassword: 'super-secreto-de-prueba',
      nested: { apiKey: 'clave-de-prueba', kept: 'valor visible' },
    })
  }

  return (
    <section className="log-panel" aria-label="Panel de diagnóstico">
      <div className="log-panel__toolbar">
        <span className="log-panel__title">
          Diagnóstico de la aplicación ({entries.length} entradas)
        </span>
        <div className="log-panel__actions">
          <button type="button" onClick={handleControlledError}>
            Provocar error controlado
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={entries.length === 0}
            title={entries.length === 0 ? 'No hay entradas que exportar todavía' : undefined}
          >
            Descargar registro (JSONL)
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={entries.length === 0}
            title={entries.length === 0 ? 'No hay entradas que limpiar todavía' : undefined}
          >
            Limpiar
          </button>
        </div>
      </div>
      <ul className="log-panel__list" role="log">
        {entries.length === 0 ? (
          <li className="log-panel__empty">
            Sin entradas todavía. Los eventos de la aplicación aparecerán aquí.
          </li>
        ) : (
          entries.map((entry) => (
            <li
              key={`${entry.timestampUtc}-${entry.eventCode}-${entry.module}`}
              className={`log-entry log-entry--${entry.level}`}
            >
              <span className="log-entry__time">{entry.timestampUtc}</span>
              <span className="log-entry__level">{entry.level.toUpperCase()}</span>
              <span className="log-entry__code">{entry.eventCode}</span>
              <span className="log-entry__module">({entry.module})</span>
              <span className="log-entry__message">{entry.message}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
