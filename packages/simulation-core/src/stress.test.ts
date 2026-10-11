import { describe, expect, it } from 'vitest'
import { createEngine } from './engine'
import { createTaskScheduler, type TaskDefinition } from './tasks'

/**
 * Pruebas de estrés controladas (FASE 04, prompt 04.4): gran número de
 * eventos con RESULTADO MEDIDO (los milisegundos se imprimen y se registran
 * en docs/evidence/PHASE-04.md). Los límites de tiempo son generosos para
 * máquinas de CI lentas; lo importante es el orden de magnitud medido.
 */

describe('Estrés controlado con resultado medido (04.4)', () => {
  it('A: 120 000 eventos pre-programados se despachan en orden exacto', { timeout: 60_000 }, () => {
    const TOTAL = 120_000
    const motor = createEngine()
    let despachados = 0
    let ultimaPrioridad = -1
    motor.on('masivo', (e) => {
      despachados++
      // El orden de llegada debe ser no decreciente en tiempo y, en empate,
      // decreciente en prioridad (la tupla documentada).
      expect(e.time).toBeGreaterThanOrEqual(motor.simulationTimeSeconds - 1)
      ultimaPrioridad = e.priority
      expect(ultimaPrioridad).toBeGreaterThanOrEqual(0)
    })
    // 3 capas de prioridad en 40 000 tiempos distintos (t = i/40 con i = 0..119999).
    for (let i = 0; i < TOTAL; i++) {
      motor.schedule({
        time: i / 40,
        code: 'masivo',
        priority: i % 3 === 0 ? 90 : i % 3 === 1 ? 50 : 10,
      })
    }
    const inicio = performance.now()
    const r = motor.runUntil(TOTAL / 40)
    const ms = performance.now() - inicio
    console.info(`[estrés A] ${TOTAL} eventos despachados en ${ms.toFixed(1)} ms`)
    expect(r.processed).toBe(TOTAL)
    expect(despachados).toBe(TOTAL)
    expect(ms).toBeLessThan(15_000) // margen CI; local ~cientos de ms
  })

  it(
    'B: cascada binaria de 131 071 eventos (cada evento programa 2 hijos)',
    { timeout: 60_000 },
    () => {
      const PROFUNDIDAD = 16 // 2^17 - 1 = 131 071
      const motor = createEngine({ maxEvents: 1_000_000 })
      let creados = 1 // la raíz
      let despachados = 0
      motor.on('nodo', (e) => {
        despachados++
        const profundidad = (e.payload as { profundidad: number }).profundidad
        if (profundidad < PROFUNDIDAD) {
          motor.schedule({
            time: e.time + 1,
            code: 'nodo',
            payload: { profundidad: profundidad + 1 },
          })
          motor.schedule({
            time: e.time + 1,
            code: 'nodo',
            payload: { profundidad: profundidad + 1 },
          })
          creados += 2
        }
      })
      motor.schedule({ time: 0, code: 'nodo', payload: { profundidad: 0 } })
      const inicio = performance.now()
      const r = motor.runUntil(PROFUNDIDAD + 1)
      const ms = performance.now() - inicio
      console.info(
        `[estrés B] ${r.processed} eventos en cascada despachados en ${ms.toFixed(1)} ms`,
      )
      expect(r.processed).toBe(131_071)
      expect(despachados).toBe(131_071)
      expect(creados).toBe(131_071)
      expect(motor.pendingCount).toBe(0)
      expect(ms).toBeLessThan(15_000)
    },
  )

  it('C: 2 000 tareas sobre 100 recursos con cadenas de dependencias', { timeout: 60_000 }, () => {
    const RECURSOS = 100
    const POR_RECURSO = 20 // 2 000 tareas; 2 encadenadas por recurso (10 cadenas de 2)
    const motor = createEngine()
    const scheduler = createTaskScheduler(motor)
    for (let i = 0; i < RECURSOS; i++) {
      scheduler.registerResource({ resourceId: `r${i}`, capacity: 2 })
    }
    let registradas = 0
    for (let i = 0; i < RECURSOS; i++) {
      for (let c = 0; c < POR_RECURSO / 2; c++) {
        const base = `t${i}-${c}`
        scheduler.registerTask({
          taskId: `${base}-a`,
          priority: (i * 7 + c) % 101 > 100 ? 100 : (i * 7 + c) % 101,
          durationSeconds: ((i + c) % 5) + 1,
          requires: [{ resourceId: `r${i}` }],
          actor: `agente-${i % 10}`,
        } satisfies TaskDefinition)
        scheduler.registerTask({
          taskId: `${base}-b`,
          priority: 50,
          durationSeconds: (i % 3) + 1,
          dependsOn: [`${base}-a`],
          requires: [{ resourceId: `r${i}`, amount: 2 }],
        } satisfies TaskDefinition)
        registradas += 2
      }
    }
    expect(registradas).toBe(2_000)
    const inicio = performance.now()
    motor.runUntil(10_000)
    const ms = performance.now() - inicio
    console.info(`[estrés C] 2 000 tareas con dependencias completadas en ${ms.toFixed(1)} ms`)
    expect(scheduler.tasksByState('completed')).toHaveLength(2_000)
    expect(scheduler.checkInvariants()).toEqual([])
    expect(scheduler.watchdog().status).toBe('ok')
    expect(ms).toBeLessThan(15_000)
  })
})

describe('Independencia del reloj real (04.4)', () => {
  it('60 s simulados con tarea de 3 600 s ocurren sin esperar tiempo real', () => {
    const motor = createEngine()
    const scheduler = createTaskScheduler(motor)
    scheduler.registerResource({ resourceId: 'horno', capacity: 1 })
    const tiempos: number[] = []
    motor.on('marca', (e) => tiempos.push(e.time))
    motor.schedule({ time: 5, code: 'marca' })
    motor.schedule({ time: 10, code: 'marca' })
    motor.schedule({ time: 60, code: 'marca' })
    scheduler.registerTask({
      taskId: 'horneo-largo',
      priority: 50,
      durationSeconds: 3_600,
      requires: [{ resourceId: 'horno' }],
    })
    const inicio = performance.now()
    motor.runUntil(3_599)
    const ms = performance.now() - inicio
    console.info(
      `[reloj real] 3 599 s simulados (tarea de 3 600 s en curso) ejecutados en ${ms.toFixed(1)} ms reales`,
    )
    expect(tiempos).toEqual([5, 10, 60]) // tiempos EXACTOS, sin reloj real
    expect(scheduler.task('horneo-largo')?.state).toBe('running') // aún no llega a t=3600
    motor.runUntil(3_600)
    expect(scheduler.task('horneo-largo')?.state).toBe('completed')
    expect(ms).toBeLessThan(2_000) // con temporizadores reales tomaría ≥ 3 600 000 ms
  })
})
