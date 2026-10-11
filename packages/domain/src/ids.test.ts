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

describe('límites del cuerpo del ID (contrato: prefijo_ + cuerpo de 2..64)', () => {
  /** Regresión post-integración (revisión del propietario, 2026-10-11): el
   * comentario documentaba un cuerpo de 2..64 caracteres pero el patrón
   * admitía un solo carácter; la implementación se alineó con el contrato. */

  it('acepta el mínimo: cuerpo de 2 caracteres', () => {
    expect(validate(ZoneIdSchema, 'zone_ab').ok).toBe(true)
  })

  it('acepta el máximo: cuerpo de 64 caracteres', () => {
    expect(validate(ZoneIdSchema, `zone_${'a'.repeat(64)}`).ok).toBe(true)
  })

  it('acepta un cuerpo multi-segmento kebab-case (segmentos de un carácter)', () => {
    expect(validate(ZoneIdSchema, 'zone_a-b').ok).toBe(true)
  })

  it('rechaza un cuerpo de un solo carácter', () => {
    const result = validate(ZoneIdSchema, 'zone_a')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues[0].message).toContain('al menos')
    }
  })

  it('rechaza un carácter de más: cuerpo de 65 caracteres', () => {
    expect(validate(ZoneIdSchema, `zone_${'a'.repeat(65)}`).ok).toBe(false)
  })

  it('rechaza guiones mal colocados (inicial, final, doble)', () => {
    expect(validate(ZoneIdSchema, 'zone_-ab').ok).toBe(false)
    expect(validate(ZoneIdSchema, 'zone_ab-').ok).toBe(false)
    expect(validate(ZoneIdSchema, 'zone_a--b').ok).toBe(false)
  })

  it('rechaza caracteres inválidos (guion bajo, espacio)', () => {
    expect(validate(ZoneIdSchema, 'zone_ta_ble').ok).toBe(false)
    expect(validate(ZoneIdSchema, 'zone_ta ble').ok).toBe(false)
  })
})
