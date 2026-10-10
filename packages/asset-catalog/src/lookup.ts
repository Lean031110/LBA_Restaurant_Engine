import type { CatalogGroup, CatalogObjectPreset, CatalogZonePreset } from './preset'
import { CATALOG, type Catalog } from './catalog'
import type { EquipmentKind, ZoneCategory } from '@lba/domain'

/**
 * Consultas sobre el catálogo. Todas las búsquedas devuelven copias de
 * referencia (readonly): el catálogo nunca se muta desde fuera.
 */

/** Devuelve un preset de objeto por su ID (cat_…). */
export function getObjectPreset(id: string): CatalogObjectPreset | undefined {
  return CATALOG.objects.get(id)
}

/** Devuelve un preset de zona por su ID (cat_zone-…). */
export function getZonePreset(id: string): CatalogZonePreset | undefined {
  return CATALOG.zones.get(id)
}

/** Lista los presets de objeto de un grupo, ordenados por label. */
export function listObjectPresetsByGroup(group: CatalogGroup): readonly CatalogObjectPreset[] {
  return [...CATALOG.objects.values()]
    .filter((p) => p.group === group)
    .sort((a, b) => a.label.localeCompare(b.label, 'es'))
}

/** Lista los presets de zona con una categoría dada. */
export function listZonePresetsByCategory(category: ZoneCategory): readonly CatalogZonePreset[] {
  return [...CATALOG.zones.values()].filter((z) => z.category === category)
}

/** Presets de objeto que instancian un tipo de equipo concreto. */
export function listPresetsByEquipmentKind(kind: EquipmentKind): readonly CatalogObjectPreset[] {
  return [...CATALOG.objects.values()].filter((p) => p.equipmentKind === kind)
}

/** Todos los IDs de presets de objeto, ordenados. */
export function objectPresetIds(): readonly string[] {
  return [...CATALOG.objects.keys()].sort()
}

/** Todos los IDs de presets de zona, ordenados. */
export function zonePresetIds(): readonly string[] {
  return [...CATALOG.zones.keys()].sort()
}

/** El catálogo completo (para inspección/diagnóstico; no mutar). */
export function getCatalog(): Catalog {
  return CATALOG
}
