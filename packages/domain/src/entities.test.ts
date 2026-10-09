import { describe, expect, it } from 'vitest'
import { AgentSchema } from './entities/agent'
import { EquipmentSchema } from './entities/equipment'
import { InventoryItemSchema } from './entities/inventory-item'
import { OrderSchema } from './entities/order'
import { RecipeSchema } from './entities/recipe'
import { TaskTemplateSchema } from './entities/task-template'
import { WorldObjectSchema } from './entities/world-object'
import { ZoneSchema } from './entities/zone'
import { estimatedCelsius, estimatedSeconds } from './parameter'
import { validate } from './validation'

const position = { x: 1, y: 1 }

describe('WorldObject', () => {
  const base = {
    id: 'obj_mesa-01',
    kind: 'furniture',
    position,
    rotation: 0,
    dimensions: { width: 1.2, depth: 0.8 },
    interactionPoint: { x: 1, y: 0.5 },
    tags: ['mesa'],
    layer: 'furniture',
    properties: {},
  } as const

  it('acepta un objeto válido con capacidad', () => {
    const result = validate(WorldObjectSchema, { ...base, capacity: 4 })
    expect(result.ok).toBe(true)
  })

  it('exige doorType para puertas y lo prohíbe en paredes', () => {
    const puerta = validate(WorldObjectSchema, {
      ...base,
      id: 'obj_puerta-01',
      kind: 'door',
    })
    expect(puerta.ok).toBe(false)
    if (!puerta.ok) {
      expect(puerta.issues[0].path).toBe('doorType')
    }
    expect(
      validate(WorldObjectSchema, {
        ...base,
        id: 'obj_puerta-01',
        kind: 'door',
        doorType: 'swing',
      }).ok,
    ).toBe(true)
    const pared = validate(WorldObjectSchema, {
      ...base,
      id: 'obj_pared-01',
      kind: 'wall',
      doorType: 'sliding',
    })
    expect(pared.ok).toBe(false)
  })

  it('valida el color en formato #RRGGBB', () => {
    const result = validate(WorldObjectSchema, { ...base, color: '#FF5500' })
    expect(result.ok).toBe(true)
    const mal = validate(WorldObjectSchema, { ...base, color: 'naranja' })
    expect(mal.ok).toBe(false)
    if (!mal.ok) {
      expect(mal.issues[0].path).toBe('color')
    }
  })

  it('rechaza posiciones no finitas con ruta del eje exacto', () => {
    const result = validate(WorldObjectSchema, {
      ...base,
      position: { x: 1e999, y: 1 },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('position.x')
    }
  })

  it('la huella de colisión necesita al menos 3 puntos', () => {
    const result = validate(WorldObjectSchema, {
      ...base,
      footprint: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].message).toContain('3 puntos')
    }
  })
})

describe('Zone', () => {
  const base = {
    id: 'zone_salon',
    name: 'Salón',
    category: 'dining',
    bounds: { min: { x: 0, y: 0 }, max: { x: 6, y: 8 } },
    allowedRoles: ['waiter'],
    accessRules: [],
  } as const

  it('acepta una zona válida', () => {
    expect(validate(ZoneSchema, base).ok).toBe(true)
  })

  it('rechaza límites invertidos con ruta exacta', () => {
    const result = validate(ZoneSchema, {
      ...base,
      bounds: { min: { x: 5, y: 0 }, max: { x: 2, y: 8 } },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].message).toContain('min')
    }
  })

  it('rechaza categorías fuera del contrato', () => {
    const result = validate(ZoneSchema, {
      ...base,
      category: 'terraza',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('category')
    }
  })
})

describe('Agent', () => {
  const base = {
    id: 'agent_cocinero-01',
    displayName: 'Cocinero 01',
    role: 'cook',
    skills: ['plancha'],
    position,
  } as const

  it('acepta un agente válido', () => {
    expect(validate(AgentSchema, { ...base, speedMps: 1.4, state: 'idle' }).ok).toBe(true)
  })

  it('rechaza velocidad no positiva', () => {
    const result = validate(AgentSchema, { ...base, speedMps: 0 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('speedMps')
    }
  })

  it('rechaza prioridades repetidas en la política', () => {
    const result = validate(AgentSchema, {
      ...base,
      policy: { priorityOrder: ['urgente', 'urgente'] },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].message).toContain('repetir')
    }
  })
})

describe('TaskTemplate', () => {
  const base = {
    id: 'task_atender-mesa',
    name: 'Atender mesa',
    preconditions: [],
    steps: [{ name: 'Tomar comanda', durationSeconds: estimatedSeconds(120) }],
    dependencies: [],
    requiredResourceIds: [],
    effects: [],
    priority: 50,
  } as const

  it('acepta una plantilla válida', () => {
    expect(validate(TaskTemplateSchema, base).ok).toBe(true)
  })

  it('exige al menos un paso', () => {
    const result = validate(TaskTemplateSchema, { ...base, steps: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].message).toContain('al menos un paso')
    }
  })

  it('prioridad entre 0 y 100', () => {
    expect(validate(TaskTemplateSchema, { ...base, priority: 101 }).ok).toBe(false)
    expect(validate(TaskTemplateSchema, { ...base, priority: -1 }).ok).toBe(false)
  })

  it('fallbackTaskId no puede apuntar a sí misma', () => {
    const result = validate(TaskTemplateSchema, {
      ...base,
      fallbackTaskId: 'task_atender-mesa',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('fallbackTaskId')
    }
  })
})

describe('Equipment', () => {
  const base = {
    id: 'eq_horno-01',
    kind: 'oven',
    capacity: 2,
    initialState: 'off',
    usageRules: [],
  } as const

  it('acepta un equipo con tiempos y temperatura como parámetros', () => {
    const result = validate(EquipmentSchema, {
      ...base,
      warmupSeconds: estimatedSeconds(900),
      targetTemperatureC: estimatedCelsius(220),
    })
    expect(result.ok).toBe(true)
  })

  it('rechaza capacidad 0', () => {
    const result = validate(EquipmentSchema, { ...base, capacity: 0 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('capacity')
    }
  })

  it('rechaza estados fuera de la máquina de estados del contrato', () => {
    const result = validate(EquipmentSchema, {
      ...base,
      initialState: 'encendido',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('initialState')
    }
  })

  it('rechaza temperaturas con unidad incorrecta', () => {
    const result = validate(EquipmentSchema, {
      ...base,
      targetTemperatureC: estimatedSeconds(200),
    })
    expect(result.ok).toBe(false)
  })
})

describe('Order', () => {
  const base = {
    id: 'order_0001',
    items: [{ recipeId: 'recipe_hamburguesa', quantity: 2, modifiers: [] }],
    priority: 'normal',
    createdAtSeconds: 60,
  } as const

  it('acepta un pedido válido con promesa posterior', () => {
    expect(validate(OrderSchema, { ...base, promisedAtSeconds: 600 }).ok).toBe(true)
  })

  it('la promesa debe ser posterior a la creación', () => {
    const result = validate(OrderSchema, {
      ...base,
      promisedAtSeconds: 30,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('promisedAtSeconds')
    }
  })

  it('exige al menos un item con cantidad entera ≥ 1', () => {
    expect(validate(OrderSchema, { ...base, items: [] }).ok).toBe(false)
    const result = validate(OrderSchema, {
      ...base,
      items: [{ recipeId: 'recipe_hamburguesa', quantity: 0, modifiers: [] }],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('items[0].quantity')
    }
  })
})

describe('Recipe', () => {
  const cookStep = {
    name: 'Cocinar',
    kind: 'cook',
    durationSeconds: estimatedSeconds(240),
    requiredResourceIds: ['eq_plancha-01'],
  }
  const plateStep = {
    name: 'Emplatado',
    kind: 'plate',
    requiredResourceIds: [],
  }
  const base = {
    id: 'recipe_hamburguesa',
    name: 'Hamburguesa',
    components: [{ inventoryItemId: 'inv_carne', quantity: 150, unit: 'g' }],
    steps: [cookStep, plateStep],
  } as const

  it('acepta una receta válida (cocinar + emplatar)', () => {
    expect(validate(RecipeSchema, base).ok).toBe(true)
  })

  it('una receta con cocción debe terminar en montaje o emplatado', () => {
    const result = validate(RecipeSchema, {
      ...base,
      steps: [cookStep],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].message).toContain('emplatado')
    }
  })

  it('los componentes exigen cantidad positiva y unidad válida', () => {
    const result = validate(RecipeSchema, {
      ...base,
      components: [{ inventoryItemId: 'inv_carne', quantity: -5, unit: 'g' }],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('components[0].quantity')
    }
    const unidad = validate(RecipeSchema, {
      ...base,
      components: [{ inventoryItemId: 'inv_carne', quantity: 5, unit: 'onzas' }],
    })
    expect(unidad.ok).toBe(false)
  })
})

describe('InventoryItem', () => {
  const base = {
    id: 'inv_carne',
    name: 'Carne de vacuno',
    unit: 'g',
    stock: 5000,
  } as const

  it('acepta un artículo válido con reposición', () => {
    expect(
      validate(InventoryItemSchema, {
        ...base,
        reorderPoint: 1000,
        replenishmentQuantity: 5000,
      }).ok,
    ).toBe(true)
  })

  it('la reserva no puede superar el stock', () => {
    const result = validate(InventoryItemSchema, {
      ...base,
      reserved: 6000,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('reserved')
      expect(result.issues[0].message).toContain('reservada')
    }
  })

  it('rechaza stock negativo', () => {
    const result = validate(InventoryItemSchema, { ...base, stock: -1 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('stock')
    }
  })
})
