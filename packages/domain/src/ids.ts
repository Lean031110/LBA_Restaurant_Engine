import { z } from 'zod'

/**
 * IDs estables del dominio (contrato docs/guia/04, sección 2):
 * identificadores con prefijo por entidad, independientes de la posición en
 * arrays, validados por patrón y marcados (brand) a nivel de tipos para no
 * mezclar IDs de entidades distintas.
 *
 * Formato: `prefijo_` + cuerpo kebab-case de [a-z0-9-] (2..64 caracteres).
 */
const ID_BODY = '[a-z0-9]+(?:-[a-z0-9]+)*'
const ID_MAX_LENGTH = 64

function prefixedId(prefix: string) {
  const pattern = new RegExp(`^${prefix}_${ID_BODY}$`)
  return z
    .string()
    .max(ID_MAX_LENGTH + prefix.length + 1, {
      error: `el ID debe tener como máximo ${ID_MAX_LENGTH + prefix.length + 1} caracteres`,
    })
    .regex(pattern, {
      error: `ID inválido: se esperaba el formato "${prefix}_<kebab-case>" (ej. "${prefix}_mesa-01")`,
    })
}

/** Identificador de escenario (`scn_…`). */
export const ScenarioIdSchema = prefixedId('scn').brand<'ScenarioId'>()
/** Identificador de objeto del mundo (`obj_…`). */
export const WorldObjectIdSchema = prefixedId('obj').brand<'WorldObjectId'>()
/** Identificador de zona (`zone_…`). */
export const ZoneIdSchema = prefixedId('zone').brand<'ZoneId'>()
/** Identificador de agente/persona simulada (`agent_…`). */
export const AgentIdSchema = prefixedId('agent').brand<'AgentId'>()
/** Identificador de plantilla de tarea (`task_…`). */
export const TaskTemplateIdSchema = prefixedId('task').brand<'TaskTemplateId'>()
/** Identificador de equipo (`eq_…`). */
export const EquipmentIdSchema = prefixedId('eq').brand<'EquipmentId'>()
/** Identificador de pedido (`order_…`). */
export const OrderIdSchema = prefixedId('order').brand<'OrderId'>()
/** Identificador de receta (`recipe_…`). */
export const RecipeIdSchema = prefixedId('recipe').brand<'RecipeId'>()
/** Identificador de artículo de inventario (`inv_…`). */
export const InventoryItemIdSchema = prefixedId('inv').brand<'InventoryItemId'>()

export type ScenarioId = z.infer<typeof ScenarioIdSchema>
export type WorldObjectId = z.infer<typeof WorldObjectIdSchema>
export type ZoneId = z.infer<typeof ZoneIdSchema>
export type AgentId = z.infer<typeof AgentIdSchema>
export type TaskTemplateId = z.infer<typeof TaskTemplateIdSchema>
export type EquipmentId = z.infer<typeof EquipmentIdSchema>
export type OrderId = z.infer<typeof OrderIdSchema>
export type RecipeId = z.infer<typeof RecipeIdSchema>
export type InventoryItemId = z.infer<typeof InventoryItemIdSchema>

/**
 * Lista de pares (nombre de colección, campo de ID) usada por el escenario
 * para validar la unicidad de IDs con ruta de campo exacta.
 */
export const ID_BRANDS = {
  objects: WorldObjectIdSchema,
  zones: ZoneIdSchema,
  agents: AgentIdSchema,
  taskTemplates: TaskTemplateIdSchema,
  equipment: EquipmentIdSchema,
  orders: OrderIdSchema,
  recipes: RecipeIdSchema,
  inventory: InventoryItemIdSchema,
} as const
