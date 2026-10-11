import type { Position, Rotation, WorldObject } from '@lba/domain'
import { WorldObjectSchema } from '@lba/domain'
import type { CatalogObjectPreset, CatalogZonePreset } from '@lba/asset-catalog'
import { nextObjectId, nextZoneId } from './ids'
import { add, rotatePoint } from './geometry'
import type { Scenario } from '@lba/domain'

/**
 * Instanciación de presets del catálogo en objetos/zonas del mundo
 * (puente @lba/asset-catalog → @lba/domain exigido por el prompt 03.1).
 *
 * Convenciones (docs/asset-catalog/src/preset.ts): el origen del preset es
 * el centro geométrico de su huella y su punto de interacción se expresa en
 * coordenadas locales; al instanciar se aplica la rotación al punto local y
 * se traslada a la posición del mundo.
 *
 * El ID de preset de origen se guarda en `properties.catalogPresetId`
 * (canal de extensión sancionado por el dominio, preservado en el
 * round-trip de persistencia): así el inspector puede ofrecer materiales,
 * etiquetas y rangos min/max del catálogo sin inventar campos nuevos.
 */

/** Clave de properties que recuerda el preset de origen. */
export const PRESET_ORIGIN_KEY = 'catalogPresetId'

/** Claves visuales de apertura (solo kind door; prompt 03.2). */
export const HINGE_KEY = 'hinge'
export const OPENING_KEY = 'opening'
export const SLIDE_KEY = 'slide'

export type HingeSide = 'left' | 'right'
export type OpeningSide = 'a' | 'b'
export type SlideDirection = 'left' | 'right'

export interface InstantiateOptions {
  readonly position: Position
  readonly rotation: Rotation
  /** Longitud del tramo para muros (dimensions.width); ignora la del preset. */
  readonly wallLength?: number
  /** Material forzado (id del catálogo); si no, el material por defecto. */
  readonly materialId?: string
}

/**
 * Instancia un preset de objeto en WorldObject. No añade el objeto al
 * escenario (eso lo hace el comando AddObject, que valida y registra
 * historial); aquí solo se construye el valor del dominio.
 */
export function instantiateObject(
  preset: CatalogObjectPreset,
  scenario: Scenario,
  options: InstantiateOptions,
): WorldObject {
  const materialId = options.materialId ?? preset.defaultMaterialId
  const material = preset.materials.find((m) => m.id === materialId) ?? preset.materials[0]!
  const isWall = preset.family === 'wall'
  const width =
    isWall && options.wallLength !== undefined ? options.wallLength : preset.dimensions.width

  // Propiedades: valor actual de los parámetros editables + flags booleanos
  // + origen de catálogo (+ apertura visual en puertas).
  const properties: Record<string, number | string | boolean> = {
    [PRESET_ORIGIN_KEY]: preset.id,
  }
  let capacity: number | undefined
  for (const [key, spec] of Object.entries(preset.parameters)) {
    properties[key] = spec.record.value
    if (key === 'seats' && typeof spec.record.value === 'number') {
      capacity = Math.max(1, Math.round(spec.record.value))
    }
  }
  for (const [key, flag] of Object.entries(preset.flags)) {
    properties[key] = flag.value
  }
  if (preset.family === 'door') {
    if (preset.doorMechanism === 'swing') {
      properties[HINGE_KEY] = 'left' as HingeSide
      properties[OPENING_KEY] = 'a' as OpeningSide
    } else {
      properties[SLIDE_KEY] = 'right' as SlideDirection
    }
  }

  const candidate = {
    id: nextObjectId(scenario, presetIdBody(preset.id)),
    kind: preset.family,
    name: preset.label,
    position: options.position,
    rotation: options.rotation,
    dimensions: { width, depth: preset.dimensions.depth },
    interactionPoint: add(options.position, rotatePoint(preset.interactionPoint, options.rotation)),
    tags: [...preset.tags],
    layer: preset.layer,
    material: material.label,
    color: material.suggestedColor,
    properties,
    ...(capacity !== undefined ? { capacity } : {}),
    ...(preset.family === 'door' ? { doorType: preset.doorMechanism } : {}),
  }
  return WorldObjectSchema.parse(candidate)
}

/**
 * Instancia un preset de zona: bounds centrados en `center` con el tamaño
 * sugerido, nombre visible y categoría del preset. La capacidad por defecto
 * del preset es una estimación editable (regla 10), no un aforo certificado.
 */
export function instantiateZone(
  preset: CatalogZonePreset,
  scenario: Scenario,
  bounds: { min: Position; max: Position },
): import('@lba/domain').Zone {
  return {
    id: nextZoneId(scenario, presetIdBody(preset.id)),
    name: preset.label,
    category: preset.category,
    bounds,
    ...(preset.defaultCapacity !== undefined
      ? { capacity: Math.max(1, Math.round(preset.defaultCapacity.record.value)) }
      : {}),
    allowedRoles: [...preset.allowedRoles],
    accessRules: [...preset.accessRules],
  }
}

/** Cuerpo kebab de un ID de preset (`cat_door-swing-90` → `door-swing-90`). */
function presetIdBody(presetId: string): string {
  return presetId.replace(/^cat_/, '')
}
