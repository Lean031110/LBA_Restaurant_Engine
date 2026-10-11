import { describe, expect, it } from 'vitest'
import validCompleteText from '../../../scenarios/fixtures/valid-complete.json?raw'
import { loadScenarioJson } from '@lba/persistence'
import {
  createEngine,
  createTaskScheduler,
  type SimulationEngine,
  type TaskDefinition,
  type TaskScheduler,
} from '@lba/simulation-core'

/**
 * Integración FASE 04 (prompt 04.4): el motor de simulación ejecuta en Node
 * un grafo de tareas construido desde un ESCENARIO REAL del dominio (el
 * fixture válido del repositorio, cargado por @lba/persistence), con los
 * equipos como recursos de capacidad declarada y los agentes como recursos
 * de capacidad 1 (una tarea a la vez). Se exige: todas las tareas
 * completadas, invariantes del contrato en verde, watchdog en ok y
 * determinismo (misma semilla del escenario ⇒ mismo historial).
 */

function cargarEscenario() {
  const carga = loadScenarioJson(validCompleteText)
  if (!carga.ok) {
    throw new Error(`el fixture válido no cargó: ${JSON.stringify(carga.issues.slice(0, 3))}`)
  }
  return carga.data
}

function correrEscenario(): {
  scenario: ReturnType<typeof cargarEscenario>
  motor: SimulationEngine
  scheduler: TaskScheduler
  total: number
} {
  const scenario = cargarEscenario()
  const motor = createEngine({ seed: scenario.seed })
  const scheduler = createTaskScheduler(motor)

  // Recursos: equipos con su capacidad declarada y agentes con capacidad 1.
  for (const equipo of scenario.equipment) {
    scheduler.registerResource({ resourceId: equipo.id, capacity: equipo.capacity })
  }
  for (const agente of scenario.agents) {
    scheduler.registerResource({ resourceId: agente.id, capacity: 1 })
  }

  // Tareas: por cada ítem de cada pedido, la cadena de pasos de su receta,
  // serializada por el cocinero (recurso capacidad 1) y con los recursos
  // que cada paso declara.
  const cocinero = scenario.agents.find((a) => a.role === 'cook') ?? scenario.agents[0]
  let total = 0
  for (const pedido of scenario.orders) {
    let anterior: string | undefined
    for (const item of pedido.items) {
      const receta = scenario.recipes.find((r) => r.id === item.recipeId)
      if (receta === undefined) {
        throw new Error(`receta no encontrada en el escenario: ${item.recipeId}`)
      }
      receta.steps.forEach((paso, indice) => {
        const taskId = `task_${pedido.id}-${item.recipeId.replace('recipe_', '')}-${indice}`
        const requiere = [...paso.requiredResourceIds, cocinero.id].map((resourceId) => ({
          resourceId,
        }))
        scheduler.registerTask({
          taskId,
          name: `${receta.name}: ${paso.name}`,
          priority: pedido.priority === 'urgent' ? 90 : 50,
          ...(anterior !== undefined ? { dependsOn: [anterior] } : {}),
          requires: requiere,
          durationSeconds: paso.durationSeconds?.value ?? 0,
          actor: cocinero.id,
        } satisfies TaskDefinition)
        anterior = taskId
        total++
      })
    }
  }
  motor.runUntil(1_000_000)
  return { scenario, motor, scheduler, total }
}

describe('Integración dominio ⇆ motor de simulación (FASE 04)', () => {
  it('el fixture válido carga por @lba/persistence y contiene el material de la simulación', () => {
    const scenario = cargarEscenario()
    expect(scenario.equipment.length).toBeGreaterThan(0)
    expect(scenario.agents.length).toBeGreaterThan(0)
    expect(scenario.orders.length).toBeGreaterThan(0)
    expect(scenario.recipes.length).toBeGreaterThan(0)
    expect(scenario.seed).toBeGreaterThan(0)
  })

  it('todas las tareas del escenario completan con invariantes en verde y watchdog ok', () => {
    const { scheduler, total } = correrEscenario()
    expect(total).toBeGreaterThan(0)
    expect(scheduler.tasksByState('completed')).toHaveLength(total)
    expect(scheduler.tasksByState('running')).toHaveLength(0)
    expect(scheduler.tasksByState('queued')).toHaveLength(0)
    expect(scheduler.tasksByState('blocked')).toHaveLength(0)
    expect(scheduler.checkInvariants()).toEqual([])
    expect(scheduler.watchdog().status).toBe('ok')
    // Los recursos quedan liberados (contrato: liberación correcta).
    for (const info of scheduler.pool.snapshot()) {
      expect(info.used).toBe(0)
      expect(info.totalReservations).toBe(info.totalReleases)
    }
  })

  it('misma semilla del escenario ⇒ MISMO historial lógico y mismos tiempos', () => {
    const a = correrEscenario()
    const b = correrEscenario()
    const historialA = a.motor.exportHistory()
    const historialB = b.motor.exportHistory()
    expect(historialA).toEqual(historialB)
    expect(JSON.stringify(historialA)).toBe(JSON.stringify(historialB))
    expect(a.scheduler.tasks().map((t) => [t.taskId, t.state, t.startedAt, t.endedAt])).toEqual(
      b.scheduler.tasks().map((t) => [t.taskId, t.state, t.startedAt, t.endedAt]),
    )
    // El registro documenta el flujo completo con los códigos del motor.
    const conteo = historialA.events.reduce<Record<string, number>>((acc, e) => {
      acc[e.code] = (acc[e.code] ?? 0) + 1
      return acc
    }, {})
    expect(conteo['task.registered']).toBe(a.total)
    expect(conteo['task.started']).toBe(a.total)
    expect(conteo['task.completed']).toBe(a.total)
    expect(conteo['resource.reserved']).toBeGreaterThan(0)
    expect(conteo['resource.released']).toBe(conteo['resource.reserved'])
  })

  it('la exportación del historial es serializable y trazable por tarea', () => {
    const { motor, scheduler } = correrEscenario()
    const exportado = motor.exportHistory()
    expect(() => JSON.stringify(exportado)).not.toThrow()
    expect(exportado.engineVersion).toBe('0.1.0')
    expect(exportado.seed).toBeGreaterThan(0)
    const unaTarea = scheduler.tasks()[0]
    const rastro = exportado.events.filter((e) => e.taskId === unaTarea.taskId)
    expect(rastro.length).toBeGreaterThanOrEqual(3) // registered → started → completed
    expect(rastro[0].code).toBe('task.registered')
  })
})
