/**
 * Pruebas del panel de diagnóstico: listado, error controlado con
 * sanitización visible, exportación JSONL y limpieza.
 */
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { LogPanel } from './LogPanel'
import { EVENT_CODES, createLogger, type LogEntry } from '../logger/core'
import { createLogStore } from '../logger/store'

function montarPanel() {
  const store = createLogStore()
  const logger = createLogger({ module: 'test', sink: (e: LogEntry) => store.append(e) })
  const utils = render(<LogPanel store={store} logger={logger} />)
  return { store, logger, ...utils }
}

describe('LogPanel', () => {
  it('muestra estado vacío cuando no hay entradas y deshabilita exportar/limpiar', () => {
    montarPanel()
    expect(screen.getByText(/Sin entradas todavía/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Descargar registro/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeDisabled()
  })

  it('lista las entradas registradas con nivel, código y módulo', async () => {
    const { logger } = montarPanel()
    await act(async () => {
      logger.info(EVENT_CODES.APP_BOOT, 'Arranque')
      logger.warn(EVENT_CODES.ROUTE_BLOCKED, 'Ruta bloqueada')
    })

    expect(screen.getByText('APP_BOOT')).toBeInTheDocument()
    expect(screen.getByText('ROUTE_BLOCKED')).toBeInTheDocument()
    expect(screen.getByText(/Arranque/)).toBeInTheDocument()
    expect(screen.getByText(/Ruta bloqueada/)).toBeInTheDocument()
    // Dos entradas del mismo módulo: ambas aparecen en la lista.
    expect(screen.getAllByText('(test)')).toHaveLength(2)
  })

  it('el error controlado se registra con código APP_ERROR_DEMO y secretos sanitizados', async () => {
    const { store } = montarPanel()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Provocar error controlado' }))
    })

    const entrada = store.getAll().find((e) => e.eventCode === EVENT_CODES.APP_ERROR_DEMO)
    expect(entrada).toBeDefined()
    expect(entrada?.level).toBe('error')
    // La sanitización es verificable desde la propia UI/exportación.
    expect(entrada?.details?.fakeGithubToken).toBe('[REDACTED]')
    expect(entrada?.details?.fakePassword).toBe('[REDACTED]')
    expect((entrada?.details?.nested as Record<string, unknown>).apiKey).toBe('[REDACTED]')
    expect((entrada?.details?.nested as Record<string, unknown>).kept).toBe('valor visible')
    expect(screen.getByText('APP_ERROR_DEMO')).toBeInTheDocument()
  })

  it('exporta el registro como descarga y registra el evento de exportación', async () => {
    const urlGlobal = URL as unknown as Record<string, unknown>
    const crearOriginal = urlGlobal.createObjectURL
    const revocarOriginal = urlGlobal.revokeObjectURL
    const crearUrl = vi.fn((_blob: Blob) => 'blob:lba-test')
    const revocarUrl = vi.fn()
    urlGlobal.createObjectURL = crearUrl
    urlGlobal.revokeObjectURL = revocarUrl

    try {
      const { store } = montarPanel()
      await act(async () => {
        store.append({
          timestampUtc: '2026-10-09T12:00:00.000Z',
          level: 'info',
          eventCode: 'APP_BOOT',
          module: 'app',
          message: 'Arranque',
        })
      })

      const boton = screen.getByRole('button', { name: /Descargar registro/ })
      expect(boton).toBeEnabled()
      await act(async () => {
        fireEvent.click(boton)
      })

      expect(crearUrl).toHaveBeenCalledTimes(1)
      const evento = store.getAll().find((e) => e.eventCode === EVENT_CODES.APP_LOG_PANEL_EXPORT)
      expect(evento).toBeDefined()
      expect(evento?.details?.entries).toBe(1)
    } finally {
      urlGlobal.createObjectURL = crearOriginal
      urlGlobal.revokeObjectURL = revocarOriginal
    }
  })

  it('limpiar vacía el registro y registra el evento de limpieza', async () => {
    const { store, logger } = montarPanel()
    await act(async () => {
      logger.info(EVENT_CODES.APP_BOOT, 'Arranque')
    })
    expect(store.size()).toBeGreaterThan(0)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Limpiar' }))
    })

    // Las entradas anteriores desaparecen; el propio evento de limpieza queda
    // registrado y visible en el panel (comportamiento esperado y honesto).
    expect(screen.queryByText('APP_BOOT')).not.toBeInTheDocument()
    expect(screen.getByText('APP_LOG_PANEL_CLEAR')).toBeInTheDocument()
    const limpieza = store.getAll().find((e) => e.eventCode === EVENT_CODES.APP_LOG_PANEL_CLEAR)
    expect(limpieza).toBeDefined()
  })
})
