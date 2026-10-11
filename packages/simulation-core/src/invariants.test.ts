import { describe, expect, it } from 'vitest'
import { createEngine } from './engine'
import { EngineError, EngineErrorCodes } from './errors'
import { InvariantCodes } from './invariants'
import { createTaskScheduler, type TaskDefinition } from './tasks'
import { buildWaitsFor, findCycle, watchdog } from './watchdog'

function preparar() {
  const motor = createEngine()
  const scheduler = createTaskScheduler(motor)
  scheduler.registerResource({ resourceId: 'plancha', capacity: 1 })
  scheduler.registerResource({ resourceId: 'mesas', capacity: 2 })
  return { motor, scheduler }
}

function tarea(parcial: Partial<TaskDefinition> & { taskId: string }): TaskDefinition {
  return { priority: 50, durationSeconds: 10, ...parcial }
}

describe('checkInvariants — simulación sana (04.3)', () => {
  it('una corrida completa y compleja no produce violaciones', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({
        taskId: 'carne',
        priority: 80,
        durationSeconds: 5,
        requires: [{ resourceId: 'plancha' }],
        actor: 'chef-1',
      }),
    )
    scheduler.registerTask(
      tarea({
        taskId: 'pan',
        priority: 60,
        durationSeconds: 2,
        requires: [{ resourceId: 'plancha' }],
        actor: 'chef-2',
      }),
    )
    scheduler.registerTask(
      tarea({ taskId: 'mesa1', durationSeconds: 3, requires: [{ resourceId: 'mesas' }] }),
    )
    scheduler.registerTask(
      tarea({ taskId: 'montar', priority: 90, durationSeconds: 2, dependsOn: ['carne', 'pan'] }),
    )
    motor.runUntil(100)
    expect(scheduler.tasksByState('completed')).toHaveLength(4)
    expect(scheduler.checkInvariants()).toEqual([])
    expect(() => scheduler.assertInvariants()).not.toThrow()
  })

  it('con tareas en curso y eventos pendientes también está sano', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 'larga', durationSeconds: 50, requires: [{ resourceId: 'plancha' }] }),
    )
    scheduler.registerTask(
      tarea({ taskId: 'espera', durationSeconds: 1, requires: [{ resourceId: 'plancha' }] }),
    )
    motor.runUntil(10)
    expect(scheduler.checkInvariants()).toEqual([])
  })

  it('tras un fallo con liberación de locks, las invariantes siguen sanas', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerResource({ resourceId: 'guantes', capacity: 1 })
    scheduler.registerTask(
      tarea({
        taskId: 't',
        durationSeconds: 10,
        actor: 'ayudante',
        requires: [{ resourceId: 'plancha' }, { resourceId: 'guantes' }],
      }),
    )
    motor.runUntil(3)
    scheduler.failTask('t', 'accidente')
    expect(scheduler.checkInvariants()).toEqual([]) // terminal sin reservas
    expect(scheduler.pool.used('plancha')).toBe(0)
    expect(scheduler.pool.used('guantes')).toBe(0)
  })
})

describe('checkInvariants — detección de condiciones imposibles (04.3)', () => {
  it('tarea en ejecución cuyo evento de fin fue cancelado: violación exacta', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 'colgada', durationSeconds: 30, requires: [{ resourceId: 'plancha' }] }),
    )
    motor.runUntil(5)
    // Un consumidor del motor cancela el evento interno (p. ej. bug de UI):
    const eventoFin = motor
      .pendingEvents()
      .find((e) => e.payload && (e.payload as { taskId: string }).taskId === 'colgada')
    expect(eventoFin).toBeDefined()
    motor.cancel(eventoFin!.id)
    const violaciones = scheduler.checkInvariants()
    expect(violaciones).toHaveLength(1)
    expect(violaciones[0].code).toBe(InvariantCodes.running_without_completion_event)
    expect(violaciones[0].taskId).toBe('colgada')
    expect(violaciones[0].detail).toContain('nunca terminaría')
  })

  it('assertInvariants lanza EngineError con código invariant_violation y contexto', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(tarea({ taskId: 'colgada', durationSeconds: 30 }))
    motor.runUntil(2)
    const eventoFin = motor
      .pendingEvents()
      .find((e) => (e.payload as { taskId: string } | undefined)?.taskId === 'colgada')
    motor.cancel(eventoFin!.id)
    try {
      scheduler.assertInvariants()
      expect.unreachable('debía lanzar')
    } catch (error) {
      const e = error as EngineError
      expect(e).toBeInstanceOf(EngineError)
      expect(e.code).toBe(EngineErrorCodes.invariant_violation)
      expect(e.context.taskId).toBe('colgada')
      expect(e.context.simulationTimeSeconds).toBe(2)
    }
  })

  it('el registro documenta actor, recurso, taskId, tiempo simulado y eventCode', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({
        taskId: 'cocinar',
        durationSeconds: 4,
        actor: 'chef-1',
        requires: [{ resourceId: 'plancha' }],
      }),
    )
    motor.runUntil(10)
    const inicio = motor.log.byCode('task.started')[0]
    expect(inicio).toMatchObject({
      taskId: 'cocinar',
      actor: 'chef-1',
      time: 0,
      code: 'task.started',
    })
    const reserva = motor.log.byCode('resource.reserved')[0]
    expect(reserva).toMatchObject({
      resourceId: 'plancha',
      taskId: 'cocinar',
      actor: 'chef-1',
      time: 0,
    })
    const liberacion = motor.log.byCode('resource.released')[0]
    expect(liberacion).toMatchObject({ resourceId: 'plancha', taskId: 'cocinar', time: 4 })
    const fin = motor.log.byCode('task.completed')[0]
    expect(fin).toMatchObject({ taskId: 'cocinar', actor: 'chef-1', time: 4 })
  })
})

describe('watchdog — progreso y deadlock (04.3)', () => {
  it('ok: hay eventos pendientes (la simulación avanza sola)', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(tarea({ taskId: 'larga', durationSeconds: 30 }))
    motor.runUntil(5)
    const informe = scheduler.watchdog()
    expect(informe.status).toBe('ok')
    expect(informe.pendingEvents).toBe(1)
    expect(informe.cycle).toEqual([])
  })

  it('ok: sin eventos pendientes pero todas las tareas terminales', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(tarea({ taskId: 'corta', durationSeconds: 1 }))
    motor.runUntil(10)
    const informe = scheduler.watchdog()
    expect(informe.status).toBe('ok')
    expect(informe.pendingEvents).toBe(0)
    expect(informe.nonTerminalTasks).toBe(0)
  })

  it('stalled: sin eventos pendientes y una tarea running sin fin posible', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 'colgada', durationSeconds: 30, requires: [{ resourceId: 'plancha' }] }),
    )
    scheduler.registerTask(
      tarea({ taskId: 'detras', durationSeconds: 1, requires: [{ resourceId: 'plancha' }] }),
    )
    motor.runUntil(5)
    const eventoFin = motor
      .pendingEvents()
      .find((e) => (e.payload as { taskId: string } | undefined)?.taskId === 'colgada')
    motor.cancel(eventoFin!.id)
    const informe = watchdog(motor, scheduler)
    expect(informe.status).toBe('stalled')
    expect(informe.pendingEvents).toBe(0)
    expect(informe.nonTerminalTasks).toBe(2)
    const colgada = informe.stalls.find((s) => s.taskId === 'colgada')
    expect(colgada?.reason).toContain('sin evento de fin')
    const detras = informe.stalls.find((s) => s.taskId === 'detras')
    expect(detras?.state).toBe('queued')
    expect(detras?.waitingOn).toEqual(['plancha'])
  })

  it('buildWaitsFor: blocked espera a dependencias, queued a titulares del recurso', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(tarea({ taskId: 'base', durationSeconds: 10 }))
    scheduler.registerTask(tarea({ taskId: 'hija', durationSeconds: 1, dependsOn: ['base'] }))
    // Primero ocupa la plancha, luego llega quien compite y queda en cola.
    scheduler.registerTask(
      tarea({ taskId: 'ocupante', durationSeconds: 10, requires: [{ resourceId: 'plancha' }] }),
    )
    scheduler.registerTask(
      tarea({ taskId: 'compite', durationSeconds: 1, requires: [{ resourceId: 'plancha' }] }),
    )
    motor.runUntil(0) // sin avanzar: estados ya establecidos al registrar
    const grafo = buildWaitsFor(scheduler)
    expect(grafo.get('hija')).toEqual(['base'])
    expect(grafo.get('compite')).toEqual(['ocupante'])
    expect(grafo.has('ocupante')).toBe(false) // running no espera a nadie
  })

  it('reset limpia un stall por completo y permite una corrida nueva y sana', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 'colgada', durationSeconds: 30, requires: [{ resourceId: 'plancha' }] }),
    )
    motor.runUntil(5)
    const eventoFin = motor
      .pendingEvents()
      .find((e) => (e.payload as { taskId: string } | undefined)?.taskId === 'colgada')
    motor.cancel(eventoFin!.id)
    expect(scheduler.watchdog().status).toBe('stalled')
    // Reset limpio: elimina tareas, locks y eventos del run anterior.
    motor.reset()
    expect(scheduler.watchdog().status).toBe('ok')
    expect(scheduler.tasks()).toEqual([])
    expect(scheduler.pool.snapshot()).toEqual([])
    // El planificador sigue operativo: nueva corrida sana.
    scheduler.registerResource({ resourceId: 'plancha', capacity: 1 })
    scheduler.registerTask(
      tarea({ taskId: 'nueva', durationSeconds: 2, requires: [{ resourceId: 'plancha' }] }),
    )
    motor.runUntil(10)
    expect(scheduler.task('nueva')?.state).toBe('completed')
    expect(scheduler.checkInvariants()).toEqual([])
  })
})

describe('findCycle — detector puro de ciclos (04.3)', () => {
  it('grafo sin ciclos devuelve vacío', () => {
    const grafo = new Map<string, string[]>([
      ['a', ['b']],
      ['b', ['c']],
      ['c', []],
    ])
    expect(findCycle(grafo)).toEqual([])
  })

  it('ciclo simple a→b→a', () => {
    const grafo = new Map<string, string[]>([
      ['a', ['b']],
      ['b', ['a']],
    ])
    expect(findCycle(grafo)).toEqual(['a', 'b'])
  })

  it('autociclo a→a', () => {
    expect(findCycle(new Map([['a', ['a']]]))).toEqual(['a'])
  })

  it('ciclo largo a→b→c→a con ramas laterales sanas', () => {
    const grafo = new Map<string, string[]>([
      ['a', ['b']],
      ['b', ['c']],
      ['c', ['a']],
      ['x', ['y']],
      ['y', []],
    ])
    expect(findCycle(grafo)).toEqual(['a', 'b', 'c'])
  })

  it('grafo vacío y determinismo (recorrido lexicográfico)', () => {
    expect(findCycle(new Map())).toEqual([])
    const grafo = new Map<string, string[]>([
      ['m', ['n']],
      ['n', ['m']],
      ['b', ['c']],
      ['c', ['b']],
    ])
    // El primer ciclo en orden lexicográfico: b→c.
    expect(findCycle(grafo)).toEqual(['b', 'c'])
  })
})
