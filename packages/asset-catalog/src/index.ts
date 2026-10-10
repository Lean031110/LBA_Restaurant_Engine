/**
 * @lba/asset-catalog — Catálogo declarativo de presets de LBA_Restaurant_Engine
 * (FASE 02, prompt 02.2).
 *
 * El catálogo declara DATOS (dimensiones, materiales, propiedades editables
 * e iconos de respaldo); las REGLAS (semántica de unidades, rangos de
 * override, fechas) viven en @lba/domain y se aplican reutilizando sus
 * esquemas. El paquete es puro: sin React, sin DOM (regla 11).
 */

// Esquemas, tipos, constantes y helpers
export {
  PresetIdSchema,
  CatalogGroupSchema,
  MaterialSchema,
  CatalogParameterSpecSchema,
  CatalogFlagSpecSchema,
  DoorMechanismSchema,
  IconIdSchema,
  CatalogObjectPresetSchema,
  CatalogZonePresetSchema,
  INTERACTION_POINT_MAX_OFFSET_M,
  INTERACTION_FRONT_OFFSET_M,
  estimatedSpec,
  flagSpec,
  frontInteractionPoint,
  centerInteractionPoint,
} from './preset'
export type {
  PresetId,
  CatalogGroup,
  Material,
  CatalogParameterSpec,
  CatalogFlagSpec,
  DoorMechanism,
  IconId,
  CatalogObjectPreset,
  CatalogZonePreset,
} from './preset'

// Iconos vectoriales de respaldo (obra original del proyecto)
export { ICONS } from './icons'
export type { IconSpec } from './icons'

// Catálogo ensamblado
export { CATALOG, buildCatalog } from './catalog'
export type { Catalog } from './catalog'

// Consultas
export {
  getObjectPreset,
  getZonePreset,
  listObjectPresetsByGroup,
  listZonePresetsByCategory,
  listPresetsByEquipmentKind,
  objectPresetIds,
  zonePresetIds,
  getCatalog,
} from './lookup'
