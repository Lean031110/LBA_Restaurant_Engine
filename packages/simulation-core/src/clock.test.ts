import { describe, expect, it } from 'vitest'
import { SimulationClock } from './clock'

describe('SimulationClock', () => {
  it('arranca en el tiempo inicial dado (0 por defecto)', () => {
    expect(new SimulationClock().seconds).toBe(0)
    expect(new SimulationClock(12.5).seconds).toBe(12.5)
  })

  it('avanza hacia adelante', () => {
    const reloj = new SimulationClock()
    reloj.advanceTo(5)
    expect(reloj.seconds).toBe(5)
    reloj.advanceTo(5) // avanzar al mismo instante es válido
    expect(reloj.seconds).toBe(5)
    reloj.advanceTo(10)
    expect(reloj.seconds).toBe(10)
  })

  it('JAMÁS retrocede (invariante del contrato)', () => {
    const reloj = new SimulationClock(10)
    expect(() => reloj.advanceTo(9.999)).toThrow(/no retrocede/)
    expect(reloj.seconds).toBe(10) // el valor queda intacto tras el rechazo
  })

  it('rechaza tiempos no finitos o negativos', () => {
    const reloj = new SimulationClock()
    expect(() => reloj.advanceTo(Number.NaN)).toThrow(/finito/)
    expect(() => reloj.advanceTo(-1)).toThrow(/finito/)
    expect(() => new SimulationClock(-1)).toThrow(/finito/)
    expect(() => reloj.reset(-5)).toThrow(/finito/)
  })

  it('reset devuelve el reloj al inicio indicado', () => {
    const reloj = new SimulationClock(3)
    reloj.advanceTo(100)
    reloj.reset()
    expect(reloj.seconds).toBe(0)
    reloj.reset(7)
    expect(reloj.seconds).toBe(7)
  })
})
