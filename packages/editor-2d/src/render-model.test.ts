import { describe, expect, it } from 'vitest'
import { WorldObjectSchema, ZoneIdSchema } from '@lba/domain'
import type { WorldObject } from '@lba/domain'
import { getObjectPreset } from '@lba/asset-catalog'
import { createEmptyDocument } from './document'
import { instantiateObject } from './instantiate'
import { buildRenderModel } from './render-model'
import { EditorStore } from './store'
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

function puerta(id: string, x: number, y: number, rotation: number): WorldObject {
  const preset = getObjectPreset('cat_door-swing-wood-90')!
  const obj = instantiateObject(preset, createEmptyDocument().scenario, {
    position: { x, y },
    rotation: rotation as never,
  })
  return WorldObjectSchema.parse({ ...obj, id })
}

function ventana(id: string, x: number, y: number, rotation: number): WorldObject {
  const preset = getObjectPreset('cat_window-fixed-120')!
  const obj = instantiateObject(preset, createEmptyDocument().scenario, {
    position: { x, y },
    rotation: rotation as never,
  })
  return WorldObjectSchema.parse({ ...obj, id })
}

describe('modelo de render: muros con aperturas', () => {
  it('un muro sin aperturas se dibuja como un único tramo', () => {
    const store = new EditorStore()
    const wall = muro('obj_muro-a', 2, 0, 4, 0)
    const doc: EditorDocument = {
      ...store.getState().document,
      scenario: { ...store.getState().document.scenario, objects: [wall] },
    }
    const model = buildRenderModel({ ...store.getState(), document: doc })
    expect(model.wallSegments).toHaveLength(1)
    expect(model.wallSegments[0]!.length).toBe(4)
    expect(model.wallSegments[0]!.center).toEqual({ x: 2, y: 0 })
  })

  it('una puerta sobre el muro lo corta en dos tramos', () => {
    const store = new EditorStore()
    const wall = muro('obj_muro-a', 2, 0, 4, 0)
    const door = puerta('obj_puerta-a', 2, 0, 0)
    const doc: EditorDocument = {
      ...store.getState().document,
      scenario: { ...store.getState().document.scenario, objects: [wall, door] },
    }
    const model = buildRenderModel({ ...store.getState(), document: doc })
    expect(model.wallSegments).toHaveLength(2)
    const total = model.wallSegments.reduce((sum, s) => sum + s.length, 0)
    expect(total).toBeCloseTo(4 - 0.9, 10)
    expect(model.doors).toHaveLength(1)
    expect(model.doors[0]!.hinge).toBe('left')
    expect(model.doors[0]!.doorType).toBe('swing')
  })

  it('una ventana también corta el muro y aparece como primitiva propia', () => {
    const store = new EditorStore()
    const wall = muro('obj_muro-a', 2, 0, 4, 0)
    const window = ventana('obj_ventana-a', 3, 0, 0)
    const doc: EditorDocument = {
      ...store.getState().document,
      scenario: { ...store.getState().document.scenario, objects: [wall, window] },
    }
    const model = buildRenderModel({ ...store.getState(), document: doc })
    expect(model.wallSegments).toHaveLength(2)
    expect(model.windows).toHaveLength(1)
    expect(model.windows[0]!.width).toBe(1.2)
  })

  it('una puerta PERPENDICULAR al muro no lo corta (no está colocada sobre él)', () => {
    const store = new EditorStore()
    const wall = muro('obj_muro-a', 2, 0, 4, 0)
    const door = puerta('obj_puerta-a', 2, 0, 90)
    const doc: EditorDocument = {
      ...store.getState().document,
      scenario: { ...store.getState().document.scenario, objects: [wall, door] },
    }
    const model = buildRenderModel({ ...store.getState(), document: doc })
    expect(model.wallSegments).toHaveLength(1)
  })

  it('mesas y zonas se proyectan con etiqueta y estado de selección', () => {
    const store = new EditorStore()
    const base = store.getState().document
    const doc: EditorDocument = {
      ...base,
      scenario: {
        ...base.scenario,
        zones: [
          {
            id: ZoneIdSchema.parse('zone_salon'),
            name: 'Salón principal',
            category: 'dining',
            bounds: { min: { x: 0, y: 0 }, max: { x: 6, y: 5 } },
            allowedRoles: [],
            accessRules: [],
          },
        ],
      },
      selection: { objectIds: [], zoneIds: [ZoneIdSchema.parse('zone_salon')] },
    }
    const model = buildRenderModel({ ...store.getState(), document: doc })
    expect(model.zones).toHaveLength(1)
    expect(model.zones[0]!.name).toBe('Salón principal')
    expect(model.zones[0]!.selected).toBe(true)
  })

  it('la vista previa de la pared en curso viaja en el modelo', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    store.pointerDown({ x: 1, y: 1 }, { button: 0, shift: false })
    store.pointerMove({ x: 4, y: 1 })
    const model = store.getRenderModel()
    expect(model.wallDraft).not.toBeNull()
    expect(model.wallDraft!.start).toEqual({ x: 1, y: 1 })
    // Snap: 3 unidades a 0° → extremo (4,1).
    expect(model.wallDraft!.end).toEqual({ x: 4, y: 1 })
  })

  it('la banda de selección y el arrastre se reflejan en el modelo', () => {
    const store = new EditorStore()
    store.beginMarquee({ x: 0, y: 0 })
    store.pointerMove({ x: 4, y: 3 })
    let model = store.getRenderModel()
    expect(model.marquee).toEqual({ min: { x: 0, y: 0 }, max: { x: 4, y: 3 } })

    store.beginMoveDrag({ x: 1, y: 1 })
    store.pointerMove({ x: 2, y: 2 })
    model = store.getRenderModel()
    expect(model.moveDelta).toEqual({ x: 1, y: 1 })
  })
})
