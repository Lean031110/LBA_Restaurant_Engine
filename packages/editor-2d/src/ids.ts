import { WorldObjectIdSchema, ZoneIdSchema } from '@lba/domain'
import type { Scenario, WorldObjectId, ZoneId } from '@lba/domain'

/**
 * Generación de IDs únicos para objetos y zonas del mundo. Los IDs siguen el
 * contrato de @lba/domain (`obj_<kebab>` / `zone_<kebab>`, cuerpo 2..64) y
 * se deduplican contra el escenario actual antes de devolverse.
 */

/** Longitud máxima del cuerpo del ID (mismo contrato que domain/ids.ts). */
const MAX_BODY = 64

/**
 * Convierte un texto libre a kebab-case ASCII (sin diacríticos), apto como
 * cuerpo de ID. Textos vacíos o sin caracteres útiles devuelven 'x'.
 */
export function slugify(text: string): string {
  const base = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_BODY)
  return base.length >= 2 ? base : 'x'
}

/** Existencia de un ID de objeto en el escenario. */
function objectIdExists(scenario: Scenario, id: string): boolean {
  return scenario.objects.some((o) => o.id === id)
}

/** Existencia de un ID de zona en el escenario. */
function zoneIdExists(scenario: Scenario, id: string): boolean {
  return scenario.zones.some((z) => z.id === id)
}

/**
 * Genera un ID de objeto único: `obj_` + cuerpo propuesto + sufijo numérico
 * si hay colisión (`-2`, `-3`, …). El cuerpo propuesto ya debe ser kebab.
 */
export function nextObjectId(scenario: Scenario, proposedBody: string): WorldObjectId {
  const body = slugify(proposedBody)
  let candidate = `obj_${body}`
  let n = 2
  while (objectIdExists(scenario, candidate)) {
    const suffix = `-${n}`
    const trimmed = body.slice(0, MAX_BODY - suffix.length)
    candidate = `obj_${trimmed}${suffix}`
    n += 1
  }
  return WorldObjectIdSchema.parse(candidate)
}

/**
 * Genera un ID de zona único: `zone_` + cuerpo propuesto + sufijo numérico
 * si hay colisión. Misma mecánica que nextObjectId.
 */
export function nextZoneId(scenario: Scenario, proposedBody: string): ZoneId {
  const body = slugify(proposedBody)
  let candidate = `zone_${body}`
  let n = 2
  while (zoneIdExists(scenario, candidate)) {
    const suffix = `-${n}`
    const trimmed = body.slice(0, MAX_BODY - suffix.length)
    candidate = `zone_${trimmed}${suffix}`
    n += 1
  }
  return ZoneIdSchema.parse(candidate)
}
