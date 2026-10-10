import { describe, expect, it } from 'vitest'
import type { Scenario } from '@lba/domain'
import { validateReferences } from './references'
import { loadScenarioJson } from './json'
import validCompleteText from '../../../scenarios/fixtures/valid-complete.json?raw'

/**
 * Pruebas de integridad referencial cruzada (8 enlaces + ciclos). Los casos
 * rotos se construyen sobre el fixture completo válido mutando copias
 * (validateReferences es puro: recibe Scenario ya validado).
 */

/** Copia profunda sin DOM (JSON round trip) con reparseo del texto. */
function baseScenario(): Scenario {
  const loaded = loadScenarioJson(validCompleteText)
  if (!loaded.ok) {
    throw new Error(`fixture completo debería cargar: ${loaded.issues[0]?.message}`)
  }
  return JSON.parse(JSON.stringify(loaded.data)) as Scenario
}

function pathsOf(issues: { path: string }[]): string[] {
  return issues.map((i) => i.path)
}

describe('validateReferences — fixture completo válido', () => {
  it('no reporta ningún issue', () => {
    const scenario = baseScenario()
    expect(validateReferences(scenario)).toEqual([])
  })
})

describe('validateReferences — enlaces rotos con ruta exacta', () => {
  it('objects[*].zoneId → zones', () => {
    const scenario = baseScenario()
    ;(scenario as { objects: { zoneId?: string }[] }).objects[1]!.zoneId = 'zone_rota'
    const issues = validateReferences(scenario)
    expect(pathsOf(issues)).toContain('objects[1].zoneId')
    expect(issues.find((i) => i.path === 'objects[1].zoneId')?.message).toContain(
      'no existe en zones',
    )
  })

  it('agents[*].homeZoneId → zones', () => {
    const scenario = baseScenario()
    ;(scenario as { agents: { homeZoneId?: string }[] }).agents[0]!.homeZoneId = 'zone_rota'
    const issues = validateReferences(scenario)
    expect(pathsOf(issues)).toContain('agents[0].homeZoneId')
    expect(issues.find((i) => i.path === 'agents[0].homeZoneId')?.message).toContain(
      'no existe en zones',
    )
  })

  it('orders[*].items[*].recipeId → recipes', () => {
    const scenario = baseScenario()
    ;(scenario as { orders: { items: { recipeId: string }[] }[] }).orders[0]!.items[0]!.recipeId =
      'recipe_rota'
    const issues = validateReferences(scenario)
    expect(pathsOf(issues)).toContain('orders[0].items[0].recipeId')
  })

  it('taskTemplates[*].steps[*].requiresEquipmentId → equipment', () => {
    const scenario = baseScenario()
    ;(
      scenario as { taskTemplates: { steps: { requiresEquipmentId?: string }[] }[] }
    ).taskTemplates[0]!.steps[1]!.requiresEquipmentId = 'eq_rota'
    const issues = validateReferences(scenario)
    expect(pathsOf(issues)).toContain('taskTemplates[0].steps[1].requiresEquipmentId')
    expect(
      issues.find((i) => i.path === 'taskTemplates[0].steps[1].requiresEquipmentId')?.message,
    ).toContain('no existe en equipment')
  })

  it('taskTemplates[*].fallbackTaskId → taskTemplates', () => {
    const scenario = baseScenario()
    ;(
      scenario as { taskTemplates: { fallbackTaskId?: string }[] }
    ).taskTemplates[0]!.fallbackTaskId = 'task_rota'
    const issues = validateReferences(scenario)
    expect(pathsOf(issues)).toContain('taskTemplates[0].fallbackTaskId')
    expect(issues.find((i) => i.path === 'taskTemplates[0].fallbackTaskId')?.message).toContain(
      'no existe en taskTemplates',
    )
  })

  it('recipes[*].components[*].inventoryItemId → inventory', () => {
    const scenario = baseScenario()
    ;(
      scenario as { recipes: { components: { inventoryItemId: string }[] }[] }
    ).recipes[0]!.components[0]!.inventoryItemId = 'inv_rota'
    const issues = validateReferences(scenario)
    expect(pathsOf(issues)).toContain('recipes[0].components[0].inventoryItemId')
  })

  it('inventory[*].locationWorldObjectId → objects', () => {
    const scenario = baseScenario()
    ;(
      scenario as { inventory: { locationWorldObjectId?: string }[] }
    ).inventory[0]!.locationWorldObjectId = 'obj_rota'
    const issues = validateReferences(scenario)
    expect(pathsOf(issues)).toContain('inventory[0].locationWorldObjectId')
  })

  it('dependencia inexistente → taskTemplates', () => {
    const scenario = baseScenario()
    ;(
      scenario as unknown as { taskTemplates: { dependencies: string[] }[] }
    ).taskTemplates[0]!.dependencies = ['task_inexistente']
    const issues = validateReferences(scenario)
    expect(pathsOf(issues)).toContain('taskTemplates[0].dependencies[0]')
    expect(issues.find((i) => i.path === 'taskTemplates[0].dependencies[0]')?.message).toContain(
      'no existe en taskTemplates',
    )
  })
})

describe('validateReferences — dependencias circulares', () => {
  it('autodependencia: rechazada con ruta exacta', () => {
    const scenario = baseScenario()
    ;(
      scenario as unknown as { taskTemplates: { dependencies: string[] }[] }
    ).taskTemplates[0]!.dependencies = ['task_preparar-pizza']
    const issues = validateReferences(scenario)
    expect(pathsOf(issues)).toContain('taskTemplates[0].dependencies[0]')
    expect(issues.find((i) => i.path === 'taskTemplates[0].dependencies[0]')?.message).toContain(
      'propia plantilla',
    )
  })

  it('ciclo de dos plantillas: detectado y reportado con la cadena', () => {
    const scenario = baseScenario()
    const templates = scenario as unknown as { taskTemplates: { dependencies: string[] }[] }
    templates.taskTemplates[0]!.dependencies = ['task_reponer-inventario']
    templates.taskTemplates[1]!.dependencies = ['task_preparar-pizza']
    const issues = validateReferences(scenario)
    const cycleIssue = issues.find((i) => i.message.includes('ciclo de dependencias'))
    expect(cycleIssue).toBeDefined()
    expect(cycleIssue?.message).toContain('task_preparar-pizza → task_reponer-inventario')
  })

  it('las dependencias legítimas no generan issues', () => {
    const scenario = baseScenario()
    const templates = scenario as unknown as { taskTemplates: { dependencies: string[] }[] }
    templates.taskTemplates[1]!.dependencies = ['task_preparar-pizza']
    expect(validateReferences(scenario)).toEqual([])
  })
})
