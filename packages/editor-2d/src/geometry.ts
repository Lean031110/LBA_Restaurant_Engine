import type { Position } from '@lba/domain'

/**
 * Geometría 2D del editor en unidades del mundo. Funciones puras usadas por
 * las herramientas (paredes, adjuntos de puertas/ventanas), la detección de
 * solapamientos (03.3) y el modelo de render. Ninguna función conoce píxeles.
 */

const DEG_TO_RAD = Math.PI / 180

/** Suma de puntos. */
export function add(a: Position, b: Position): Position {
  return { x: a.x + b.x, y: a.y + b.y }
}

/** Resta de puntos (b − a da el vector de a hacia b). */
export function sub(a: Position, b: Position): Position {
  return { x: a.x - b.x, y: a.y - b.y }
}

/** Multiplicación por escalar. */
export function scale(p: Position, k: number): Position {
  return { x: p.x * k, y: p.y * k }
}

/** Rota un punto alrededor del origen (grados, sentido horario en pantalla). */
export function rotatePoint(p: Position, degrees: number): Position {
  const rad = degrees * DEG_TO_RAD
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  return { x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos }
}

/** Rota un punto alrededor de un centro arbitrario. */
export function rotateAround(p: Position, center: Position, degrees: number): Position {
  return add(center, rotatePoint(sub(p, center), degrees))
}

/** Producto escalar. */
export function dot(a: Position, b: Position): number {
  return a.x * b.x + a.y * b.y
}

/** Norma al cuadrado. */
export function lengthSq(v: Position): number {
  return v.x * v.x + v.y * v.y
}

/** Norma (longitud del vector). */
export function length(v: Position): number {
  return Math.sqrt(lengthSq(v))
}

/** Distancia entre dos puntos. */
export function distance(a: Position, b: Position): number {
  return length(sub(a, b))
}

/** Ángulo de un vector en grados [0, 360). */
export function angleOf(v: Position): number {
  const deg = (Math.atan2(v.y, v.x) * 180) / Math.PI
  const wrapped = deg % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

/**
 * Proyección escalar de un punto sobre un segmento [a, b]: valor t en
 * [0, 1] del punto más cercano. Si el segmento es degenerado devuelve 0.
 */
export function projectOnSegment(p: Position, a: Position, b: Position): number {
  const ab = sub(b, a)
  const denom = lengthSq(ab)
  if (denom === 0) return 0
  const t = dot(sub(p, a), ab) / denom
  return Math.min(1, Math.max(0, t))
}

/** Punto más cercano de un segmento [a, b] a un punto p. */
export function closestPointOnSegment(p: Position, a: Position, b: Position): Position {
  const t = projectOnSegment(p, a, b)
  return add(a, scale(sub(b, a), t))
}

/** Caja alineada con ejes (AABB) definida por sus esquinas min/max. */
export interface Aabb {
  readonly minX: number
  readonly minY: number
  readonly maxX: number
  readonly maxY: number
}

/** AABB de un rectángulo rotado (conservador: la caja que lo contiene). */
export function rotatedRectAabb(
  center: Position,
  width: number,
  depth: number,
  rotationDeg: number,
): Aabb {
  const hw = width / 2
  const hd = depth / 2
  const corners: Position[] = [
    { x: -hw, y: -hd },
    { x: hw, y: -hd },
    { x: hw, y: hd },
    { x: -hw, y: hd },
  ].map((c) => add(center, rotatePoint(c, rotationDeg)))
  const xs = corners.map((c) => c.x)
  const ys = corners.map((c) => c.y)
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  }
}

/** ¿Se intersecan dos AABB (con tolerancia inclusiva)? */
export function aabbIntersects(a: Aabb, b: Aabb, tolerance = 0): boolean {
  return (
    a.minX <= b.maxX + tolerance &&
    a.maxX >= b.minX - tolerance &&
    a.minY <= b.maxY + tolerance &&
    a.maxY >= b.minY - tolerance
  )
}

/** Esquinas de un rectángulo rotado (centro, ancho, fondo, rotación). */
export function obbCorners(
  center: Position,
  width: number,
  depth: number,
  rotationDeg: number,
): [Position, Position, Position, Position] {
  const hw = width / 2
  const hd = depth / 2
  const local: [Position, Position, Position, Position] = [
    { x: -hw, y: -hd },
    { x: hw, y: -hd },
    { x: hw, y: hd },
    { x: -hw, y: hd },
  ]
  return local.map((c) => add(center, rotatePoint(c, rotationDeg))) as [
    Position,
    Position,
    Position,
    Position,
  ]
}

/**
 * ¿Se solapan dos rectángulos rotados (OBB)? Separating Axis Theorem sobre
 * los 4 ejes candidatos. Es una comprobación GEOMÉTRICA de huella: el editor
 * representa geometría y NO afirma que las colisiones arquitectónicas sean
 * físicamente correctas (prompt 03.3).
 */
export function obbIntersects(
  a: { center: Position; width: number; depth: number; rotation: number },
  b: { center: Position; width: number; depth: number; rotation: number },
): boolean {
  const boxA = obbCorners(a.center, a.width, a.depth, a.rotation)
  const boxB = obbCorners(b.center, b.width, b.depth, b.rotation)
  const axes: Position[] = []
  // Ejes de A y B (normales de las aristas): 0-1, 1-2 de cada caja.
  for (const [box, i] of [
    [boxA, 0] as const,
    [boxA, 1] as const,
    [boxB, 0] as const,
    [boxB, 1] as const,
  ]) {
    const edge = sub(box[(i + 1) % 4]!, box[i]!)
    const len = length(edge)
    if (len === 0) continue
    axes.push({ x: -edge.y / len, y: edge.x / len })
  }
  for (const axis of axes) {
    const pa = projectRange(boxA, axis)
    const pb = projectRange(boxB, axis)
    if (pa.max < pb.min || pb.max < pa.min) return false
  }
  return true
}

/** Rango de proyección de un polígono sobre un eje unitario. */
function projectRange(points: readonly Position[], axis: Position): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const p of points) {
    const d = dot(p, axis)
    if (d < min) min = d
    if (d > max) max = d
  }
  return { min, max }
}

/**
 * Divide un segmento [0, length] excluyendo los huecos de aperturas
 * (puertas/ventanas) ordenados; devuelve los tramos sólidos restantes.
 * Usado por el modelo de render para «cortar» muros visualmente.
 */
export function subtractSpans(
  length: number,
  spans: readonly { start: number; end: number }[],
): { start: number; end: number }[] {
  const sorted = [...spans]
    .map((s) => ({ start: Math.max(0, s.start), end: Math.min(length, s.end) }))
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start)
  const solid: { start: number; end: number }[] = []
  let cursor = 0
  for (const span of sorted) {
    if (span.start > cursor) solid.push({ start: cursor, end: span.start })
    cursor = Math.max(cursor, span.end)
  }
  if (cursor < length) solid.push({ start: cursor, end: length })
  return solid
}
