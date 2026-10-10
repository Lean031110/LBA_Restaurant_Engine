import type { Scenario, ValidationIssue } from '@lba/domain'

/**
 * Integridad referencial cruzada al importar (mandato del dominio, scenario.ts:
 * «La integridad referencial cruzada […] se valida al importar (prompt 02.3)»).
 *
 * Enlaces verificados (todos los IDs tipados del contrato):
 *
 * 1. objects[*].zoneId → zones[*].id
 * 2. agents[*].homeZoneId → zones[*].id
 * 3. orders[*].items[*].recipeId → recipes[*].id
 * 4. taskTemplates[*].steps[*].requiresEquipmentId → equipment[*].id
 * 5. taskTemplates[*].dependencies[*] → taskTemplates[*].id (existencia,
 *    no autodependencia y ausencia de ciclos)
 * 6. taskTemplates[*].fallbackTaskId → taskTemplates[*].id (existencia; la
 *    desigualdad consigo misma ya la impone el dominio)
 * 7. recipes[*].components[*].inventoryItemId → inventory[*].id
 * 8. inventory[*].locationWorldObjectId → objects[*].id
 *
 * NO se validan aquí (texto libre hasta FASE 06, por contrato): los
 * `requiredResourceIds` de plantillas, recetas y pasos de receta
 * («IDs de equipos/zonas como texto; FASE 06 los tipa»). Verificarlos hoy
 * sería inventar una regla que el contrato posterga expresamente.
 *
 * Todas las funciones son puras: nunca mutan el escenario validado.
 */

function issue(path: string, message: string): ValidationIssue {
  return { path, code: 'broken_reference', message }
}

/** Detecta ciclos en el grafo de dependencias de plantillas de tarea. */
function findDependencyCycles(
  templates: Scenario['taskTemplates'],
  onCycle: (cycle: string[], atPath: string) => void,
): void {
  // DFS con colores: 0 = sin visitar, 1 = en curso, 2 = terminado.
  const state = new Map<string, number>()
  const stack: string[] = []

  function visit(templateIndex: number): void {
    const template = templates[templateIndex]
    if (template === undefined) return
    const current = state.get(template.id) ?? 0
    if (current === 1) {
      // Back-edge: el ciclo es la parte de la pila desde esta plantilla.
      const start = stack.indexOf(template.id)
      const cycle = [...stack.slice(start), template.id]
      const fromPath = `taskTemplates[${templateIndex}]`
      onCycle(cycle, `${fromPath}.dependencies`)
      return
    }
    if (current === 2) return

    state.set(template.id, 1)
    stack.push(template.id)
    template.dependencies.forEach((dependencyId) => {
      const dependencyIndex = templates.findIndex((t) => t.id === dependencyId)
      if (dependencyIndex >= 0) {
        visit(dependencyIndex)
      }
    })
    stack.pop()
    state.set(template.id, 2)
  }

  templates.forEach((_, index) => visit(index))
}

/**
 * Valida los enlaces cruzados y los ciclos de dependencias de un escenario
 * ya validado por esquema. Devuelve una lista de issues con rutas exactas.
 */
export function validateReferences(scenario: Scenario): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  const zoneIds = new Set(scenario.zones.map((z) => z.id))
  const recipeIds = new Set(scenario.recipes.map((r) => r.id))
  const equipmentIds = new Set(scenario.equipment.map((e) => e.id))
  const inventoryIds = new Set(scenario.inventory.map((i) => i.id))
  const objectIds = new Set(scenario.objects.map((o) => o.id))
  const taskIds = new Set(scenario.taskTemplates.map((t) => t.id))

  // 1. objects[*].zoneId → zones
  scenario.objects.forEach((object, index) => {
    if (object.zoneId !== undefined && !zoneIds.has(object.zoneId)) {
      issues.push(
        issue(
          `objects[${index}].zoneId`,
          `zoneId "${object.zoneId}" no existe en zones (referencia rota al importar)`,
        ),
      )
    }
  })

  // 2. agents[*].homeZoneId → zones
  scenario.agents.forEach((agent, index) => {
    if (agent.homeZoneId !== undefined && !zoneIds.has(agent.homeZoneId)) {
      issues.push(
        issue(
          `agents[${index}].homeZoneId`,
          `homeZoneId "${agent.homeZoneId}" no existe en zones (referencia rota al importar)`,
        ),
      )
    }
  })

  // 3. orders[*].items[*].recipeId → recipes
  scenario.orders.forEach((order, orderIndex) => {
    order.items.forEach((item, itemIndex) => {
      if (!recipeIds.has(item.recipeId)) {
        issues.push(
          issue(
            `orders[${orderIndex}].items[${itemIndex}].recipeId`,
            `recipeId "${item.recipeId}" no existe en recipes (referencia rota al importar)`,
          ),
        )
      }
    })
  })

  // 4. taskTemplates[*].steps[*].requiresEquipmentId → equipment
  scenario.taskTemplates.forEach((template, templateIndex) => {
    template.steps.forEach((step, stepIndex) => {
      if (step.requiresEquipmentId !== undefined && !equipmentIds.has(step.requiresEquipmentId)) {
        issues.push(
          issue(
            `taskTemplates[${templateIndex}].steps[${stepIndex}].requiresEquipmentId`,
            `requiresEquipmentId "${step.requiresEquipmentId}" no existe en equipment (referencia rota al importar)`,
          ),
        )
      }
    })
  })

  // 5. taskTemplates[*].dependencies → taskTemplates (existencia + no self)
  scenario.taskTemplates.forEach((template, templateIndex) => {
    template.dependencies.forEach((dependencyId, dependencyIndex) => {
      if (!taskIds.has(dependencyId)) {
        issues.push(
          issue(
            `taskTemplates[${templateIndex}].dependencies[${dependencyIndex}]`,
            `dependencia "${dependencyId}" no existe en taskTemplates (referencia rota al importar)`,
          ),
        )
        return
      }
      if (dependencyId === template.id) {
        issues.push(
          issue(
            `taskTemplates[${templateIndex}].dependencies[${dependencyIndex}]`,
            'dependencies no puede incluir la propia plantilla (dependencia circular consigo misma)',
          ),
        )
      }
    })
  })

  // 5b. Ciclos entre ≥ 2 plantillas (los de un solo elemento ya se
  // reportaron arriba como autodependencia).
  findDependencyCycles(scenario.taskTemplates, (cycle, atPath) => {
    issues.push(
      issue(
        atPath,
        `ciclo de dependencias detectado: ${cycle.join(' → ')} (las tareas nunca podrían arrancar)`,
      ),
    )
  })

  // 6. taskTemplates[*].fallbackTaskId → taskTemplates
  scenario.taskTemplates.forEach((template, templateIndex) => {
    if (template.fallbackTaskId !== undefined && !taskIds.has(template.fallbackTaskId)) {
      issues.push(
        issue(
          `taskTemplates[${templateIndex}].fallbackTaskId`,
          `fallbackTaskId "${template.fallbackTaskId}" no existe en taskTemplates (referencia rota al importar)`,
        ),
      )
    }
  })

  // 7. recipes[*].components[*].inventoryItemId → inventory
  scenario.recipes.forEach((recipe, recipeIndex) => {
    recipe.components.forEach((component, componentIndex) => {
      if (!inventoryIds.has(component.inventoryItemId)) {
        issues.push(
          issue(
            `recipes[${recipeIndex}].components[${componentIndex}].inventoryItemId`,
            `inventoryItemId "${component.inventoryItemId}" no existe en inventory (referencia rota al importar)`,
          ),
        )
      }
    })
  })

  // 8. inventory[*].locationWorldObjectId → objects
  scenario.inventory.forEach((inventoryItem, inventoryIndex) => {
    if (
      inventoryItem.locationWorldObjectId !== undefined &&
      !objectIds.has(inventoryItem.locationWorldObjectId)
    ) {
      issues.push(
        issue(
          `inventory[${inventoryIndex}].locationWorldObjectId`,
          `locationWorldObjectId "${inventoryItem.locationWorldObjectId}" no existe en objects (referencia rota al importar)`,
        ),
      )
    }
  })

  return issues
}
