import type { WorldObject } from '@lba/domain'
import { getObjectPreset } from '@lba/asset-catalog'
import { PRESET_ORIGIN_KEY } from './instantiate'

/**
 * Validaciones de dimensión del inspector (prompt 03.3) usando los rangos
 * DECLARADOS por el catálogo (regla 10: unidad, procedencia y confianza
 * viven en el ParameterRecord del preset; aquí solo se consultan).
 *
 * Si un objeto no viene del catálogo (escenario importado sin
 * `catalogPresetId`), solo se aplican las invariantes del dominio.
 */

/** Límites de seguridad cuando no hay declaración de catálogo. */
export const FALLBACK_LIMITS = { minLength: 0.05, maxLength: 100 } as const

/** Límites declarados para una dimensión, si existen. */
export interface DimensionLimits {
  readonly min: number
  readonly max: number
}

/** Preset de origen de un objeto (si procede del catálogo). */
export function originPresetOf(obj: WorldObject) {
  const origin = obj.properties[PRESET_ORIGIN_KEY]
  if (typeof origin !== 'string') return undefined
  return getObjectPreset(origin)
}

/**
 * Límites válidos para una magnitud del objeto consultando la declaración
 * del catálogo: para muros usa el parámetro `length`; para ancho/fondo de
 * muebles usa `width`/`depth` si están declarados; si no, fallback.
 */
export function dimensionLimitsFor(
  obj: WorldObject,
  dimension: 'length' | 'width' | 'depth',
): DimensionLimits {
  const preset = originPresetOf(obj)
  if (preset) {
    const spec =
      obj.kind === 'wall' && dimension === 'length'
        ? preset.parameters['length']
        : preset.parameters[dimension]
    if (spec) {
      return {
        min: spec.record.minValue ?? FALLBACK_LIMITS.minLength,
        max: spec.record.maxValue ?? FALLBACK_LIMITS.maxLength,
      }
    }
  }
  return { min: FALLBACK_LIMITS.minLength, max: FALLBACK_LIMITS.maxLength }
}

/** Mensaje de error legible para un valor fuera de rango. */
export function rangeErrorMessage(
  label: string,
  value: number,
  limits: DimensionLimits,
  unit: string,
): string {
  return `${label} fuera de rango: ${value} ${unit} no está entre ${limits.min} y ${limits.max} ${unit} (límites declarados por el catálogo)`
}
