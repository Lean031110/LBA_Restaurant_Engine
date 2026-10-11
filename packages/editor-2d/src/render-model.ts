import type { WorldObjectId, WorldObject } from '@lba/domain'
import type { EditorState } from './types'
import { marqueeRect } from './types'
import { add, sub, subtractSpans } from './geometry'

/**
 * Modelo de render (prompt 03.1/03.2): proyección del estado del editor a
 * primitivas dibujables. ES PURO: apps/web solo mapea estas primitivas a
 * formas de Konva; toda la geometría y las decisiones visuales (cortes de
 * muro por aperturas, arcos de puerta, marcas de ventana, resaltes de
 * selección) se deciden y prueban aquí.
 */

/** Color de resalte de solapamiento (advertencia, no error). */
export const OVERLAP_COLOR = '#c0392b'

/** Tramo sólido de un muro tras restar los huecos de aperturas. */
export interface WallSegmentPrimitive {
  readonly kind: 'wall-segment'
  readonly wallId: string
  /** Centro del tramo en mundo. */
  readonly center: { x: number; y: number }
  readonly rotation: number
  readonly length: number
  readonly thickness: number
  readonly color: string
}

/** Puerta: hoja + arco de apertura (batiente) u hojas deslizantes. */
export interface DoorPrimitive {
  readonly kind: 'door'
  readonly id: string
  readonly position: { x: number; y: number }
  readonly rotation: number
  readonly width: number
  readonly thickness: number
  readonly color: string
  readonly doorType: 'swing' | 'sliding'
  readonly hinge: 'left' | 'right'
  readonly opening: 'a' | 'b'
  readonly slide: 'left' | 'right'
}

/** Ventana: hueco con doble línea en la dirección del muro. */
export interface WindowPrimitive {
  readonly kind: 'window'
  readonly id: string
  readonly position: { x: number; y: number }
  readonly rotation: number
  readonly width: number
  readonly thickness: number
  readonly color: string
}

/** Objeto genérico (mueble/equipo/estación/salida/otros). */
export interface ObjectPrimitive {
  readonly kind: 'object'
  readonly id: string
  readonly position: { x: number; y: number }
  readonly rotation: number
  readonly width: number
  readonly depth: number
  readonly color: string
  readonly name: string | null
  readonly selected: boolean
  readonly overlapping: boolean
}

/** Zona funcional con etiqueta visible. */
export interface ZonePrimitive {
  readonly kind: 'zone'
  readonly id: string
  readonly min: { x: number; y: number }
  readonly max: { x: number; y: number }
  readonly name: string
  readonly category: string
  readonly selected: boolean
}

/** Modelo de render completo de un estado. */
export interface RenderModel {
  readonly zones: readonly ZonePrimitive[]
  readonly wallSegments: readonly WallSegmentPrimitive[]
  readonly doors: readonly DoorPrimitive[]
  readonly windows: readonly WindowPrimitive[]
  readonly objects: readonly ObjectPrimitive[]
  /** Borrador de pared en curso (vista previa). */
  readonly wallDraft: {
    readonly start: { x: number; y: number }
    readonly end: { x: number; y: number }
    readonly thickness: number
  } | null
  /** Borrador de zona en curso. */
  readonly zoneDraft: {
    readonly min: { x: number; y: number }
    readonly max: { x: number; y: number }
  } | null
  /** Medición en curso: segmento con la distancia. */
  readonly measure: {
    readonly start: { x: number; y: number }
    readonly end: { x: number; y: number }
  } | null
  /** Banda de selección en curso (rectángulo normalizado). */
  readonly marquee: {
    readonly min: { x: number; y: number }
    readonly max: { x: number; y: number }
  } | null
  /** Desplazamiento visual de los objetos seleccionados durante un arrastre. */
  readonly moveDelta: { readonly x: number; readonly y: number } | null
}

function prop(obj: WorldObject, key: string): string | undefined {
  const v = obj.properties[key]
  return typeof v === 'string' ? v : undefined
}

/**
 * Aperturas (puertas/ventanas) colocadas sobre un muro: collineales con el
 * tramo y dentro de él. Se usa para «cortar» visualmente el muro.
 */
function openingsOnWall(
  wall: WorldObject,
  objects: readonly WorldObject[],
): { start: number; end: number }[] {
  const rad = (wall.rotation * Math.PI) / 180
  const dir = { x: Math.cos(rad), y: Math.sin(rad) }
  const half = wall.dimensions.width / 2
  const spans: { start: number; end: number }[] = []
  for (const o of objects) {
    if (o.kind !== 'door' && o.kind !== 'window') continue
    // Misma dirección (paralelo) y centro dentro de la banda del muro.
    const angleDiff = Math.abs(((o.rotation - wall.rotation) % 180) + 180) % 180
    if (angleDiff > 5 && angleDiff < 175) continue
    const dx = o.position.x - wall.position.x
    const dy = o.position.y - wall.position.y
    const along = dx * dir.x + dy * dir.y
    const offset = Math.abs(-dx * dir.y + dy * dir.x)
    if (offset > wall.dimensions.depth / 2 + o.dimensions.depth) continue
    const w = o.dimensions.width / 2
    if (along + w <= -half || along - w >= half) continue
    spans.push({ start: along - w + half, end: along + w + half })
  }
  return spans
}

/** Construye el modelo de render completo a partir del estado. */
export function buildRenderModel(state: EditorState): RenderModel {
  const { scenario } = state.document
  const selectedObjects = new Set<string>(state.document.selection.objectIds)
  const selectedZones = new Set<string>(state.document.selection.zoneIds)
  const overlapping = new Set<string>(state.overlappingObjectIds)

  const dragOf = (id: string) => moveDeltaFor(state, id)
  const zones: ZonePrimitive[] = scenario.zones.map((z) => {
    const drag = state.moveDrag && selectedZones.has(z.id) ? dragOf(z.id) : null
    return {
      kind: 'zone',
      id: z.id,
      min: drag ? add(z.bounds.min, drag) : z.bounds.min,
      max: drag ? add(z.bounds.max, drag) : z.bounds.max,
      name: z.name,
      category: z.category,
      selected: selectedZones.has(z.id),
    }
  })

  const walls = scenario.objects.filter((o) => o.kind === 'wall')
  const wallSegments: WallSegmentPrimitive[] = []
  const doors: DoorPrimitive[] = []
  const windows: WindowPrimitive[] = []
  const objects: ObjectPrimitive[] = []

  for (const wall of walls) {
    const spans = openingsOnWall(wall, scenario.objects)
    const solid = subtractSpans(wall.dimensions.width, spans)
    const drag = dragOf(wall.id)
    const wallCenter = drag ? add(wall.position, drag) : wall.position
    for (const seg of solid) {
      const rad = (wall.rotation * Math.PI) / 180
      const midAlong = (seg.start + seg.end) / 2 - wall.dimensions.width / 2
      wallSegments.push({
        kind: 'wall-segment',
        wallId: wall.id,
        center: {
          x: wallCenter.x + Math.cos(rad) * midAlong,
          y: wallCenter.y + Math.sin(rad) * midAlong,
        },
        rotation: wall.rotation,
        length: seg.end - seg.start,
        thickness: wall.dimensions.depth,
        color: wall.color ?? '#9aa0a6',
      })
    }
  }

  for (const o of scenario.objects) {
    const selected = selectedObjects.has(o.id)
    if (o.kind === 'door') {
      const drag = dragOf(o.id)
      doors.push({
        kind: 'door',
        id: o.id,
        position: drag ? add(o.position, drag) : o.position,
        rotation: o.rotation,
        width: o.dimensions.width,
        thickness: o.dimensions.depth,
        color: o.color ?? '#8b5a2b',
        doorType: o.doorType ?? 'swing',
        hinge: prop(o, 'hinge') === 'right' ? 'right' : 'left',
        opening: prop(o, 'opening') === 'b' ? 'b' : 'a',
        slide: prop(o, 'slide') === 'left' ? 'left' : 'right',
      })
      continue
    }
    if (o.kind === 'window') {
      const drag = dragOf(o.id)
      windows.push({
        kind: 'window',
        id: o.id,
        position: drag ? add(o.position, drag) : o.position,
        rotation: o.rotation,
        width: o.dimensions.width,
        thickness: o.dimensions.depth,
        color: o.color ?? '#7fb3d5',
      })
      continue
    }
    if (o.kind === 'wall') continue
    const dragged = moveDeltaFor(state, o.id)
    objects.push({
      kind: 'object',
      id: o.id,
      position: dragged ? { x: o.position.x + dragged.x, y: o.position.y + dragged.y } : o.position,
      rotation: o.rotation,
      width: o.dimensions.width,
      depth: o.dimensions.depth,
      color: o.color ?? '#bdc3c7',
      name: o.name ?? null,
      selected,
      overlapping: overlapping.has(o.id),
    })
  }

  const wallDraft = state.draft?.kind === 'wall' ? draftWall(state) : null
  const zoneDraft =
    state.draft?.kind === 'zone'
      ? {
          min: {
            x: Math.min(state.draft.start.x, state.draft.current.x),
            y: Math.min(state.draft.start.y, state.draft.current.y),
          },
          max: {
            x: Math.max(state.draft.start.x, state.draft.current.x),
            y: Math.max(state.draft.start.y, state.draft.current.y),
          },
        }
      : null

  const marquee = state.marquee ? marqueeRect(state.marquee) : null
  return {
    zones,
    wallSegments,
    doors,
    windows,
    objects,
    wallDraft,
    zoneDraft,
    measure: state.measure ? { start: state.measure.start, end: state.measure.current } : null,
    marquee,
    moveDelta: state.moveDrag ? sub(state.moveDrag.current, state.moveDrag.start) : null,
  }
}

/** Desplazamiento visual durante un arrastre: solo objetos seleccionados. */
function moveDeltaFor(state: EditorState, objectId: string): { x: number; y: number } | null {
  if (!state.moveDrag) return null
  if (!state.document.selection.objectIds.includes(objectId as WorldObjectId)) return null
  return sub(state.moveDrag.current, state.moveDrag.start)
}

/** Vista previa del borrador de pared (el espesor viaja en el propio borrador). */
function draftWall(state: EditorState): RenderModel['wallDraft'] {
  const draft = state.draft
  if (draft?.kind !== 'wall') return null
  return { start: draft.start, end: draft.current, thickness: draft.thickness }
}
