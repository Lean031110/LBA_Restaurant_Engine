/**
 * LBA_Restaurant_Engine — pantalla base (FASE 01).
 *
 * Layout minimalista de la guía (regla 15): controles de simulación arriba,
 * barra de herramientas izquierda, lienzo central, inspector a la derecha y
 * eventos/estadísticas abajo. Los paneles de fases futuras son marcadores
 * deshabilitados con explicación.
 */
import { useState } from 'react'
import type { Logger } from './logger/core'
import type { LogStore } from './logger/store'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LogPanel } from './components/LogPanel'
import { PlaceholderPanel } from './components/PlaceholderPanel'

/** Controles de simulación previstos (se activan en la fase 04). */
const SIM_CONTROLS = [
  { label: 'Iniciar', phase: 'fase 04 (motor de simulación)' },
  { label: 'Pausar', phase: 'fase 04 (motor de simulación)' },
  { label: 'Paso a paso', phase: 'fase 04 (motor de simulación)' },
  { label: 'Reiniciar', phase: 'fase 04 (motor de simulación)' },
  { label: 'Velocidad 1x', phase: 'fase 04 (motor de simulación)' },
] as const

interface AppProps {
  store: LogStore
  logger: Logger
}

export function App({ store, logger }: AppProps): React.JSX.Element {
  const [showLogs, setShowLogs] = useState(false)

  return (
    <ErrorBoundary logger={logger}>
      <div className="app">
        <header className="app__header">
          <h1 className="app__title">LBA_Restaurant_Engine</h1>
          <span className="app__subtitle">Simulador de operaciones de restaurante</span>
          <div className="app__sim-controls" aria-label="Controles de simulación">
            {SIM_CONTROLS.map((control) => (
              <button
                key={control.label}
                type="button"
                disabled
                title={`Se activa en la ${control.phase}`}
              >
                {control.label}
              </button>
            ))}
          </div>
        </header>

        <div className="app__main">
          <aside className="app__toolbar" aria-label="Barra de herramientas">
            <PlaceholderPanel
              title="Herramientas"
              description="Dibujo de paredes, puertas, ventanas, mesas, sillas y equipos del catálogo."
              phase="fase 03 (editor 2D)"
            />
          </aside>

          <main className="app__canvas" aria-label="Lienzo 2D">
            <PlaceholderPanel
              title="Lienzo 2D"
              description="Aquí se dibujará y editará el plano del restaurante con ajuste a cuadrícula."
              phase="fase 03 (editor 2D)"
            />
          </main>

          <aside className="app__inspector" aria-label="Inspector de propiedades">
            <PlaceholderPanel
              title="Inspector"
              description="Propiedades del objeto seleccionado: dimensiones, rotación, zona y parámetros."
              phase="fase 03 (editor 2D)"
            />
          </aside>
        </div>

        <footer className="app__footer">
          {showLogs ? (
            <LogPanel store={store} logger={logger} />
          ) : (
            <PlaceholderPanel
              title="Eventos y estadísticas"
              description="Historial de eventos de simulación, métricas de colas, utilización y cuellos de botella."
              phase="fase 09 (métricas y experimentos)"
            />
          )}
          <button
            type="button"
            className="app__log-toggle"
            aria-expanded={showLogs}
            onClick={() => setShowLogs((current) => !current)}
          >
            {showLogs ? 'Ver eventos y estadísticas' : 'Diagnóstico (logs)'}
          </button>
        </footer>
      </div>
    </ErrorBoundary>
  )
}
