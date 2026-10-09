/**
 * Pruebas del almacén de logs (búfer circular + suscripción).
 */
import { describe, expect, it, vi } from 'vitest'
import { createLogStore } from './store'
import type { LogEntry } from './core'

function entrada(n: number): LogEntry {
  return {
    timestampUtc: new Date(Date.UTC(2026, 0, 1, 0, 0, n)).toISOString(),
    level: 'info',
    eventCode: `EVENTO_${n}`,
    module: 'test',
    message: `entrada ${n}`,
  }
}

describe('createLogStore', () => {
  it('append agrega y getAll devuelve en orden de llegada', () => {
    const store = createLogStore()
    store.append(entrada(1))
    store.append(entrada(2))

    expect(store.size()).toBe(2)
    expect(store.getAll().map((e) => e.eventCode)).toEqual(['EVENTO_1', 'EVENTO_2'])
  })

  it('getAll devuelve una instantánea inmutable: append no muta referencias previas', () => {
    const store = createLogStore()
    store.append(entrada(1))
    const instantanea = store.getAll()
    store.append(entrada(2))

    expect(instantanea).toHaveLength(1)
    expect(store.getAll()).toHaveLength(2)
  })

  it('respeta el máximo de entradas descartando la más antigua (FIFO)', () => {
    const store = createLogStore({ maxEntries: 3 })
    for (let i = 1; i <= 5; i++) store.append(entrada(i))

    expect(store.size()).toBe(3)
    expect(store.getAll().map((e) => e.eventCode)).toEqual(['EVENTO_3', 'EVENTO_4', 'EVENTO_5'])
  })

  it('clear vacía el almacén y notifica a los suscriptores', () => {
    const store = createLogStore()
    const oyente = vi.fn()
    store.subscribe(oyente)
    store.append(entrada(1))
    store.clear()

    expect(store.size()).toBe(0)
    expect(store.getAll()).toEqual([])
    expect(oyente).toHaveBeenCalledTimes(2) // 1 append + 1 clear
  })

  it('subscribe notifica en cada append y cancelar detiene las notificaciones', () => {
    const store = createLogStore()
    const oyente = vi.fn()
    const cancelar = store.subscribe(oyente)

    store.append(entrada(1))
    store.append(entrada(2))
    expect(oyente).toHaveBeenCalledTimes(2)

    cancelar()
    store.append(entrada(3))
    expect(oyente).toHaveBeenCalledTimes(2)
  })

  it('toJsonl exporta una línea por entrada', () => {
    const store = createLogStore()
    store.append(entrada(1))
    store.append(entrada(2))

    const lineas = store.toJsonl().split('\n')
    expect(lineas).toHaveLength(2)
    expect(JSON.parse(lineas[0]!).eventCode).toBe('EVENTO_1')
  })
})
