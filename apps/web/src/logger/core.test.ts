/**
 * Pruebas del núcleo del logger (módulo puro, sin navegador).
 * Contrato: docs/guia/03_GITHUB_ACTIONS_LOGS_EVIDENCIAS.md
 */
import { describe, expect, it, vi } from 'vitest'
import { EVENT_CODES, createLogger, entriesToJsonl, sanitizeDetails, type LogEntry } from './core'

describe('createLogger', () => {
  it('emite una entrada con nivel, eventCode, módulo, mensaje y timestamp UTC ISO', () => {
    const sink = vi.fn()
    const logger = createLogger({ module: 'prueba', sink })

    logger.info(EVENT_CODES.SIM_START, 'Simulación iniciada')

    expect(sink).toHaveBeenCalledTimes(1)
    const entry = sink.mock.calls[0]![0] as LogEntry
    expect(entry.level).toBe('info')
    expect(entry.eventCode).toBe('SIM_START')
    expect(entry.module).toBe('prueba')
    expect(entry.message).toBe('Simulación iniciada')
    // ISO 8601 con Z (UTC)
    expect(entry.timestampUtc).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/)
  })

  it('respeta el nivel mínimo: por debajo no se emite', () => {
    const sink = vi.fn()
    const logger = createLogger({ module: 'prueba', sink, minLevel: 'warn' })

    logger.debug('DBG', 'no debe emitirse')
    logger.info('INF', 'tampoco')
    logger.warn('WRN', 'sí')
    logger.error('ERR', 'sí')

    expect(sink).toHaveBeenCalledTimes(2)
    expect((sink.mock.calls[0]![0] as LogEntry).level).toBe('warn')
    expect((sink.mock.calls[1]![0] as LogEntry).level).toBe('error')
  })

  it('propaga el traceId a todas las entradas del logger derivado', () => {
    const sink = vi.fn()
    const logger = createLogger({ module: 'sim', sink }).withTrace('trace-42')

    logger.info('A', 'uno')
    logger.error('B', 'dos')

    for (const call of sink.mock.calls) {
      expect((call[0] as LogEntry).traceId).toBe('trace-42')
    }
  })

  it('sanitiza claves sensibles en details aunque el valor sea inofensivo', () => {
    const sink = vi.fn()
    const logger = createLogger({ module: 'app', sink })

    logger.info('X', 'msg', { token: 'abc', Password: 'abc', visible: 'ok' })

    const entry = sink.mock.calls[0]![0] as LogEntry
    expect(entry.details).toEqual({ token: '[REDACTED]', Password: '[REDACTED]', visible: 'ok' })
  })

  it('sanitiza patrones de secretos dentro de valores de texto', () => {
    const sink = vi.fn()
    const logger = createLogger({ module: 'app', sink })

    // Token FICTICIO con la misma forma que uno real para probar la regex.
    // Regla de la guía: jamás se suben tokens reales, ni siquiera en pruebas.
    const tokenFicticio = ['github', 'pat_11FICTICIO', 'AaBbCcDdEeFf00112233445566778899'].join('_')

    logger.warn('Y', `alguien pegó ${tokenFicticio} en un mensaje`)
    logger.error('Z', 'error', {
      auth: 'Bearer abcdefghijklmnopqrstuvwxyz123456',
      nota: 'valor sin secreto',
    })

    const [first, second] = sink.mock.calls as unknown as [[LogEntry], [LogEntry]]
    expect(first[0].message).not.toContain(tokenFicticio)
    expect(first[0].message).toContain('[REDACTED]')
    expect(second[0].details).toEqual({ auth: '[REDACTED]', nota: 'valor sin secreto' })
  })

  it('sanitiza recursivamente y detecta ciclos sin colgarse', () => {
    const sink = vi.fn()
    const logger = createLogger({ module: 'app', sink })

    const ciclico: Record<string, unknown> = {
      apiKey: 'k',
      texto: ['github', 'pat_11EJEMPLO', '000000'].join('_'),
    }
    ciclico.self = ciclico

    logger.debug('W', 'detalles anidados', { anidado: { profundo: ciclico } })

    const entry = sink.mock.calls[0]![0] as LogEntry
    const detalles = entry.details as { anidado: { profundo: Record<string, unknown> } }
    expect(detalles.anidado.profundo.apiKey).toBe('[REDACTED]')
    expect(detalles.anidado.profundo.texto).toBe('[REDACTED]')
    expect(detalles.anidado.profundo.self).toBe('[ciclo]')
  })
})

describe('sanitizeDetails', () => {
  it('conserva números, booleanos y null tal cual', () => {
    expect(sanitizeDetails({ a: 1, b: true, c: null, d: 'texto' })).toEqual({
      a: 1,
      b: true,
      c: null,
      d: 'texto',
    })
  })

  it('convierte funciones y símbolos en marcadores', () => {
    const resultado = sanitizeDetails({ fn: () => 1, sym: Symbol('x') }) as Record<string, unknown>
    expect(resultado.fn).toBe('[función]')
    expect(typeof resultado.sym).toBe('string')
  })
})

describe('entriesToJsonl', () => {
  it('produce una línea JSON válida por entrada', () => {
    const sink = vi.fn()
    const logger = createLogger({ module: 'm', sink })
    logger.info('A', 'primera')
    logger.error('B', 'segunda')

    const jsonl = entriesToJsonl(sink.mock.calls.map((call) => call[0] as LogEntry))
    const lineas = jsonl.split('\n')
    expect(lineas).toHaveLength(2)
    expect(JSON.parse(lineas[0]!)).toMatchObject({ level: 'info', eventCode: 'A' })
    expect(JSON.parse(lineas[1]!)).toMatchObject({ level: 'error', eventCode: 'B' })
  })

  it('con lista vacía devuelve cadena vacía', () => {
    expect(entriesToJsonl([])).toBe('')
  })
})
