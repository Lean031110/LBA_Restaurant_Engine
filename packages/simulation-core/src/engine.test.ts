import { describe, expect, it } from 'vitest'
import { createEngine } from './engine'
import { EngineError, EngineErrorCodes } from './errors'

describe('SimulationEngine — programación y validaciones (04.1)', () => {
  it('programa y ejecuta eventos: tiempos EXACTOS 5, 10 y 60 segundos', () => {
    const motor = createEngine()
    const tiempos: number[] = []
    motor.on('tick', (e) => {
      tiempos.push(e.time)
    })
    motor.schedule({ time: 60, code: 'tick' })
    motor.schedule({ time: 5, code: 'tick' })
    motor.schedule({ time: 10, code: 'tick' })
    const resultado = motor.runUntil(100)
    expect(tiempos).toEqual([5, 10, 60])
    expect(resultado.status).toBe('completed')
    expect(resultado.processed).toBe(3)
    expect(resultado.toTime).toBe(100)
    expect(motor.simulationTimeSeconds).toBe(100)
  })

  it('un handler puede programar otros eventos (incluido en el mismo instante)', () => {
    const motor = createEngine()
    const orden: string[] = []
    motor.on('z', (e) => orden.push(`z@${e.time}`))
    motor.on('a', (e) => {
      orden.push(`a@${e.time}`)
      motor.schedule({ time: e.time, code: 'b' }) // mismo instante: después de los ya programados
      motor.schedule({ time: e.time + 1, code: 'c' })
    })
    motor.on('b', (e) => orden.push(`b@${e.time}`))
    motor.on('c', (e) => orden.push(`c@${e.time}`))
    motor.schedule({ time: 1, code: 'a' })
    motor.schedule({ time: 1, code: 'z' })
    motor.runUntil(10)
    // En t=1: a (seq 1), z (seq 2), b (seq 3, programado durante a) y luego c en t=2.
    expect(orden).toEqual(['a@1', 'z@1', 'b@1', 'c@2'])
  })

  it('rechaza programar en el pasado (schedule_in_past)', () => {
    const motor = createEngine()
    motor.on('x', () => undefined)
    motor.runUntil(10)
    expect(() => motor.schedule({ time: 9, code: 'x' })).toThrowError(EngineError)
    try {
      motor.schedule({ time: 9, code: 'x' })
    } catch (error) {
      expect((error as EngineError).code).toBe(EngineErrorCodes.schedule_in_past)
    }
  })

  it('programar en el instante actual es válido (se despacha a continuación)', () => {
    const motor = createEngine()
    motor.on('x', () => undefined)
    motor.runUntil(10)
    motor.schedule({ time: 10, code: 'x' })
    const r = motor.runUntil(10)
    expect(r.processed).toBe(1)
  })

  it('rechaza tiempos inválidos y prioridades fuera de 0..100', () => {
    const motor = createEngine()
    motor.on('x', () => undefined)
    expect(() => motor.schedule({ time: -1, code: 'x' })).toThrowError(EngineError)
    expect(() => motor.schedule({ time: Number.NaN, code: 'x' })).toThrowError(EngineError)
    expect(() => motor.schedule({ time: 1, code: 'x', priority: -1 })).toThrowError(EngineError)
    expect(() => motor.schedule({ time: 1, code: 'x', priority: 101 })).toThrowError(EngineError)
    expect(() => motor.schedule({ time: 1, code: 'x', priority: 50.5 })).toThrowError(EngineError)
  })

  it('rechaza programar un código sin handler (fallo temprano, nunca silencioso)', () => {
    const motor = createEngine()
    try {
      motor.schedule({ time: 1, code: 'inexistente' })
      expect.unreachable('debía lanzar')
    } catch (error) {
      expect((error as EngineError).code).toBe(EngineErrorCodes.unhandled_event_code)
    }
  })

  it('respeta maxTime del motor', () => {
    const motor = createEngine({ maxTime: 100 })
    motor.on('x', () => undefined)
    motor.schedule({ time: 100, code: 'x' }) // exactamente el límite: válido
    expect(() => motor.schedule({ time: 100.01, code: 'x' })).toThrowError(EngineError)
  })
})

describe('SimulationEngine — runUntil / step / pausa / reset (04.1)', () => {
  function motorConEventos() {
    const motor = createEngine()
    const vistos: string[] = []
    for (const code of ['e5', 'e10', 'e60']) motor.on(code, () => vistos.push(code))
    motor.schedule({ time: 5, code: 'e5' })
    motor.schedule({ time: 10, code: 'e10' })
    motor.schedule({ time: 60, code: 'e60' })
    return { motor, vistos }
  }

  it('runUntil parcial: solo procesa los eventos hasta el objetivo', () => {
    const { motor, vistos } = motorConEventos()
    const r = motor.runUntil(7)
    expect(vistos).toEqual(['e5'])
    expect(r.processed).toBe(1)
    expect(motor.simulationTimeSeconds).toBe(7)
    expect(motor.pendingCount).toBe(2)
    motor.runUntil(100)
    expect(vistos).toEqual(['e5', 'e10', 'e60'])
  })

  it('step ejecuta exactamente un evento y avanza el reloj a su tiempo', () => {
    const { motor, vistos } = motorConEventos()
    expect(motor.step()?.code).toBe('e5')
    expect(vistos).toEqual(['e5'])
    expect(motor.simulationTimeSeconds).toBe(5)
    expect(motor.step()?.code).toBe('e10')
    expect(motor.step()?.code).toBe('e60')
    expect(motor.step()).toBeNull()
  })

  it('runUntil rechaza retroceder el reloj (time_went_backwards)', () => {
    const { motor } = motorConEventos()
    motor.runUntil(50)
    try {
      motor.runUntil(49)
      expect.unreachable('debía lanzar')
    } catch (error) {
      expect((error as EngineError).code).toBe(EngineErrorCodes.time_went_backwards)
    }
  })

  it('pausa: runUntil se detiene antes del siguiente evento y resume continúa igual', () => {
    const { motor, vistos } = motorConEventos()
    motor.pause()
    const r1 = motor.runUntil(100)
    expect(r1.status).toBe('paused')
    expect(r1.processed).toBe(0)
    expect(motor.state).toBe('paused')
    motor.resume()
    motor.runUntil(7)
    expect(vistos).toEqual(['e5'])
    motor.pause()
    const r2 = motor.runUntil(100)
    expect(r2.status).toBe('paused')
    expect(vistos).toEqual(['e5'])
    motor.resume()
    const r3 = motor.runUntil(100)
    expect(r3.status).toBe('completed')
    expect(vistos).toEqual(['e5', 'e10', 'e60'])
  })

  it('un handler puede pedir pausa: el evento en curso termina y la corrida se detiene', () => {
    const motor = createEngine()
    const orden: string[] = []
    motor.on('a', () => {
      orden.push('a')
      motor.pause()
    })
    motor.on('b', () => orden.push('b'))
    motor.schedule({ time: 1, code: 'a' })
    motor.schedule({ time: 2, code: 'b' })
    const r = motor.runUntil(10)
    expect(orden).toEqual(['a'])
    expect(r.status).toBe('paused')
    expect(motor.simulationTimeSeconds).toBe(1)
    motor.resume()
    motor.runUntil(10)
    expect(orden).toEqual(['a', 'b'])
  })

  it('pausa + pasos + reanudar produce el MISMO orden que una corrida continua', () => {
    // La regla matemática: el troceo no altera resultados (contrato sección 1).
    const construir = () => {
      const motor = createEngine()
      const registro: string[] = []
      const codes = ['a', 'b', 'c', 'd']
      for (const c of codes) motor.on(c, (e) => registro.push(`${c}@${e.time}`))
      motor.schedule({ time: 1, code: 'b' })
      motor.schedule({ time: 1, code: 'a', priority: 80 })
      motor.schedule({ time: 3, code: 'd' })
      motor.schedule({ time: 2, code: 'c' })
      return { motor, registro }
    }
    const continua = construir()
    continua.motor.runUntil(10)
    const troceada = construir()
    troceada.motor.pause()
    troceada.motor.runUntil(10)
    troceada.motor.step()
    troceada.motor.step()
    troceada.motor.resume()
    troceada.motor.runUntil(10)
    expect(troceada.registro).toEqual(continua.registro)
    expect(continua.registro).toEqual(['a@1', 'b@1', 'c@2', 'd@3'])
  })

  it('reset devuelve todo al estado inicial y se puede re-ejecutar idéntico', () => {
    const { motor, vistos } = motorConEventos()
    motor.runUntil(100)
    expect(vistos).toEqual(['e5', 'e10', 'e60'])
    motor.reset()
    expect(motor.simulationTimeSeconds).toBe(0)
    expect(motor.pendingCount).toBe(0)
    expect(motor.log.size).toBe(0)
    expect(motor.state).toBe('idle')
    // Re-programar y re-ejecutar tras reset: mismo resultado.
    motor.schedule({ time: 5, code: 'e5' })
    motor.schedule({ time: 10, code: 'e10' })
    motor.schedule({ time: 60, code: 'e60' })
    motor.runUntil(100)
    expect(vistos).toEqual(['e5', 'e10', 'e60', 'e5', 'e10', 'e60'])
  })

  it('reset conserva handlers y semilla (configuración, no estado de corrida)', () => {
    const motor = createEngine({ seed: 42 })
    motor.on('x', () => undefined)
    motor.reset()
    expect(motor.hasHandler('x')).toBe(true)
    expect(motor.seed).toBe(42)
    expect(motor.version).toBe('0.1.0')
  })
})

describe('SimulationEngine — cancelación y registro (04.1)', () => {
  it('cancel impide la ejecución y queda registrado en el historial', () => {
    const motor = createEngine()
    let ejecutado = 0
    motor.on('x', () => ejecutado++)
    motor.on('y', () => (ejecutado += 10))
    const x = motor.schedule({ time: 5, code: 'x' })
    motor.schedule({ time: 6, code: 'y' })
    expect(motor.cancel(x.id)).toEqual({ cancelled: true })
    expect(motor.cancel(x.id)).toEqual({ cancelled: false, reason: 'already_cancelled' })
    expect(motor.cancel(12345)).toEqual({ cancelled: false, reason: 'not_found' })
    motor.runUntil(10)
    expect(ejecutado).toBe(10)
    const cancelaciones = motor.log.byCode('engine.event_cancelled')
    expect(cancelaciones).toHaveLength(1)
    expect(cancelaciones[0].eventId).toBe(x.id)
  })

  it('el registro documenta cada evento ejecutado con tiempo y secuencia monótona', () => {
    const motor = createEngine()
    motor.on('a', () => undefined)
    motor.on('b', () => undefined)
    motor.schedule({ time: 2, code: 'b' })
    motor.schedule({ time: 1, code: 'a' })
    motor.runUntil(5)
    const entradas = motor.log.entries()
    expect(entradas.map((e) => [e.code, e.time])).toEqual([
      ['a', 1],
      ['b', 2],
    ])
    expect(entradas[0].sequence).toBe(0)
    expect(entradas[1].sequence).toBe(1)
    expect(motor.log.counts()).toEqual({ a: 1, b: 1 })
  })

  it('exportHistory incluye versión del motor, semilla e historial completo', () => {
    const motor = createEngine({ seed: 7 })
    motor.on('a', () => undefined)
    motor.schedule({ time: 1, code: 'a' })
    motor.runUntil(2)
    const exportado = motor.exportHistory()
    expect(exportado.engineVersion).toBe('0.1.0')
    expect(exportado.seed).toBe(7)
    expect(exportado.totalEvents).toBe(1)
    expect(exportado.events[0]).toMatchObject({ code: 'a', time: 1 })
    expect(JSON.parse(JSON.stringify(exportado))).toEqual(exportado) // serializable
  })
})

describe('SimulationEngine — errores, runaway y recuperación (04.1)', () => {
  it('un handler que lanza: aborta, registra engine.error y deja el motor en error', () => {
    const motor = createEngine()
    motor.on('boom', () => {
      throw new Error('fallo del dominio')
    })
    motor.on('despues', () => undefined)
    motor.schedule({ time: 1, code: 'boom' })
    motor.schedule({ time: 2, code: 'despues' })
    expect(() => motor.runUntil(10)).toThrowError(EngineError)
    expect(motor.state).toBe('error')
    expect(motor.log.byCode('engine.error')).toHaveLength(1)
    // En estado error, ninguna operación sigue (nada silencioso).
    expect(() => motor.schedule({ time: 3, code: 'despues' })).toThrowError(EngineError)
    expect(() => motor.runUntil(10)).toThrowError(EngineError)
    expect(() => motor.step()).toThrowError(EngineError)
    // reset recupera el motor.
    motor.reset()
    expect(motor.state).toBe('idle')
  })

  it('runaway_limit: un evento que se reprograma en el mismo instante se corta', () => {
    const motor = createEngine({ maxEvents: 50 })
    motor.on('bucle', (e) => {
      motor.schedule({ time: e.time, code: 'bucle' })
    })
    motor.schedule({ time: 0, code: 'bucle' })
    try {
      motor.runUntil(10)
      expect.unreachable('debía lanzar runaway_limit')
    } catch (error) {
      expect((error as EngineError).code).toBe(EngineErrorCodes.runaway_limit)
    }
    expect(motor.state).toBe('error')
    expect(motor.log.byCode('bucle').length).toBe(50)
  })

  it('un bucle que AVANZA el tiempo se corta por maxTime o por el objetivo de runUntil', () => {
    const motor = createEngine({ maxTime: 1000 })
    let vueltas = 0
    motor.on('tic', (e) => {
      vueltas++
      motor.schedule({ time: e.time + 1, code: 'tic' })
    })
    motor.schedule({ time: 0, code: 'tic' })
    const r = motor.runUntil(500) // se detiene al llegar al objetivo: quedan eventos pendientes
    expect(r.status).toBe('completed')
    expect(r.processed).toBe(501) // t=0..500 inclusive
    expect(motor.pendingCount).toBe(1) // el de t=501 sigue en la cola
    expect(vueltas).toBe(501)
  })

  it('opciones inválidas del motor se rechazan al crear', () => {
    expect(() => createEngine({ seed: -1 })).toThrowError(EngineError)
    expect(() => createEngine({ seed: 1.5 })).toThrowError(EngineError)
    expect(() => createEngine({ maxEvents: 0 })).toThrowError(EngineError)
    expect(() => createEngine({ maxTime: -1 })).toThrowError(EngineError)
  })
})
