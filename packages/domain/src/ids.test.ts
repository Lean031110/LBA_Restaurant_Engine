import { describe, expect, it } from 'vitest'
import {
  AgentIdSchema,
  EquipmentIdSchema,
  InventoryItemIdSchema,
  OrderIdSchema,
  RecipeIdSchema,
  ScenarioIdSchema,
  TaskTemplateIdSchema,
  WorldObjectIdSchema,
  ZoneIdSchema,
} from './ids'
import { validate } from './validation'

describe('IDs estables con prefijo por entidad', () => {
  const casos = [
    [ScenarioIdSchema, 'scn_mi-escenario', 'scenario'],
    [WorldObjectIdSchema, 'obj_mesa-01', 'objeto'],
    [ZoneIdSchema, 'zone_salon', 'zona'],
    [AgentIdSchema, 'agent_camarero-01', 'agente'],
    [TaskTemplateIdSchema, 'task_atender-mesa', 'tarea'],
    [EquipmentIdSchema, 'eq_plancha-01', 'equipo'],
    [OrderIdSchema, 'order_0001', 'pedido'],
    [RecipeIdSchema, 'recipe_hamburguesa', 'receta'],
    [InventoryItemIdSchema, 'inv_carne', 'inventario'],
  ] as const

  it.each(casos)('acepta un ID válido de %s', (schema, valid) => {
    const result = validate(schema, valid)
    expect(result.ok).toBe(true)
  })

  it('rechaza IDs sin el prefijo correcto', () => {
    const result = validate(ZoneIdSchema, 'scn_esto-no-es-zona')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].path).toBe('(raíz)')
      expect(result.issues[0].message).toContain('zone_')
    }
  })

  it('rechaza IDs con mayúsculas o espacios', () => {
    expect(validate(ZoneIdSchema, 'zone_Salon Principal').ok).toBe(false)
    expect(validate(ZoneIdSchema, 'zone_').ok).toBe(false)
    expect(validate(AgentIdSchema, 'agent_').ok).toBe(false)
  })

  it('rechaza IDs que no son cadenas', () => {
    const result = validate(ZoneIdSchema, 42)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].message).toContain('expected string')
    }
  })

  it('rechaza IDs demasiado largos', () => {
    const largo = `zone_${'a'.repeat(100)}`
    const result = validate(ZoneIdSchema, largo)
    expect(result.ok).toBe(false)
  })
})
