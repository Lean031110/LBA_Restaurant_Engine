import { describe, expect, it } from 'vitest'
import { EngineError } from './errors'
import { ResourcePool } from './resources'

describe('ResourcePool — registro y validaciones (04.2)', () => {
  it('registra recursos y reporta capacidad', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'plancha', capacity: 1 })
    pool.register({ resourceId: 'mesa', capacity: 4, name: 'Mesa de trabajo' })
    expect(pool.has('plancha')).toBe(true)
    expect(pool.capacity('plancha')).toBe(1)
    expect(pool.capacity('mesa')).toBe(4)
    expect(pool.used('plancha')).toBe(0)
    expect(pool.info('mesa')?.name).toBe('Mesa de trabajo')
  })

  it('rechaza capacidades inválidas y duplicados', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'x', capacity: 1 })
    expect(() => pool.register({ resourceId: 'y', capacity: 0 })).toThrowError(EngineError)
    expect(() => pool.register({ resourceId: 'y', capacity: 1.5 })).toThrowError(EngineError)
    expect(() => pool.register({ resourceId: 'x', capacity: 2 })).toThrowError(EngineError)
    expect(() => pool.register({ resourceId: '', capacity: 1 })).toThrowError(EngineError)
  })
})

describe('ResourcePool — reserva atómica todo-o-nada (04.2)', () => {
  it('capacidad 1: dos titulares incompatibles no caben a la vez (contrato)', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'plancha', capacity: 1 })
    const r1 = pool.tryReserveAll([{ resourceId: 'plancha' }], 't1', 0)
    expect(r1.ok).toBe(true)
    const r2 = pool.tryReserveAll([{ resourceId: 'plancha' }], 't2', 1)
    expect(r2.ok).toBe(false)
    if (!r2.ok) {
      expect(r2.code).toBe('resource_unavailable')
      expect(r2.resourceId).toBe('plancha')
      expect(r2.available).toBe(0)
      expect(r2.holders).toEqual(['t1'])
    }
    expect(pool.used('plancha')).toBe(1)
  })

  it('capacidad N: admite hasta N y rechaza el exceso con detalle', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'hornos', capacity: 3 })
    expect(pool.tryReserveAll([{ resourceId: 'hornos' }], 'a', 0).ok).toBe(true)
    expect(pool.tryReserveAll([{ resourceId: 'hornos', amount: 2 }], 'b', 0).ok).toBe(true)
    const r = pool.tryReserveAll([{ resourceId: 'hornos' }], 'c', 1)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.available).toBe(0)
      expect(r.needed).toBe(1)
      expect(new Set(r.holders)).toEqual(new Set(['a', 'b']))
    }
    // Liberar uno deja sitio exacto para el que espera.
    pool.releaseAll('a')
    expect(pool.tryReserveAll([{ resourceId: 'hornos' }], 'c', 2).ok).toBe(true)
  })

  it('multi-reserva atómica: si una petición falla NO queda NADA reservado', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'a', capacity: 1 })
    pool.register({ resourceId: 'b', capacity: 1 })
    expect(pool.tryReserveAll([{ resourceId: 'a' }], 'otro', 0).ok).toBe(true)
    const r = pool.tryReserveAll(
      [
        { resourceId: 'b' }, // esta cabe…
        { resourceId: 'a' }, // …pero esta no: se revierte TODO
      ],
      't1',
      1,
    )
    expect(r.ok).toBe(false)
    expect(pool.used('a')).toBe(1) // sigue siendo 'otro'
    expect(pool.used('b')).toBe(0) // la reserva parcial se deshizo
    expect(pool.reservationsOf('t1')).toEqual([])
  })

  it('rechaza recursos desconocidos y cantidades inválidas', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'a', capacity: 2 })
    expect(() => pool.tryReserveAll([{ resourceId: 'fantasma' }], 't', 0)).toThrowError(EngineError)
    expect(() => pool.tryReserveAll([{ resourceId: 'a', amount: 0 }], 't', 0)).toThrowError(
      EngineError,
    )
    expect(() => pool.tryReserveAll([{ resourceId: 'a', amount: 1.5 }], 't', 0)).toThrowError(
      EngineError,
    )
  })

  it('acumula y supera nunca la capacidad: pico registrado', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'estaciones', capacity: 10 })
    for (let i = 0; i < 10; i++) {
      expect(pool.tryReserveAll([{ resourceId: 'estaciones' }], `t${i}`, i).ok).toBe(true)
    }
    expect(pool.used('estaciones')).toBe(10)
    expect(pool.info('estaciones')?.peakUsed).toBe(10)
    expect(pool.info('estaciones')?.totalReservations).toBe(10)
    pool.releaseAll('t3')
    expect(pool.used('estaciones')).toBe(9)
    expect(pool.info('estaciones')?.totalReleases).toBe(1)
    expect(pool.info('estaciones')?.peakUsed).toBe(10) // el pico histórico no baja
  })
})

describe('ResourcePool — liberación LIFO (04.2)', () => {
  it('releaseAll libera en orden INVERSO de adquisición y devuelve lo liberado', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'a', capacity: 1 })
    pool.register({ resourceId: 'b', capacity: 1 })
    pool.tryReserveAll([{ resourceId: 'a' }], 't1', 5)
    pool.tryReserveAll([{ resourceId: 'b' }], 't1', 7)
    const liberadas = pool.releaseAll('t1')
    expect(liberadas.map((r) => r.resourceId)).toEqual(['b', 'a']) // LIFO
    expect(pool.used('a')).toBe(0)
    expect(pool.used('b')).toBe(0)
    expect(pool.reservationsOf('t1')).toEqual([])
  })

  it('releaseAll de un titular sin reservas es un vacío (sin error)', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'a', capacity: 1 })
    expect(pool.releaseAll('nadie')).toEqual([])
  })

  it('liberar a un titular no toca las reservas de otros', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'a', capacity: 2 })
    pool.tryReserveAll([{ resourceId: 'a' }], 't1', 0)
    pool.tryReserveAll([{ resourceId: 'a' }], 't2', 0)
    pool.releaseAll('t1')
    expect(pool.holders('a')).toEqual(['t2'])
    expect(pool.used('a')).toBe(1)
  })
})

describe('ResourcePool — invariante y reset (04.2)', () => {
  it('checkInvariant pasa con uso dentro de capacidad', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'a', capacity: 2 })
    pool.tryReserveAll([{ resourceId: 'a', amount: 2 }], 't', 0)
    expect(() => pool.checkInvariant()).not.toThrow()
  })

  it('clear elimina recursos y estadísticas (reset del motor)', () => {
    const pool = new ResourcePool()
    pool.register({ resourceId: 'a', capacity: 1 })
    pool.tryReserveAll([{ resourceId: 'a' }], 't', 0)
    pool.clear()
    expect(pool.has('a')).toBe(false)
    expect(pool.snapshot()).toEqual([])
  })
})
