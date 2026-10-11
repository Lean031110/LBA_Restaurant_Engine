import { describe, expect, it } from 'vitest'
import { createEngine } from './engine'
import { EngineError } from './errors'
import { createTaskScheduler, type TaskDefinition } from './tasks'

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

describe('TaskScheduler — registro y arranque automático (04.2)', () => {
  it('una tarea sin dependencias ni recursos arranca en el instante actual', () => {
    const { motor, scheduler } = preparar()
    const t = scheduler.registerTask(tarea({ taskId: 't1', durationSeconds: 5 }))
    expect(t.state).toBe('running')
    expect(t.startedAt).toBe(0)
    expect(motor.log.byCode('task.started')).toHaveLength(1)
    motor.runUntil(10)
    expect(scheduler.task('t1')?.state).toBe('completed')
    expect(scheduler.task('t1')?.endedAt).toBe(5)
  })

  it('durationSeconds 0: completación atómica al iniciar', () => {
    const { scheduler } = preparar()
    const t = scheduler.registerTask(tarea({ taskId: 'instantanea', durationSeconds: 0 }))
    expect(t.state).toBe('completed')
    expect(t.startedAt).toBe(0)
    expect(t.endedAt).toBe(0)
  })

  it('valida la definición: prioridad, duración, autodependencia y duplicados', () => {
    const { scheduler } = preparar()
    expect(() => scheduler.registerTask(tarea({ taskId: 'x', priority: 101 }))).toThrowError(
      EngineError,
    )
    expect(() => scheduler.registerTask(tarea({ taskId: 'x', priority: -1 }))).toThrowError(
      EngineError,
    )
    expect(() => scheduler.registerTask(tarea({ taskId: 'x', durationSeconds: -1 }))).toThrowError(
      EngineError,
    )
    expect(() => scheduler.registerTask(tarea({ taskId: 'x', dependsOn: ['x'] }))).toThrowError(
      EngineError,
    )
    scheduler.registerTask(tarea({ taskId: 'x', durationSeconds: 1 }))
    expect(() => scheduler.registerTask(tarea({ taskId: 'x' }))).toThrowError(EngineError)
  })

  it('dependencias y recursos desconocidos se rechazan al registrar (orden topológico)', () => {
    const { scheduler } = preparar()
    expect(() =>
      scheduler.registerTask(tarea({ taskId: 'a', dependsOn: ['no-existe'] })),
    ).toThrowError(EngineError)
    expect(() =>
      scheduler.registerTask(tarea({ taskId: 'a', requires: [{ resourceId: 'fantasma' }] })),
    ).toThrowError(EngineError)
  })
})

describe('TaskScheduler — dependencias (04.2)', () => {
  it('una tarea bloqueada espera a su dependencia y arranca al completarse', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 'cocinar', durationSeconds: 5, requires: [{ resourceId: 'plancha' }] }),
    )
    const servir = scheduler.registerTask(
      tarea({ taskId: 'servir', durationSeconds: 2, dependsOn: ['cocinar'] }),
    )
    expect(servir.state).toBe('blocked')
    expect(servir.blockedBy?.kind).toBe('dependency')
    expect(servir.blockedBy?.waitingOn).toEqual(['cocinar'])
    motor.runUntil(20)
    expect(scheduler.task('cocinar')?.state).toBe('completed')
    expect(scheduler.task('cocinar')?.endedAt).toBe(5)
    // servir arrancó justo cuando cocinar terminó (t=5) y duró 2s.
    expect(scheduler.task('servir')?.startedAt).toBe(5)
    expect(scheduler.task('servir')?.endedAt).toBe(7)
  })

  it('una dependencia FALLIDA falla a las dependientes con código explícito', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 'cocinar', durationSeconds: 5, requires: [{ resourceId: 'plancha' }] }),
    )
    scheduler.registerTask(tarea({ taskId: 'servir', durationSeconds: 2, dependsOn: ['cocinar'] }))
    motor.runUntil(2)
    scheduler.failTask('cocinar', 'quemada', 'la plancha se sobrecalentó')
    const servir = scheduler.task('servir')
    expect(servir?.state).toBe('failed')
    expect(servir?.failCode).toBe('dependency_failed')
    expect(motor.log.byCode('task.dependency_failed')).toHaveLength(1)
  })

  it('una dependencia CANCELADA también explicita el fallo de las dependientes', () => {
    const { scheduler } = preparar()
    scheduler.registerTask(tarea({ taskId: 'cocinar', durationSeconds: 5 }))
    scheduler.registerTask(tarea({ taskId: 'servir', durationSeconds: 2, dependsOn: ['cocinar'] }))
    scheduler.cancelTask('cocinar', 'el cliente se fue')
    expect(scheduler.task('servir')?.state).toBe('failed')
    expect(scheduler.task('servir')?.failCode).toBe('dependency_failed')
  })

  it('dependencias en cadena: cada eslabón arranca al terminar el anterior', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(tarea({ taskId: 'a', durationSeconds: 1 }))
    scheduler.registerTask(tarea({ taskId: 'b', durationSeconds: 1, dependsOn: ['a'] }))
    scheduler.registerTask(tarea({ taskId: 'c', durationSeconds: 1, dependsOn: ['b'] }))
    motor.runUntil(10)
    const c = scheduler.task('c')
    expect(c?.state).toBe('completed')
    expect([scheduler.task('a')?.endedAt, scheduler.task('b')?.endedAt, c?.endedAt]).toEqual([
      1, 2, 3,
    ])
  })
})

describe('TaskScheduler — recursos y cola explicativa (04.2)', () => {
  it('capacidad 1 ocupada: la segunda tarea queda queued con el recurso y lo disponible', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 'carne', durationSeconds: 5, requires: [{ resourceId: 'plancha' }] }),
    )
    const pan = scheduler.registerTask(
      tarea({ taskId: 'pan', durationSeconds: 2, requires: [{ resourceId: 'plancha' }] }),
    )
    expect(pan.state).toBe('queued')
    expect(pan.blockedBy?.kind).toBe('resource')
    expect(pan.blockedBy?.waitingOn).toEqual(['plancha'])
    expect(pan.blockedBy?.detail).toContain('necesita 1, disponible 0')
    motor.runUntil(20)
    // Cuando carne terminó (t=5), pan arrancó y terminó en 7.
    expect(scheduler.task('pan')?.startedAt).toBe(5)
    expect(scheduler.task('pan')?.endedAt).toBe(7)
    expect(scheduler.task('carne')?.endedAt).toBe(5)
  })

  it('la prioridad decide quién entra primero al liberarse (0 baja .. 100 alta)', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 'ocupante', durationSeconds: 3, requires: [{ resourceId: 'plancha' }] }),
    )
    scheduler.registerTask(
      tarea({
        taskId: 'baja',
        priority: 10,
        durationSeconds: 1,
        requires: [{ resourceId: 'plancha' }],
      }),
    )
    scheduler.registerTask(
      tarea({
        taskId: 'alta',
        priority: 90,
        durationSeconds: 1,
        requires: [{ resourceId: 'plancha' }],
      }),
    )
    motor.runUntil(20)
    // Ocupante termina en 3; entra 'alta' (90) antes que 'baja' (10).
    expect(scheduler.task('alta')?.startedAt).toBe(3)
    expect(scheduler.task('baja')?.startedAt).toBe(4)
  })

  it('empate de prioridad: desempate lexicográfico estable por taskId', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 'ocupante', durationSeconds: 3, requires: [{ resourceId: 'plancha' }] }),
    )
    scheduler.registerTask(
      tarea({
        taskId: 'bbb',
        priority: 50,
        durationSeconds: 1,
        requires: [{ resourceId: 'plancha' }],
      }),
    )
    scheduler.registerTask(
      tarea({
        taskId: 'aaa',
        priority: 50,
        durationSeconds: 1,
        requires: [{ resourceId: 'plancha' }],
      }),
    )
    motor.runUntil(20)
    expect(scheduler.task('aaa')?.startedAt).toBe(3)
    expect(scheduler.task('bbb')?.startedAt).toBe(4)
  })

  it('reserva multi-recurso: si falta uno, no se inicia parcialmente', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerResource({ resourceId: 'guantes', capacity: 1 })
    // Otro titular ocupa los guantes.
    scheduler.registerTask(
      tarea({ taskId: 'otro', durationSeconds: 4, requires: [{ resourceId: 'guantes' }] }),
    )
    const t = scheduler.registerTask(
      tarea({
        taskId: 'compleja',
        durationSeconds: 2,
        requires: [
          { resourceId: 'plancha' }, // libre
          { resourceId: 'guantes' }, // ocupado
        ],
      }),
    )
    expect(t.state).toBe('queued')
    expect(t.blockedBy?.waitingOn).toEqual(['guantes'])
    expect(scheduler.pool.used('plancha')).toBe(0) // nada parcial
    motor.runUntil(20)
    expect(scheduler.task('compleja')?.state).toBe('completed')
    expect(scheduler.task('compleja')?.startedAt).toBe(4) // cuando guantes quedó libre
  })
})

describe('TaskScheduler — fallo, cancelación y liberación de locks (04.2)', () => {
  it('fallar una tarea en ejecución libera TODAS sus reservas y queda registrado', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerResource({ resourceId: 'guantes', capacity: 1 })
    scheduler.registerTask(
      tarea({
        taskId: 't',
        durationSeconds: 10,
        requires: [{ resourceId: 'plancha' }, { resourceId: 'guantes' }],
      }),
    )
    expect(scheduler.pool.used('plancha')).toBe(1)
    expect(scheduler.pool.used('guantes')).toBe(1)
    motor.runUntil(3)
    scheduler.failTask('t', 'accidente', 'se cayó la sartén')
    expect(scheduler.pool.used('plancha')).toBe(0)
    expect(scheduler.pool.used('guantes')).toBe(0)
    const t = scheduler.task('t')
    expect(t?.state).toBe('failed')
    expect(t?.failCode).toBe('accidente')
    expect(t?.endedAt).toBe(3)
    expect(motor.log.byCode('resource.released')).toHaveLength(2)
    expect(motor.log.byCode('task.failed')).toHaveLength(1)
  })

  it('cancelar una tarea en ejecución libera reservas y cancela el evento de fin', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 't', durationSeconds: 10, requires: [{ resourceId: 'plancha' }] }),
    )
    motor.runUntil(2)
    scheduler.cancelTask('t', 'cambio de plan')
    expect(scheduler.pool.used('plancha')).toBe(0)
    expect(scheduler.task('t')?.state).toBe('cancelled')
    // El evento interno de fin ya no está pendiente ni en la cola del motor.
    expect(motor.pendingEvents().filter((e) => e.code === '__task.complete')).toHaveLength(0)
    motor.runUntil(50)
    expect(scheduler.task('t')?.state).toBe('cancelled') // no revive
  })

  it('completar explícitamente una tarea cancela el fin interno y no duplica', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 't', durationSeconds: 10, requires: [{ resourceId: 'plancha' }] }),
    )
    motor.runUntil(4)
    scheduler.completeTask('t', 'terminó antes de lo previsto')
    expect(scheduler.task('t')?.state).toBe('completed')
    expect(scheduler.task('t')?.endedAt).toBe(4)
    motor.runUntil(50)
    expect(motor.log.byCode('task.completed')).toHaveLength(1)
    expect(scheduler.pool.used('plancha')).toBe(0)
  })

  it('operaciones sobre tareas terminales o desconocidas son errores explícitos', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(tarea({ taskId: 't', durationSeconds: 1 }))
    motor.runUntil(5)
    expect(() => scheduler.failTask('t', 'x')).toThrowError(EngineError)
    expect(() => scheduler.cancelTask('t')).toThrowError(EngineError)
    expect(() => scheduler.completeTask('no-existe')).toThrowError(EngineError)
    expect(() => scheduler.completeTask('t')).toThrowError(EngineError) // ya completada
  })

  it('cancelar una tarea bloqueada también propaga a sus dependientes', () => {
    const { scheduler } = preparar()
    scheduler.registerTask(tarea({ taskId: 'a', durationSeconds: 10 }))
    scheduler.registerTask(tarea({ taskId: 'b', durationSeconds: 1, dependsOn: ['a'] }))
    scheduler.cancelTask('a')
    expect(scheduler.task('b')?.state).toBe('failed')
    expect(scheduler.task('b')?.failCode).toBe('dependency_failed')
  })
})

describe('TaskScheduler — reset y resumen (04.2)', () => {
  it('engine.reset limpia tareas, reservas y eventos del run anterior', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 't', durationSeconds: 5, requires: [{ resourceId: 'plancha' }] }),
    )
    motor.runUntil(3)
    expect(scheduler.pool.used('plancha')).toBe(1)
    motor.reset()
    expect(scheduler.tasks()).toEqual([])
    expect(scheduler.pool.snapshot()).toEqual([])
    expect(motor.pendingCount).toBe(0)
    expect(motor.log.size).toBe(0)
    // El planificador sigue operativo tras el reset (recursos hay que re-registrar).
    expect(() => scheduler.registerResource({ resourceId: 'plancha', capacity: 1 })).not.toThrow()
  })

  it('summary(): tareas por estado, conteo de eventos y utilización con pico', () => {
    const { motor, scheduler } = preparar()
    scheduler.registerTask(
      tarea({ taskId: 'a', durationSeconds: 2, requires: [{ resourceId: 'plancha' }] }),
    )
    scheduler.registerTask(
      tarea({ taskId: 'b', durationSeconds: 2, requires: [{ resourceId: 'plancha' }] }),
    )
    scheduler.registerTask(tarea({ taskId: 'rota', durationSeconds: 9, dependsOn: ['b'] }))
    motor.runUntil(30)
    const resumen = scheduler.summary()
    expect(resumen.tasks).toMatchObject({
      completed: 3,
      failed: 0,
      cancelled: 0,
      running: 0,
      queued: 0,
      blocked: 0,
      ready: 0,
    })
    expect(resumen.resources.plancha).toMatchObject({
      capacity: 1,
      used: 0,
      peakUsed: 1,
      totalReservations: 2,
      totalReleases: 2,
    })
    expect(resumen.events['task.started']).toBe(3)
    expect(resumen.simulationTimeSeconds).toBe(30)
  })

  it('misma configuración + misma semilla ⇒ MISMO historial lógico completo', () => {
    const correr = () => {
      const motor = createEngine({ seed: 2026 })
      const scheduler = createTaskScheduler(motor)
      scheduler.registerResource({ resourceId: 'plancha', capacity: 1 })
      scheduler.registerResource({ resourceId: 'mesas', capacity: 2 })
      // Mole: 5 tareas con distintas prioridades/duraciones compitiendo.
      scheduler.registerTask(
        tarea({
          taskId: 'carne',
          priority: 80,
          durationSeconds: 5,
          requires: [{ resourceId: 'plancha' }],
        }),
      )
      scheduler.registerTask(
        tarea({
          taskId: 'pan',
          priority: 60,
          durationSeconds: 2,
          requires: [{ resourceId: 'plancha' }],
        }),
      )
      scheduler.registerTask(
        tarea({
          taskId: 'mesa1',
          priority: 40,
          durationSeconds: 3,
          requires: [{ resourceId: 'mesas' }],
        }),
      )
      scheduler.registerTask(
        tarea({
          taskId: 'mesa2',
          priority: 70,
          durationSeconds: 1,
          requires: [{ resourceId: 'mesas' }],
        }),
      )
      scheduler.registerTask(
        tarea({ taskId: 'montar', priority: 90, durationSeconds: 2, dependsOn: ['carne', 'pan'] }),
      )
      motor.runUntil(100)
      return {
        historial: motor.exportHistory(),
        tareas: scheduler
          .tasks()
          .map((t) => ({ id: t.taskId, estado: t.state, inicio: t.startedAt, fin: t.endedAt })),
      }
    }
    const a = correr()
    const b = correr()
    expect(a.historial).toEqual(b.historial) // igualdad lógica (y de bytes al serializar)
    expect(a.tareas).toEqual(b.tareas)
    expect(JSON.stringify(a.historial)).toBe(JSON.stringify(b.historial))
  })
})
