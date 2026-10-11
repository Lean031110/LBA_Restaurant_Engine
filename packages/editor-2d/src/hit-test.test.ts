import { describe, expect, it } from 'vitest'
import { WorldObjectSchema, ZoneIdSchema } from '@lba/domain'
import type { WorldObject } from '@lba/domain'
import { getObjectPreset } from '@lba/asset-catalog'
import { createEmptyDocument } from './document'
import { instantiateObject } from './instantiate'
import {
  findWallUnder,
  hitTest,
  openingPlacementOnWall,
  pointInObject,
  wallEndpoints,
} from './hit-test'
import type { EditorDocument } from './types'

function muro(id: string, x: number, y: number, length: number, rotation: number): WorldObject {
  const preset = getObjectPreset('cat_wall-interior-100')!
  const obj = instantiateObject(preset, createEmptyDocument().scenario, {
    position: { x, y },
    rotation: rotation as never,
    wallLength: length,
  })
  return WorldObjectSchema.parse({ ...obj, id })
}

function mesa(id: string, x: number, y: number): WorldObject {
  const preset = getObjectPreset('cat_table-round-4')!
  const obj = instantiateObject(preset, createEmptyDocument().scenario, {
    position: { x, y },
    rotation: 0,
  })
  return WorldObjectSchema.parse({ ...obj, id })
}

describe('hit-testing', () => {
  it('detecta el objeto bajo el punto (el más reciente gana)', () => {
    const doc: EditorDocument = {
      ...createEmptyDocument(),
      scenario: {
        ...createEmptyDocument().scenario,
        objects: [mesa('obj_mesa-abajo', 2, 2), mesa('obj_mesa-arriba', 2, 2)],
      },
    }
    const hit = hitTest(doc, { x: 2, y: 2 })
    expect(hit).toEqual({ kind: 'object', id: 'obj_mesa-arriba' })
  })

  it('los objetos rotados usan su huella rotada', () => {
    const doc: EditorDocument = {
      ...createEmptyDocument(),
      scenario: {
        ...createEmptyDocument().scenario,
        objects: [mesa('obj_mesa-a', 0, 0)],
      },
    }
    const obj = doc.scenario.objects[0]!
    const rotated = WorldObjectSchema.parse({ ...obj, rotation: 45 })
    const docRot: EditorDocument = {
      ...doc,
      scenario: { ...doc.scenario, objects: [rotated] },
    }
    // Punto que solo está dentro cuando la huella gira 45° (rombo de medio ancho ~0.78).
    const corner = { x: 0.7, y: 0.05 }
    expect(pointInObject(corner, rotated)).toBe(true)
    expect(pointInObject(corner, obj)).toBe(false)
    expect(hitTest(docRot, corner)).toEqual({ kind: 'object', id: 'obj_mesa-a' })
  })

  it('detecta zonas cuando no hay objetos bajo el punto', () => {
    const base = createEmptyDocument()
    const doc: EditorDocument = {
      ...base,
      scenario: {
        ...base.scenario,
        zones: [
          {
            id: ZoneIdSchema.parse('zone_salon'),
            name: 'Salón',
            category: 'dining',
            bounds: { min: { x: 0, y: 0 }, max: { x: 6, y: 5 } },
            allowedRoles: [],
            accessRules: [],
          },
        ],
      },
    }
    expect(hitTest(doc, { x: 3, y: 2.5 })).toEqual({
      kind: 'zone',
      id: ZoneIdSchema.parse('zone_salon'),
    })
    expect(hitTest(doc, { x: 9, y: 9 })).toBeNull()
  })
})

describe('adjunto de aperturas a muros', () => {
  it('wallEndpoints calcula los extremos del tramo', () => {
    const wall = muro('obj_muro-a', 2, 0, 4, 0)
    expect(wallEndpoints(wall)).toEqual({
      start: { x: 0, y: 0 },
      end: { x: 4, y: 0 },
    })
  })

  it('findWallUnder encuentra el muro más cercano dentro del radio', () => {
    const wall = muro('obj_muro-a', 2, 3, 4, 0)
    const found = findWallUnder([wall], { x: 2, y: 3.4 })
    expect(found).not.toBeNull()
    expect(found!.wall.id).toBe('obj_muro-a')
    expect(found!.point).toEqual({ x: 2, y: 3 })

    expect(findWallUnder([wall], { x: 2, y: 5 })).toBeNull()
  })

  it('openingPlacementOnWall proyecta y acota el hueco dentro del tramo', () => {
    const wall = muro('obj_muro-a', 2, 0, 4, 0) // tramo (0,0)-(4,0)
    // Clic cerca del inicio: la puerta de 0.9 se centra con clamp (mín 0.45).
    const nearStart = openingPlacementOnWall(wall, { x: 0.1, y: 0.05 }, 0.9)
    expect(nearStart).toEqual({ position: { x: 0.45, y: 0 }, rotation: 0 })
    // Clic cerca del final: clamp al otro extremo.
    const nearEnd = openingPlacementOnWall(wall, { x: 3.95, y: 0 }, 0.9)
    expect(nearEnd).toEqual({ position: { x: 3.55, y: 0 }, rotation: 0 })
    // Hueco mayor que el muro: imposible.
    expect(openingPlacementOnWall(wall, { x: 2, y: 0 }, 5)).toBeNull()
  })

  it('la apertura hereda la rotación del muro', () => {
    const wall = muro('obj_muro-a', 0, 0, 4, 90)
    const placement = openingPlacementOnWall(wall, { x: 0.1, y: 2 }, 0.9)
    expect(placement!.rotation).toBe(90)
  })
})
