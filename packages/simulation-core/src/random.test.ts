import { describe, expect, it } from 'vitest'
import { createEngine } from './engine'
import { createRng } from './random'

describe('Rng — semilla reproducible (04.2)', () => {
  it('misma semilla produce la MISMA secuencia (igualdad lógica)', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 100 }, () => a.next())
    const seqB = Array.from({ length: 100 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('semillas distintas producen secuencias distintas', () => {
    const a = createRng(1)
    const b = createRng(2)
    const seqA = Array.from({ length: 20 }, () => a.next())
    const seqB = Array.from({ length: 20 }, () => b.next())
    expect(seqA).not.toEqual(seqB)
  })

  it('next() devuelve uniformes en [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 1000; i++) {
      const v = rng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('int(n) devuelve enteros en [0, n)', () => {
    const rng = createRng(99)
    for (let i = 0; i < 500; i++) {
      const v = rng.int(6)
      expect(Number.isInteger(v)).toBe(true)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(6)
    }
    expect(() => rng.int(0)).toThrow()
    expect(() => rng.int(1.5)).toThrow()
  })

  it('reseed restaura la secuencia exacta', () => {
    const rng = createRng(5)
    const primera = [rng.next(), rng.next(), rng.next()]
    rng.next() // avanzar
    rng.reseed(5)
    const segunda = [rng.next(), rng.next(), rng.next()]
    expect(segunda).toEqual(primera)
  })

  it('el motor expone su generador y lo re-siembra en reset', () => {
    const motor = createEngine({ seed: 1234 })
    const valores1 = [motor.generador.next(), motor.generador.next()]
    motor.reset()
    const valores2 = [motor.generador.next(), motor.generador.next()]
    expect(valores2).toEqual(valores1)
  })

  it('semillas pequeñas no colapsan en patrones triviales', () => {
    const rng = createRng(1)
    const valores = Array.from({ length: 10 }, () => rng.next())
    expect(new Set(valores).size).toBeGreaterThan(1)
  })
})
