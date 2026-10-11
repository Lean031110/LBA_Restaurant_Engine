import type { WorldObject } from '@lba/domain'
import type { EditorDocument } from './types'
import type { Position, WorldObjectId, ZoneId } from '@lba/domain'
import { closestPointOnSegment, distance, obbCorners, projectOnSegment } from './geometry'

/**
 * Detección de impactos (hit-testing) del editor en unidades del mundo.
 *
 * La UI de Konva usa sus propios eventos visuales para seleccionar con el
 * ratón; este módulo es la versión pura (misma semántica) usada por la
 * herramienta de borrar, el ciclado por teclado y las pruebas.
 */

/** Resultado de un hit-test: objeto, zona o nada. */
export type HitTarget =
  | { readonly kind: 'object'; readonly id: WorldObjectId }
  | { readonly kind: 'zone'; readonly id: ZoneId }
  | null

/** Tolerancia por defecto para el "engrosamiento" del punto (unidades). */
export const HIT_TOLERANCE = 0.05

/** ¿El punto cae dentro del rectángulo rotado del objeto (con tolerancia)? */
export function pointInObject(p: Position, obj: WorldObject, tolerance = HIT_TOLERANCE): boolean {
  const corners = obbCorners(
    obj.position,
    obj.dimensions.width + tolerance * 2,
    obj.dimensions.depth + tolerance * 2,
    obj.rotation,
  )
  let inside = false
  // Ray casting sobre el polígono de 4 esquinas.
  for (let i = 0, j = 3; i < 4; j = i++) {
    const a = corners[i]!
    const b = corners[j]!
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Hit-test top-down: el objeto más reciente (dibujado encima) que contenga
 * el punto; si ninguno, la zona más reciente que lo contenga.
 */
export function hitTest(doc: EditorDocument, p: Position, tolerance = HIT_TOLERANCE): HitTarget {
  for (let i = doc.scenario.objects.length - 1; i >= 0; i--) {
    const obj = doc.scenario.objects[i]!
    if (pointInObject(p, obj, tolerance)) return { kind: 'object', id: obj.id }
  }
  for (let i = doc.scenario.zones.length - 1; i >= 0; i--) {
    const zone = doc.scenario.zones[i]!
    const { min, max } = zone.bounds
    if (p.x >= min.x && p.x <= max.x && p.y >= min.y && p.y <= max.y) {
      return { kind: 'zone', id: zone.id }
    }
  }
  return null
}

/** Extremos del segmento de un muro (inicio/fin según su rotación). */
export function wallEndpoints(wall: WorldObject): { start: Position; end: Position } {
  const rad = (wall.rotation * Math.PI) / 180
  const half = wall.dimensions.width / 2
  const dx = Math.cos(rad) * half
  const dy = Math.sin(rad) * half
  return {
    start: { x: wall.position.x - dx, y: wall.position.y - dy },
    end: { x: wall.position.x + dx, y: wall.position.y + dy },
  }
}

/** Radio máximo de búsqueda de muro para colocar puertas/ventanas. */
export const WALL_ATTACH_RADIUS = 0.6

export interface WallAttachment {
  readonly wall: WorldObject
  /** Punto proyectado sobre la línea del muro. */
  readonly point: Position
  /** Parámetro t ∈ [0,1] del punto sobre el segmento. */
  readonly t: number
  /** Distancia del clic a la línea del muro. */
  readonly distance: number
}

/**
 * Busca el muro más cercano a `p` dentro de `WALL_ATTACH_RADIUS` y proyecta
 * el punto sobre su segmento (prompt 03.2: puertas y ventanas interactúan
 * con los muros a nivel visual).
 */
export function findWallUnder(
  objects: readonly WorldObject[],
  p: Position,
  radius = WALL_ATTACH_RADIUS,
): WallAttachment | null {
  let best: WallAttachment | null = null
  for (const wall of objects) {
    if (wall.kind !== 'wall') continue
    const { start, end } = wallEndpoints(wall)
    const projected = closestPointOnSegment(p, start, end)
    const d = distance(p, projected)
    if (d <= radius && (best === null || d < best.distance)) {
      best = { wall, point: projected, t: projectOnSegment(p, start, end), distance: d }
    }
  }
  return best
}

/**
 * Calcula la posición de una apertura (puerta/ventana) sobre un muro:
 * hereda la rotación del muro y se desplaza para que el hueco completo
 * quede dentro del tramo (clamp). Devuelve null si el muro es demasiado
 * corto para el hueco.
 */
export function openingPlacementOnWall(
  wall: WorldObject,
  desiredPoint: Position,
  openingWidth: number,
): { position: Position; rotation: number } | null {
  const length = wall.dimensions.width
  if (openingWidth > length) return null
  const { start } = wallEndpoints(wall)
  const rad = (wall.rotation * Math.PI) / 180
  const dir = { x: Math.cos(rad), y: Math.sin(rad) }
  // Distancia con signo del punto deseado a lo largo del muro desde start.
  const along = (desiredPoint.x - start.x) * dir.x + (desiredPoint.y - start.y) * dir.y
  // Clamp para que [along, along + width] quede dentro de [0, length]...
  // como la apertura se centra en desiredPoint: centro ∈ [width/2, length - width/2].
  const center = Math.min(length - openingWidth / 2, Math.max(openingWidth / 2, along))
  return {
    position: {
      x: start.x + dir.x * center,
      y: start.y + dir.y * center,
    },
    rotation: wall.rotation,
  }
}
