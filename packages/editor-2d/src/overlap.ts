import type { WorldObject, WorldObjectId } from '@lba/domain'
import { obbIntersects } from './geometry'

/**
 * Advertencia de solapamiento (prompt 03.3).
 *
 * ALCANCE DECLARADO: es un aviso geométrico informativo entre huellas de
 * MOBILIARIO/EQUIPO/ESTACIÓN — el editor SOLO representa geometría y NO
 * afirma que las colisiones arquitectónicas sean físicamente correctas.
 * Muros, puertas y ventanas se excluyen porque los encuentros en T y las
 * esquinas compartidas son legítimos en un plano.
 */

/** Clases de objeto que participan en la advertencia. */
const OVERLAP_KINDS = new Set(['furniture', 'equipment', 'station', 'other', 'exit'])

/** Superficie mínima de solape real (unidades²) para evitar falsos positivos por contacto. */
const MIN_OVERLAP_AREA = 0.0005

/** Objetos cuya huella se solapa con otro objeto de mobiliario. */
export function computeOverlappingObjects(objects: readonly WorldObject[]): WorldObjectId[] {
  const candidates = objects.filter((o) => OVERLAP_KINDS.has(o.kind))
  const overlapping: WorldObjectId[] = []
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const a = candidates[i]!
      const b = candidates[j]!
      if (!boxesIntersect(a, b)) continue
      if (!overlapping.includes(a.id)) overlapping.push(a.id)
      if (!overlapping.includes(b.id)) overlapping.push(b.id)
    }
  }
  return overlapping
}

/** ¿Se solapan dos objetos (OBB) con área mínima apreciable? */
function boxesIntersect(a: WorldObject, b: WorldObject): boolean {
  if (!obbIntersects(obbOf(a), obbOf(b))) return false
  // Descarta contactos por esquina/lado: exige un solape de área mínima
  // aproximada (intersección de AABBs escalada conservadoramente).
  const overlap = aabbOverlapArea(a, b)
  return overlap >= MIN_OVERLAP_AREA
}

function obbOf(o: WorldObject) {
  return {
    center: o.position,
    width: o.dimensions.width,
    depth: o.dimensions.depth,
    rotation: o.rotation,
  }
}

/** Área de intersección de los AABB conservadores (cota superior del solape). */
function aabbOverlapArea(a: WorldObject, b: WorldObject): number {
  const radA = (a.rotation * Math.PI) / 180
  const radB = (b.rotation * Math.PI) / 180
  const extA = extent(a.position, a.dimensions, radA)
  const extB = extent(b.position, b.dimensions, radB)
  const w = Math.min(extA.maxX, extB.maxX) - Math.max(extA.minX, extB.minX)
  const h = Math.min(extA.maxY, extB.maxY) - Math.max(extA.minY, extB.minY)
  return w > 0 && h > 0 ? w * h : 0
}

function extent(
  center: { x: number; y: number },
  dims: { width: number; depth: number },
  rad: number,
): { minX: number; minY: number; maxX: number; maxY: number } {
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const ex = (dims.width * cos + dims.depth * sin) / 2
  const ey = (dims.width * sin + dims.depth * cos) / 2
  return {
    minX: center.x - ex,
    minY: center.y - ey,
    maxX: center.x + ex,
    maxY: center.y + ey,
  }
}
