/**
 * Pruebas del límite de errores: la guía exige errores con código legible
 * y registro en el diagnóstico (APP_UNHANDLED_ERROR).
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'
import { EVENT_CODES, createLogger, type LogEntry } from '../logger/core'

function Bomba(): React.JSX.Element {
  throw new Error('explosión de prueba')
}

describe('ErrorBoundary', () => {
  it('muestra la interfaz de error con código de evento cuando un hijo lanza', () => {
    const entradas: LogEntry[] = []
    const logger = createLogger({ module: 'test', sink: (e) => entradas.push(e) })

    // Silencia el error esperado para no contaminar la salida de pruebas.
    const errorOriginal = console.error
    console.error = () => undefined
    try {
      render(
        <ErrorBoundary logger={logger}>
          <Bomba />
        </ErrorBoundary>,
      )
    } finally {
      console.error = errorOriginal
    }

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Se produjo un error inesperado')).toBeInTheDocument()
    expect(screen.getByText(EVENT_CODES.APP_UNHANDLED_ERROR)).toBeInTheDocument()
    expect(screen.getByText('explosión de prueba')).toBeInTheDocument()
  })

  it('registra APP_UNHANDLED_ERROR con nombre y pila del error', () => {
    const entradas: LogEntry[] = []
    const logger = createLogger({ module: 'test', sink: (e) => entradas.push(e) })

    const errorOriginal = console.error
    console.error = () => undefined
    try {
      render(
        <ErrorBoundary logger={logger}>
          <Bomba />
        </ErrorBoundary>,
      )
    } finally {
      console.error = errorOriginal
    }

    const entrada = entradas.find((e) => e.eventCode === EVENT_CODES.APP_UNHANDLED_ERROR)
    expect(entrada).toBeDefined()
    expect(entrada?.level).toBe('error')
    expect(entrada?.details?.errorName).toBe('Error')
    expect(String(entrada?.details?.stack)).toContain('explosión de prueba')
  })

  it('no interfiere cuando no hay errores: renderiza los hijos sin registrar nada', () => {
    const entradas: LogEntry[] = []
    const logger = createLogger({ module: 'test', sink: (e) => entradas.push(e) })
    render(
      <ErrorBoundary logger={logger}>
        <p>Todo bien por aquí</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Todo bien por aquí')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(entradas).toHaveLength(0)
  })

  it('el botón de recargar invoca window.location.reload', () => {
    const recargar = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: recargar })
    const logger = createLogger({ module: 'test', sink: () => undefined })

    const errorOriginal = console.error
    console.error = () => undefined
    try {
      render(
        <ErrorBoundary logger={logger}>
          <Bomba />
        </ErrorBoundary>,
      )
      screen.getByRole('button', { name: 'Recargar la aplicación' }).click()
    } finally {
      console.error = errorOriginal
    }

    expect(recargar).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})
