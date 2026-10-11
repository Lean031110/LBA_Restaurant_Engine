import { describe, expect, it } from 'vitest'
import { compareEvents, EventQueue, type ScheduledEvent } from './queue'

function ev(
  parcial: Partial<ScheduledEvent> & { time: number },
): Omit<ScheduledEvent, 'id' | 'sequence'> {
  return { code: 'x', priority: 50, ...parcial }
}

describe('EventQueue — orden estable (time, priority, sequence)', () => {
  it('ordena por tiempo ascendente con tiempos exactos', () => {
    const cola = new EventQueue()
    cola.push(ev({ time: 60 }))
    cola.push(ev({ time: 5 }))
    cola.push(ev({ time: 10 }))
    expect([cola.pop()?.time, cola.pop()?.time, cola.pop()?.time]).toEqual([5, 10, 60])
  })

  it('en el empate de tiempo gana la prioridad MAYOR (100 = máxima urgencia)', () => {
    const cola = new EventQueue()
    cola.push(ev({ time: 1, priority: 10 }))
    cola.push(ev({ time: 1, priority: 90 }))
    cola.push(ev({ time: 1, priority: 50 }))
    expect([cola.pop()?.priority, cola.pop()?.priority, cola.pop()?.priority]).toEqual([90, 50, 10])
  })

  it('en el empate de (time, priority) gana el sequence menor (orden de programación)', () => {
    const cola = new EventQueue()
    const a = cola.push(ev({ time: 2, priority: 50, code: 'primero-programado' }))
    const b = cola.push(ev({ time: 2, priority: 50, code: 'segundo-programado' }))
    expect(a.sequence).toBeLessThan(b.sequence)
    expect(cola.pop()?.code).toBe('primero-programado')
    expect(cola.pop()?.code).toBe('segundo-programado')
  })

  it('el tiempo domina sobre la prioridad (un evento urgente después no se adelanta)', () => {
    const cola = new EventQueue()
    cola.push(ev({ time: 10, priority: 100 }))
    cola.push(ev({ time: 5, priority: 0 }))
    expect(cola.pop()?.time).toBe(5)
  })

  it('los ids son estables y crecientes (no dependen de la posición)', () => {
    const cola = new EventQueue()
    const a = cola.push(ev({ time: 3 }))
    const b = cola.push(ev({ time: 1 }))
    expect(b.id).toBeGreaterThan(a.id)
    expect(a.id).toBeGreaterThan(0)
  })

  it('peek no extrae; pop sí', () => {
    const cola = new EventQueue()
    cola.push(ev({ time: 1, code: 'unico' }))
    expect(cola.peek()?.code).toBe('unico')
    expect(cola.size).toBe(1)
    expect(cola.pop()?.code).toBe('unico')
    expect(cola.size).toBe(0)
    expect(cola.peek()).toBeNull()
    expect(cola.pop()).toBeNull()
  })

  it('la cola vacía devuelve null en pop/peek', () => {
    const cola = new EventQueue()
    expect(cola.pop()).toBeNull()
    expect(cola.peek()).toBeNull()
    expect(cola.size).toBe(0)
  })
})

describe('EventQueue — cancelación explícita', () => {
  it('cancela un evento vivo: no se entrega y baja el tamaño', () => {
    const cola = new EventQueue()
    const a = cola.push(ev({ time: 1, code: 'quedarse' }))
    const b = cola.push(ev({ time: 2, code: 'cancelarse' }))
    expect(cola.cancel(b.id)).toEqual({ cancelled: true })
    expect(cola.size).toBe(1)
    expect(cola.pop()?.code).toBe('quedarse')
    expect(cola.pop()).toBeNull()
    expect(a.id).toBeGreaterThan(0)
  })

  it('cancelar dos veces reporta already_cancelled', () => {
    const cola = new EventQueue()
    const a = cola.push(ev({ time: 1 }))
    cola.cancel(a.id)
    expect(cola.cancel(a.id)).toEqual({ cancelled: false, reason: 'already_cancelled' })
  })

  it('cancelar un id inexistente reporta not_found (nunca silencioso)', () => {
    const cola = new EventQueue()
    expect(cola.cancel(999)).toEqual({ cancelled: false, reason: 'not_found' })
  })

  it('un evento ya extraído ya no se puede cancelar', () => {
    const cola = new EventQueue()
    const a = cola.push(ev({ time: 1 }))
    cola.pop()
    expect(cola.cancel(a.id)).toEqual({ cancelled: false, reason: 'not_found' })
  })

  it('clear vacía todo (reset)', () => {
    const cola = new EventQueue()
    cola.push(ev({ time: 1 }))
    cola.push(ev({ time: 2 }))
    cola.clear()
    expect(cola.size).toBe(0)
    expect(cola.pop()).toBeNull()
  })

  it('snapshot devuelve los vivos ordenados sin mutar la cola', () => {
    const cola = new EventQueue()
    cola.push(ev({ time: 30 }))
    cola.push(ev({ time: 10 }))
    const b = cola.push(ev({ time: 20 }))
    cola.cancel(b.id)
    const foto = cola.snapshot()
    expect(foto.map((e) => e.time)).toEqual([10, 30])
    expect(cola.size).toBe(2)
  })
})

describe('compareEvents', () => {
  it('es un comparador consistente con la tupla documentada', () => {
    const base = { id: 1, sequence: 0, code: 'x' }
    expect(
      compareEvents({ ...base, time: 1, priority: 50 }, { ...base, time: 2, priority: 100 }),
    ).toBeLessThan(0)
    expect(
      compareEvents({ ...base, time: 1, priority: 100 }, { ...base, time: 1, priority: 50 }),
    ).toBeLessThan(0)
    expect(
      compareEvents(
        { ...base, time: 1, priority: 50, sequence: 1 },
        { ...base, time: 1, priority: 50, sequence: 2 },
      ),
    ).toBeLessThan(0)
    expect(
      compareEvents(
        { ...base, time: 1, priority: 50, sequence: 1 },
        { ...base, time: 1, priority: 50, sequence: 1 },
      ),
    ).toBe(0)
  })
})
