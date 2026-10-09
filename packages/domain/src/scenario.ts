import { z } from 'zod'
import { ScenarioIdSchema } from './ids'
import { NonEmptyStringSchema, PositiveFiniteNumberSchema, WorldLengthUnitSchema } from './units'
import { ParameterRecordSchema } from './parameter'
import { WorldObjectSchema } from './entities/world-object'
import { ZoneSchema } from './entities/zone'
import { AgentSchema } from './entities/agent'
import { TaskTemplateSchema } from './entities/task-template'
import { EquipmentSchema } from './entities/equipment'
import { OrderSchema } from './entities/order'
import { RecipeSchema } from './entities/recipe'
import { InventoryItemSchema } from './entities/inventory-item'

/**
 * Scenario (contrato docs/guia/04, sección 2): versión del esquema, geometría,
 * catálogo, personas, roles, pedidos, flujos, parámetros y semilla.
 *
 * `schemaVersion` permite migrar escenarios antiguos de forma explícita
 * (política de migraciones en el prompt 02.3); por ahora solo se acepta la
 * versión actual y cualquier otra se rechaza con la ruta exacta del campo.
 */

/** Versión actual del esquema de escenario. */
export const CURRENT_SCENARIO_SCHEMA_VERSION = 1

export const ScenarioId = ScenarioIdSchema

/** Geometría del mundo: unidad de longitud y tamaño del local. */
export const WorldSchema = z.object({
  /** Unidad real de longitud (m/cm); nunca píxeles. */
  lengthUnit: WorldLengthUnitSchema,
  /** Tamaño del local en la unidad declarada. */
  size: z.object({
    width: PositiveFiniteNumberSchema,
    depth: PositiveFiniteNumberSchema,
  }),
})

export type World = z.infer<typeof WorldSchema>

/** Cuerpo del escenario (sin las refinaciones de unicidad). */
const ScenarioObjectSchema = z.object({
  /** Versión del esquema (solo la actual; migraciones explícitas en 02.3). */
  schemaVersion: z.literal(CURRENT_SCENARIO_SCHEMA_VERSION, {
    error: `versión de esquema no soportada: este modelo valida la versión ${CURRENT_SCENARIO_SCHEMA_VERSION} (la política de migraciones llega en el prompt 02.3)`,
  }),
  id: ScenarioIdSchema,
  name: NonEmptyStringSchema,
  description: NonEmptyStringSchema.optional(),
  world: WorldSchema,
  /** Semilla de aleatoriedad reproducible (≥ 0). */
  seed: z
    .number()
    .int({ error: 'seed debe ser un entero' })
    .refine((v) => v >= 0, { error: 'seed debe ser mayor o igual que 0' }),
  objects: z.array(WorldObjectSchema),
  zones: z.array(ZoneSchema),
  agents: z.array(AgentSchema),
  taskTemplates: z.array(TaskTemplateSchema),
  equipment: z.array(EquipmentSchema),
  orders: z.array(OrderSchema),
  recipes: z.array(RecipeSchema),
  inventory: z.array(InventoryItemSchema),
  /** Parámetros globales del escenario (por id de parámetro). */
  parameters: z.record(z.string(), ParameterRecordSchema),
})

/** Colecciones cuyos IDs deben ser únicos (ruta → campo del ID). */
const UNIQUE_ID_COLLECTIONS = [
  ['objects', 'id'],
  ['zones', 'id'],
  ['agents', 'id'],
  ['taskTemplates', 'id'],
  ['equipment', 'id'],
  ['orders', 'id'],
  ['recipes', 'id'],
  ['inventory', 'id'],
] as const

/**
 * Escenario completo: entidades + unicidad de IDs estables por colección.
 * La integridad referencial cruzada (zonas referenciadas, recetas de pedidos,
 * etc.) se valida al importar (prompt 02.3).
 */
export const ScenarioSchema = ScenarioObjectSchema.superRefine((scenario, ctx) => {
  for (const [collection, idField] of UNIQUE_ID_COLLECTIONS) {
    const items = scenario[collection] as ReadonlyArray<{ id: string }>
    const seen = new Set<string>()
    items.forEach((item, index) => {
      if (seen.has(item.id)) {
        ctx.addIssue({
          code: 'custom',
          path: [collection, index, idField],
          message: `ID duplicado en "${collection}": "${item.id}" ya fue usado en la misma colección (los IDs deben ser estables y únicos)`,
        })
      }
      seen.add(item.id)
    })
  }
})

export type Scenario = z.infer<typeof ScenarioSchema>
