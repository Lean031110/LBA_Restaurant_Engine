import { describe, expect, it } from 'vitest'
import { getObjectPreset } from '@lba/asset-catalog'
import type { WorldObject, Zone } from '@lba/domain'
import { WorldObjectIdSchema, WorldObjectSchema, ZoneIdSchema } from '@lba/domain'
import { createEmptyDocument, emptyScenario, isScenarioValid, withScenario } from './document'
import * as cmd from './commands'
import { instantiateObject } from './instantiate'
import type { EditorDocument } from './types'
import { EMPTY_SELECTION } from './types'

/** ID de objeto tipado desde cadena (los IDs del dominio van marcados). */
const oid = (s: string) => WorldObjectIdSchema.parse(s)
const zid = (s: string) => ZoneIdSchema.parse(s)

/** Mesa del catálogo con id explícito para las pruebas de comandos. */
function mesa(id: string, x: number, y: number): WorldObject {
  const preset = getObjectPreset('cat_table-round-4')!
  const obj = instantiateObject(preset, emptyScenario(), { position: { x, y }, rotation: 0 })
  return WorldObjectSchema.parse({ ...obj, id })
}

/** Zona mínima válida. */
function salon(): Zone {
  return {
    id: zid('zone_salon'),
    name: 'Salón',
    category: 'dining',
    bounds: { min: { x: 0, y: 0 }, max: { x: 6, y: 5 } },
    allowedRoles: [],
    accessRules: [],
  }
}

/** Muro con id explícito. */
function muro(id: string, length: number): WorldObject {
  const preset = getObjectPreset('cat_wall-interior-100')!
  const obj = instantiateObject(preset, emptyScenario(), {
    position: { x: 0, y: 0 },
    rotation: 0,
    wallLength: length,
  })
  return WorldObjectSchema.parse({ ...obj, id })
}

function docWith(objects: WorldObject[]): EditorDocument {
  const base = createEmptyDocument()
  return { ...base, scenario: { ...base.scenario, objects } }
}

describe('comandos de documento', () => {
  it('addObject añade y selecciona el objeto nuevo', () => {
    const doc = createEmptyDocument()
    const result = cmd.addObject(doc, mesa('obj_mesa-a', 1, 1))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.document.scenario.objects).toHaveLength(1)
    expect(result.document.selection.objectIds).toEqual([oid('obj_mesa-a')])
  })

  it('addObject rechaza IDs duplicados sin tocar el documento', () => {
    const doc = docWith([mesa('obj_mesa-a', 1, 1)])
    const result = cmd.addObject(doc, mesa('obj_mesa-a', 2, 2))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('duplicado')
  })

  it('updateObject aplica parches válidos y rechaza los inválidos (dimensión 0)', () => {
    const doc = docWith([mesa('obj_mesa-a', 1, 1)])
    const okResult = cmd.updateObject(doc, oid('obj_mesa-a'), { name: 'Mesa ventana 4' })
    expect(okResult.ok).toBe(true)

    const bad = cmd.updateObject(doc, oid('obj_mesa-a'), {
      dimensions: { width: 0, depth: 0.8 },
    })
    expect(bad.ok).toBe(false)
    if (bad.ok) return
    expect(bad.error).toContain('No se aplicó el cambio')
  })

  it('updateObject rechaza rotación fuera de [0,360) y nombre vacío', () => {
    const doc = docWith([mesa('obj_mesa-a', 1, 1)])
    expect(cmd.updateObject(doc, oid('obj_mesa-a'), { rotation: 370 }).ok).toBe(false)
    expect(cmd.updateObject(doc, oid('obj_mesa-a'), { rotation: -5 }).ok).toBe(false)
    expect(cmd.updateObject(doc, oid('obj_mesa-a'), { name: '' }).ok).toBe(false)
  })

  it('updateObject rechaza convertir a puerta sin doorType (regla del dominio)', () => {
    const doc = docWith([mesa('obj_mesa-a', 1, 1)])
    const bad = cmd.updateObject(doc, oid('obj_mesa-a'), { kind: 'door' })
    expect(bad.ok).toBe(false)
    if (bad.ok) return
    expect(bad.error).toContain('doorType')
  })

  it('updateWallLength cambia dimensions.width (convención de longitud del catálogo)', () => {
    const doc = docWith([muro('obj_muro-a', 3)])
    const result = cmd.updateWallLength(doc, oid('obj_muro-a'), 7.25)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.document.scenario.objects[0]!.dimensions.width).toBe(7.25)
  })

  it('moveObjects traslada posición y punto de interacción', () => {
    const doc = docWith([mesa('obj_mesa-a', 1, 1)])
    const before = doc.scenario.objects[0]!
    const result = cmd.moveObjects(doc, [oid('obj_mesa-a')], { x: 0.5, y: -0.25 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const moved = result.document.scenario.objects[0]!
    expect(moved.position).toEqual({ x: 1.5, y: 0.75 })
    expect(moved.interactionPoint.x).toBeCloseTo(before.interactionPoint.x + 0.5, 10)
    expect(moved.interactionPoint.y).toBeCloseTo(before.interactionPoint.y - 0.25, 10)
  })

  it('moveElements traslada objetos y zonas en un único comando', () => {
    const base = createEmptyDocument()
    const withObj = cmd.addObject(base, mesa('obj_mesa-a', 1, 1))
    expect(withObj.ok).toBe(true)
    if (!withObj.ok) return
    const withZone = cmd.addZone(withObj.document, salon())
    expect(withZone.ok).toBe(true)
    if (!withZone.ok) return
    const result = cmd.moveElements(withZone.document, [oid('obj_mesa-a')], [zid('zone_salon')], {
      x: 1,
      y: 1,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.document.scenario.objects[0]!.position).toEqual({ x: 2, y: 2 })
    expect(result.document.scenario.zones[0]!.bounds).toEqual({
      min: { x: 1, y: 1 },
      max: { x: 7, y: 6 },
    })
  })

  it('rotateObjects rota en sitio y arrastra el punto de interacción', () => {
    const doc = docWith([mesa('obj_mesa-a', 0, 0)])
    const before = doc.scenario.objects[0]!
    const result = cmd.rotateObjects(doc, [oid('obj_mesa-a')], 90)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const after = result.document.scenario.objects[0]!
    expect(after.rotation).toBe(90)
    expect(after.interactionPoint.x).toBeCloseTo(-before.interactionPoint.y, 10)
    expect(after.interactionPoint.y).toBeCloseTo(before.interactionPoint.x, 10)
  })

  it('deleteElements borra objetos y zonas y limpia la selección', () => {
    const doc = docWith([mesa('obj_mesa-a', 1, 1), mesa('obj_mesa-b', 2, 2)])
    const selected: EditorDocument = {
      ...doc,
      selection: { objectIds: [oid('obj_mesa-a'), oid('obj_mesa-b')], zoneIds: [] },
    }
    const result = cmd.deleteElements(selected, [oid('obj_mesa-a'), oid('obj_mesa-b')], [])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.document.scenario.objects).toHaveLength(0)
    expect(result.document.selection).toEqual(EMPTY_SELECTION)
  })

  it('duplicateObjects clona con IDs nuevos y desplazamiento', () => {
    const doc = docWith([mesa('obj_mesa-a', 1, 1)])
    const result = cmd.duplicateObjects(doc, [oid('obj_mesa-a')], { x: 0.5, y: 0.5 }, [
      oid('obj_mesa-copia'),
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.document.scenario.objects).toHaveLength(2)
    expect(result.document.scenario.objects[1]!.id).toBe(oid('obj_mesa-copia'))
    expect(result.document.scenario.objects[1]!.position).toEqual({ x: 1.5, y: 1.5 })
    expect(result.document.selection.objectIds).toEqual([oid('obj_mesa-copia')])
  })

  it('assignZone asigna y desasigna la zona (clave omitida, no null)', () => {
    const base = createEmptyDocument()
    const withZone = cmd.addZone(base, salon())
    expect(withZone.ok).toBe(true)
    if (!withZone.ok) return
    const withObj = cmd.addObject(withZone.document, mesa('obj_mesa-a', 1, 1))
    expect(withObj.ok).toBe(true)
    if (!withObj.ok) return

    const assigned = cmd.assignZone(withObj.document, [oid('obj_mesa-a')], zid('zone_salon'))
    expect(assigned.ok).toBe(true)
    if (!assigned.ok) return
    expect(assigned.document.scenario.objects[0]!.zoneId).toBe(zid('zone_salon'))

    const unassigned = cmd.assignZone(assigned.document, [oid('obj_mesa-a')], null)
    expect(unassigned.ok).toBe(true)
    if (!unassigned.ok) return
    expect('zoneId' in unassigned.document.scenario.objects[0]!).toBe(false)
  })

  it('assignZone rechaza zonas inexistentes', () => {
    const base = cmd.addObject(createEmptyDocument(), mesa('obj_mesa-a', 1, 1))
    expect(base.ok).toBe(true)
    if (!base.ok) return
    const bad = cmd.assignZone(base.document, [oid('obj_mesa-a')], zid('zone_fantasma'))
    expect(bad.ok).toBe(false)
  })

  it('updateScenario valida el tamaño del local y la semilla', () => {
    const doc = createEmptyDocument()
    expect(cmd.updateScenario(doc, { worldSize: { width: -1, depth: 8 } }).ok).toBe(false)
    expect(cmd.updateScenario(doc, { seed: -3 }).ok).toBe(false)
    expect(cmd.updateScenario(doc, { seed: 99, name: 'Mi restaurante' }).ok).toBe(true)
  })

  it('todo documento resultante sigue pasando el esquema del dominio', () => {
    const doc = docWith([mesa('obj_mesa-a', 1, 1)])
    const moved = cmd.moveObjects(doc, [oid('obj_mesa-a')], { x: 1, y: 1 })
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    expect(isScenarioValid(moved.document.scenario)).toBe(true)
  })

  it('casos límite: ids inexistentes y argumentos vacíos fallan sin mutar', () => {
    const doc = docWith([mesa('obj_mesa-a', 1, 1)])
    expect(cmd.updateObject(doc, oid('obj_fantasma'), { name: 'x' }).ok).toBe(false)
    expect(cmd.updateWallLength(doc, oid('obj_fantasma'), 2).ok).toBe(false)
    expect(cmd.updateWallLength(doc, oid('obj_mesa-a'), 2).ok).toBe(false) // no es muro
    expect(cmd.updateZone(doc, zid('zone_fantasma'), { name: 'x' }).ok).toBe(false)
    expect(cmd.moveObjects(doc, [], { x: 1, y: 1 }).ok).toBe(false)
    expect(cmd.moveObjects(doc, [oid('obj_mesa-a')], { x: 0, y: 0 }).ok).toBe(false)
    expect(cmd.moveElements(doc, [], [], { x: 1, y: 1 }).ok).toBe(false)
    expect(cmd.deleteElements(doc, [], []).ok).toBe(false)
    expect(cmd.duplicateObjects(doc, [], { x: 1, y: 0 }, []).ok).toBe(false)
    expect(cmd.duplicateObjects(doc, [oid('obj_mesa-a')], { x: 1, y: 0 }, []).ok).toBe(false)
    expect(cmd.rotateObjects(doc, [], 90).ok).toBe(false)
    expect(cmd.assignZone(doc, [], null).ok).toBe(false)
    expect(cmd.addObject(doc, mesa('obj_mesa-a', 2, 2)).ok).toBe(false) // duplicado
    // El documento original nunca cambia en los fallos.
    expect(doc.scenario.objects).toHaveLength(1)
  })

  it('updateZone rechaza bounds invertidos (min debe ser menor que max)', () => {
    const base = cmd.addZone(createEmptyDocument(), salon())
    expect(base.ok).toBe(true)
    if (!base.ok) return
    const bad = cmd.updateZone(base.document, zid('zone_salon'), {
      bounds: { min: { x: 6, y: 5 }, max: { x: 0, y: 0 } },
    })
    expect(bad.ok).toBe(false)
  })

  it('withScenario sustituye el escenario y limpia la selección', () => {
    const doc = createEmptyDocument()
    const next = withScenario(doc, emptyScenario())
    expect(next.selection).toEqual(EMPTY_SELECTION)
  })
})
