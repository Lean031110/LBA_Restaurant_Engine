/**
 * @lba/domain — Modelo de datos validado de LBA_Restaurant_Engine (FASE 02).
 *
 * Tipos, IDs estables, unidades y esquemas de escenarios conforme al
 * contrato docs/guia/04_CONTRATO_DE_SIMULACION_Y_DATOS.md. El paquete es
 * puro: no importa React, DOM ni ninguna API de navegador (regla 11).
 */

// IDs estables con marca de tipo
export {
  ScenarioIdSchema,
  WorldObjectIdSchema,
  ZoneIdSchema,
  AgentIdSchema,
  TaskTemplateIdSchema,
  EquipmentIdSchema,
  OrderIdSchema,
  RecipeIdSchema,
  InventoryItemIdSchema,
} from './ids'
export type {
  ScenarioId,
  WorldObjectId,
  ZoneId,
  AgentId,
  TaskTemplateId,
  EquipmentId,
  OrderId,
  RecipeId,
  InventoryItemId,
} from './ids'

// Unidades y geometría
export {
  FiniteNumberSchema,
  PositiveFiniteNumberSchema,
  NonNegativeFiniteNumberSchema,
  WorldLengthUnitSchema,
  InventoryUnitSchema,
  ParameterUnitSchema,
  PositionSchema,
  DimensionsSchema,
  RotationSchema,
  NonEmptyStringSchema,
} from './units'
export type {
  WorldLengthUnit,
  InventoryUnit,
  ParameterUnit,
  Position,
  Dimensions,
  Rotation,
} from './units'

// Registro de parámetros (regla 10)
export {
  ParameterRecordSchema,
  SecondsParameterSchema,
  CelsiusParameterSchema,
  ParameterSourceSchema,
  ParameterConfidenceSchema,
  estimatedSeconds,
  estimatedCelsius,
} from './parameter'
export type {
  ParameterRecord,
  SecondsParameter,
  CelsiusParameter,
  ParameterSource,
  ParameterConfidence,
} from './parameter'

// Entidades
export {
  WorldObjectSchema,
  WorldObjectKindSchema,
  WorldObjectLayerSchema,
} from './entities/world-object'
export type { WorldObject, WorldObjectKind, WorldObjectLayer } from './entities/world-object'
export { ZoneSchema, ZoneCategorySchema, ZoneBoundsSchema } from './entities/zone'
export type { Zone, ZoneCategory, ZoneBounds } from './entities/zone'
export { AgentSchema, AgentRoleSchema, AgentStateSchema, AgentPolicySchema } from './entities/agent'
export type { Agent, AgentRole, AgentState, AgentPolicy } from './entities/agent'
export { TaskTemplateSchema, TaskStepSchema } from './entities/task-template'
export type { TaskTemplate, TaskStep } from './entities/task-template'
export { EquipmentSchema, EquipmentKindSchema, EquipmentStateSchema } from './entities/equipment'
export type { Equipment, EquipmentKind, EquipmentState } from './entities/equipment'
export { OrderSchema, OrderItemSchema, OrderPrioritySchema } from './entities/order'
export type { Order, OrderItem, OrderPriority } from './entities/order'
export {
  RecipeSchema,
  RecipeStepSchema,
  RecipeComponentSchema,
  RecipeStepKindSchema,
} from './entities/recipe'
export type { Recipe, RecipeStep, RecipeComponent, RecipeStepKind } from './entities/recipe'
export { InventoryItemSchema } from './entities/inventory-item'
export type { InventoryItem } from './entities/inventory-item'

// Escenario agregado
export { ScenarioSchema, WorldSchema, CURRENT_SCENARIO_SCHEMA_VERSION } from './scenario'
export type { Scenario, World } from './scenario'

// Validación con rutas de campo
export {
  validate,
  validateScenario,
  validateScenarioOrThrow,
  formatPath,
  toValidationIssues,
  ScenarioValidationError,
} from './validation'
export type { ValidationIssue, ValidationResult } from './validation'

// Ejemplos y helpers
export { minimalScenarioExample, isPlainObject } from './examples'
