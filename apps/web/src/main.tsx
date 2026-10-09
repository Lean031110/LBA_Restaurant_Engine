/**
 * Punto de entrada de LBA_Restaurant_Engine.
 *
 * Aquí nacen las instancias únicas de la app (almacén de diagnóstico y
 * logger) y se registra APP_BOOT antes del primer render.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { EVENT_CODES, createLogger } from './logger/core'
import { createLogStore } from './logger/store'
import { consoleSink } from './logger/browser'
import './styles.css'

const container = document.getElementById('root')
if (container === null) {
  throw new Error('No se encontró el elemento #root en index.html')
}

const store = createLogStore({ maxEntries: 1000 })
const logger = createLogger({ module: 'app', sink: consoleSink })

logger.info(EVENT_CODES.APP_BOOT, 'Aplicación iniciada', {
  app: 'LBA_Restaurant_Engine',
  fase: '01 — base técnica',
})

createRoot(container).render(
  <StrictMode>
    <App store={store} logger={logger} />
  </StrictMode>,
)
