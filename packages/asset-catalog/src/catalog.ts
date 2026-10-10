import { EQUIPMENT_PRESETS } from './data/equipment'
import { FURNITURE_PRESETS } from './data/furniture'
import { STRUCTURE_PRESETS } from './data/structure'
import { ZONE_PRESETS } from './data/zones'
import type { CatalogObjectPreset, CatalogZonePreset } from './preset'

/**
 * Catálogo completo del proyecto (prompt 02.2): 37 presets de objeto
 * (estructura, mobiliario y equipo) y 11 presets de zona.
 *
 * El catálogo es DATO: se declara una vez y se valida con los esquemas de
 * preset.ts en cada ejecución de pruebas. La unicidad de IDs se verifica en
 * lookup.ts (buildCatalog) y por test; la cobertura de categorías/zonas
 * (11/11) y de tipos de equipo (12/12) también se verifica por test.
 */

export interface Catalog {
  /** Presets de objeto (geometría + propiedades), por ID. */
  readonly objects: ReadonlyMap<string, CatalogObjectPreset>
  /** Presets de zona funcional, por ID. */
  readonly zones: ReadonlyMap<string, CatalogZonePreset>
}

/**
 * Construye el catálogo validando unicidad de IDs entre ambas colecciones.
 * Lanza si hay duplicados: el catálogo se ensambla en import time y en
 * pruebas, así que un duplicado rompe el build (no se tolera en silencio).
 */
export function buildCatalog(
  objects: readonly CatalogObjectPreset[],
  zones: readonly CatalogZonePreset[],
): Catalog {
  const objectMap = new Map<string, CatalogObjectPreset>()
  for (const preset of objects) {
    if (objectMap.has(preset.id)) {
      throw new Error(`ID de preset de objeto duplicado: ${preset.id}`)
    }
    objectMap.set(preset.id, preset)
  }
  const zoneMap = new Map<string, CatalogZonePreset>()
  for (const preset of zones) {
    if (zoneMap.has(preset.id) || objectMap.has(preset.id)) {
      throw new Error(`ID de preset de zona duplicado o colisionado: ${preset.id}`)
    }
    zoneMap.set(preset.id, preset)
  }
  return { objects: objectMap, zones: zoneMap }
}

/** Catálogo único del proyecto (inmutable desde fuera). */
export const CATALOG: Catalog = buildCatalog(
  [...STRUCTURE_PRESETS, ...FURNITURE_PRESETS, ...EQUIPMENT_PRESETS],
  ZONE_PRESETS,
)
