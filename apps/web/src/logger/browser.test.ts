/**
 * Pruebas del adaptador de navegador: sink de consola y descarga JSONL.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { consoleSink, downloadJsonl } from './browser'
import type { LogEntry } from './core'

describe('consoleSink', () => {
  it('escribe en el método de consola según el nivel', () => {
    const spies = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => undefined),
      info: vi.spyOn(console, 'info').mockImplementation(() => undefined),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
      error: vi.spyOn(console, 'error').mockImplementation(() => undefined),
    }
    const base: Omit<LogEntry, 'level'> = {
      timestampUtc: '2026-10-09T00:00:00.000Z',
      eventCode: 'APP_BOOT',
      module: 'app',
      message: 'hola',
    }

    consoleSink({ ...base, level: 'debug' })
    consoleSink({ ...base, level: 'info' })
    consoleSink({ ...base, level: 'warn' })
    consoleSink({ ...base, level: 'error' })

    expect(spies.debug).toHaveBeenCalledTimes(1)
    expect(spies.info).toHaveBeenCalledTimes(1)
    expect(spies.warn).toHaveBeenCalledTimes(1)
    expect(spies.error).toHaveBeenCalledTimes(1)
    // El formato incluye código de evento y módulo.
    expect(spies.info.mock.calls[0]![0]).toContain('[APP_BOOT] (app)')
  })

  it('pasa los detalles como segundo argumento cuando existen', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    consoleSink({
      timestampUtc: '2026-10-09T00:00:00.000Z',
      level: 'info',
      eventCode: 'X',
      module: 'm',
      message: 'con detalles',
      details: { clave: 'valor' },
    })
    expect(spy.mock.calls[0]![2]).toEqual({ clave: 'valor' })
  })
})

describe('downloadJsonl', () => {
  const crearUrl = vi.fn((_blob: Blob) => 'blob:lba-test')
  const revocarUrl = vi.fn()

  afterEach(() => {
    vi.restoreAllMocks()
    crearUrl.mockClear()
    revocarUrl.mockClear()
  })

  it('crea un blob JSONL, dispara la descarga y devuelve el nombre de archivo', async () => {
    const urlGlobal = URL as unknown as Record<string, unknown>
    const crearOriginal = urlGlobal.createObjectURL
    const revocarOriginal = urlGlobal.revokeObjectURL
    urlGlobal.createObjectURL = crearUrl
    urlGlobal.revokeObjectURL = revocarUrl

    try {
      const nombre = downloadJsonl('{"level":"info"}\n{"level":"error"}\n')

      expect(crearUrl).toHaveBeenCalledTimes(1)
      expect(revocarUrl).toHaveBeenCalledWith('blob:lba-test')
      expect(nombre).toMatch(/^lba-diagnostic-log-\d{4}-\d{2}-\d{2}T.*\.jsonl$/)

      const blob = crearUrl.mock.calls[0]![0] as Blob
      await expect(blob.text()).resolves.toBe('{"level":"info"}\n{"level":"error"}\n')
    } finally {
      urlGlobal.createObjectURL = crearOriginal
      urlGlobal.revokeObjectURL = revocarOriginal
    }
  })
})
