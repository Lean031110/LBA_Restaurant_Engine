import type { Position, WorldObject } from '@lba/domain'
import { angleOf, sub } from './geometry'
import type { GridConfig } from './types'

/**
 * Ajuste (snap) del editor: cuadrícula, ángulos y puntos finales de muros
 * existentes. El snap NUNCA produce saltos inesperados: el borrador en vivo
 * muestra SIEMPRE el resultado ajustado que se obtendrá al soltar (03.3),
 * y el ajuste solo se aplica al confirmar el punto final.
 */

/** Ajusta un punto a la cuadrícula (si el snap está activo). */
export function snapPoint(p: Position, grid: GridConfig): Position {
  if (!grid.snapEnabled || grid.size <= 0) return p
  return {
    x: Math.round(p.x / grid.size) * grid.size,
    y: Math.round(p.y / grid.size) * grid.size,
  }
}

/** Ajusta un ángulo en grados al paso configurado (si el snap está activo). */
export function snapAngle(degrees: number, grid: GridConfig): number {
  if (!grid.snapEnabled || grid.angleSnapDeg <= 0) return degrees
  const step = grid.angleSnapDeg
  return Math.round(degrees / step) * step
}

/** Radio máximo del imán hacia puntos finales de muros existentes. */
export const ENDPOINT_MAGNET_RADIUS = 0.35

/** Extremos de un muro según su centro, longitud y rotación. */
function wallTip(wall: WorldObject): { a: Position; b: Position } {
  const rad = (wall.rotation * Math.PI) / 180
  const half = wall.dimensions.width / 2
  const dx = Math.cos(rad) * half
  const dy = Math.sin(rad) * half
  return {
    a: { x: wall.position.x - dx, y: wall.position.y - dy },
    b: { x: wall.position.x + dx, y: wall.position.y + dy },
  }
}

/**
 * Imán hacia extremos de muros existentes: si `p` está a menos de
 * `radius` del extremo de un muro, devuelve ese extremo (el más cercano).
 * Permite encadenar muros con exactitud.
 */
export function snapToWallEndpoints(
  p: Position,
  walls: readonly WorldObject[],
  radius = ENDPOINT_MAGNET_RADIUS,
): Position | null {
  let best: Position | null = null
  let bestDist = radius
  for (const wall of walls) {
    for (const endpoint of [wallTip(wall).a, wallTip(wall).b]) {
      const d = Math.hypot(endpoint.x - p.x, endpoint.y - p.y)
      if (d <= bestDist) {
        best = endpoint
        bestDist = d
      }
    }
  }
  return best
}

/**
 * Resultado del ajuste del extremo de una pared en curso.
 */
export interface WallSnap {
  /** Punto final ajustado. */
  readonly end: Position
  /** Ángulo final en grados [0, 360). */
  readonly angleDeg: number
  /** Longitud final del tramo. */
  readonly length: number
  /** El extremo quedó enganchado al extremo de otro muro. */
  readonly magnet: boolean
}

/**
 * Ajusta el segundo punto de una pared en curso. Prioridad:
 * 1. Imán a extremos de muros existentes (encadenado exacto, ángulo libre).
 * 2. Con snap activo: ángulo al paso configurado y longitud a múltiplos de
 *    la celda; el extremo se recalcula desde el inicio con ambos ajustes
 *    (sin saltos: lo que se ve es lo que se obtiene).
 * 3. Sin snap: punto exacto del cursor.
 */
export function snapWallEnd(
  start: Position,
  rawEnd: Position,
  walls: readonly WorldObject[],
  grid: GridConfig,
): WallSnap {
  const magnet = snapToWallEndpoints(rawEnd, walls)
  if (magnet !== null) {
    const v = sub(magnet, start)
    return { end: magnet, angleDeg: angleOf(v), length: Math.hypot(v.x, v.y), magnet: true }
  }
  if (!grid.snapEnabled) {
    const v = sub(rawEnd, start)
    return { end: rawEnd, angleDeg: angleOf(v), length: Math.hypot(v.x, v.y), magnet: false }
  }
  const v = sub(rawEnd, start)
  const rawLength = Math.hypot(v.x, v.y)
  const angle = snapAngle(angleOf(v), grid)
  const length = Math.round(rawLength / grid.size) * grid.size
  const rad = (angle * Math.PI) / 180
  const end = {
    x: start.x + Math.cos(rad) * length,
    y: start.y + Math.sin(rad) * length,
  }
  return { end, angleDeg: angle, length, magnet: false }
}
