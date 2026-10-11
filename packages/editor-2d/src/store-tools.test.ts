import { describe, expect, it } from 'vitest'
import { EditorStore } from './store'
import { TOOL_IDS } from './types'

/**
 * Flujos de herramienta a través de la store (los mismos eventos que envía
 * la UI de canvas): pared por arrastre, aperturas sobre muros, objetos del
 * catálogo, zonas por arrastre, medición y borrado.
 */

function down(store: EditorStore, x: number, y: number, shift = false) {
  store.pointerDown({ x, y }, { button: 0, shift })
}
function move(store: EditorStore, x: number, y: number) {
  store.pointerMove({ x, y })
}
function up(store: EditorStore) {
  store.pointerUp()
}

describe('herramienta pared: dibujo por arrastre inicio→fin', () => {
  it('arrastrar de (1,1) a (4,1) crea un muro de 3 m horizontal', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    down(store, 1, 1)
    move(store, 4, 1)
    up(store)
    const objects = store.getState().document.scenario.objects
    expect(objects).toHaveLength(1)
    const wall = objects[0]!
    expect(wall.kind).toBe('wall')
    expect(wall.dimensions.width).toBe(3)
    expect(wall.rotation).toBe(0)
    expect(wall.position).toEqual({ x: 2.5, y: 1 })
    expect(store.getState().document.selection.objectIds).toEqual([wall.id])
  })

  it('el snap ajusta el ángulo a 45° y la longitud a la celda', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    down(store, 0, 0)
    move(store, 2.9, 3.05) // ~43°, ~4.2 m → 45° y 4 m
    up(store)
    const wall = store.getState().document.scenario.objects[0]!
    expect(wall.rotation).toBe(45)
    expect(wall.dimensions.width).toBe(4)
  })

  it('sin snap usa los puntos exactos del cursor', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    store.setGrid({ snapEnabled: false })
    down(store, 0.5, 0.5)
    move(store, 2.53, 0.51)
    up(store)
    const wall = store.getState().document.scenario.objects[0]!
    expect(wall.dimensions.width).toBeCloseTo(2.03, 3)
  })

  it('rechaza tramos más cortos que el mínimo del catálogo (0.1 m) con mensaje', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    down(store, 1, 1)
    move(store, 1.03, 1.01)
    up(store)
    expect(store.getState().document.scenario.objects).toHaveLength(0)
    const last = store.getState().messages.at(-1)
    expect(last?.level).toBe('error')
    expect(last?.text).toContain('al menos')
  })

  it('encadena muros: el inicio del segundo se engancha al extremo del primero', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    down(store, 0, 0)
    move(store, 4, 0)
    up(store)
    down(store, 3.98, 0.02) // cerca del extremo (4,0)
    move(store, 4, 3)
    up(store)
    const objects = store.getState().document.scenario.objects
    expect(objects).toHaveLength(2)
    // El segundo muro empieza exactamente en (4,0): su centro está a 1.5 de ahí.
    const second = objects[1]!
    expect(second.position.x).toBeCloseTo(4, 10)
    expect(second.position.y).toBeCloseTo(1.5, 10)
    expect(second.rotation).toBe(90)
  })

  it('la vista previa del borrador desaparece al soltar y queda en el historial', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    down(store, 0, 0)
    move(store, 3, 0)
    expect(store.getState().draft).not.toBeNull()
    up(store)
    expect(store.getState().draft).toBeNull()
    expect(store.getState().canUndo).toBe(true)
    store.undo()
    expect(store.getState().document.scenario.objects).toHaveLength(0)
    store.redo()
    expect(store.getState().document.scenario.objects).toHaveLength(1)
  })
})

describe('herramientas puerta y ventana sobre muros', () => {
  it('una puerta colocada sobre el muro hereda su rotación y queda dentro del tramo', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    down(store, 0, 0)
    move(store, 5, 0)
    up(store)

    store.selectTool('door')
    down(store, 2.4, 0.1)
    const objects = store.getState().document.scenario.objects
    expect(objects).toHaveLength(2)
    const door = objects[1]!
    expect(door.kind).toBe('door')
    expect(door.doorType).toBe('swing')
    expect(door.rotation).toBe(0)
    expect(door.position.y).toBeCloseTo(0, 10)
    expect(door.position.x).toBeGreaterThan(0.45)
    expect(door.position.x).toBeLessThan(4.55)
  })

  it('sin muro cercano, la puerta NO se coloca y se explica por qué', () => {
    const store = new EditorStore()
    store.selectTool('door')
    down(store, 5, 5)
    expect(store.getState().document.scenario.objects).toHaveLength(0)
    const last = store.getState().messages.at(-1)
    expect(last?.level).toBe('error')
    expect(last?.text).toContain('muro')
  })

  it('una ventana funciona igual y usa su preset por defecto', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    down(store, 0, 0)
    move(store, 6, 0)
    up(store)
    store.selectTool('window')
    down(store, 3, 0.05)
    const objects = store.getState().document.scenario.objects
    expect(objects).toHaveLength(2)
    expect(objects[1]!.kind).toBe('window')
    expect(objects[1]!.dimensions.width).toBe(1.2)
  })

  it('elegir un preset de puerta en el catálogo activa la herramienta puerta', () => {
    const store = new EditorStore()
    store.pickPreset('cat_door-slide-glass-180')
    expect(store.getState().tool).toBe('door')
    expect(store.getState().activePresetId).toBe('cat_door-slide-glass-180')
  })
})

describe('herramienta objeto: colocar presets del catálogo', () => {
  it('coloca la mesa activa en el punto con snap', () => {
    const store = new EditorStore()
    store.pickPreset('cat_table-round-4')
    expect(store.getState().tool).toBe('object')
    down(store, 2.3, 3.26)
    const objects = store.getState().document.scenario.objects
    expect(objects).toHaveLength(1)
    expect(objects[0]!.position).toEqual({ x: 2.5, y: 3.5 })
    expect(objects[0]!.name).toBe('Mesa redonda 4 plazas')
  })

  it('sin preset elegido, avisa y no coloca nada', () => {
    const store = new EditorStore()
    store.selectTool('object')
    down(store, 1, 1)
    expect(store.getState().document.scenario.objects).toHaveLength(0)
    expect(store.getState().messages.at(-1)?.level).toBe('error')
  })
})

describe('herramienta zona: rectángulo con nombre y etiqueta', () => {
  it('arrastrar crea la zona con bounds normalizados', () => {
    const store = new EditorStore()
    store.selectTool('zone')
    down(store, 1, 4)
    move(store, 5, 1)
    up(store)
    const zones = store.getState().document.scenario.zones
    expect(zones).toHaveLength(1)
    expect(zones[0]!.bounds).toEqual({ min: { x: 1, y: 1 }, max: { x: 5, y: 4 } })
    expect(zones[0]!.name.length).toBeGreaterThan(0)
    expect(store.getState().document.selection.zoneIds).toEqual([zones[0]!.id])
  })

  it('rechaza zonas demasiado pequeñas', () => {
    const store = new EditorStore()
    store.selectTool('zone')
    down(store, 1, 1)
    move(store, 1.2, 1.2)
    up(store)
    expect(store.getState().document.scenario.zones).toHaveLength(0)
    expect(store.getState().messages.at(-1)?.level).toBe('error')
  })

  it('un preset de zona elegido en el catálogo fija la categoría', () => {
    const store = new EditorStore()
    store.pickPreset('cat_zone-kitchen')
    expect(store.getState().tool).toBe('zone')
    down(store, 0, 0)
    move(store, 4, 4)
    up(store)
    const zone = store.getState().document.scenario.zones[0]!
    expect(zone.category).toBe('kitchen')
    expect(zone.name).toBe('Zona de cocina')
  })
})

describe('herramienta medir', () => {
  it('dos clics miden la distancia y la informan en el panel', () => {
    const store = new EditorStore()
    store.selectTool('measure')
    down(store, 0, 0)
    expect(store.getState().measure).not.toBeNull()
    down(store, 3, 4)
    expect(store.getState().measure).toBeNull()
    const last = store.getState().messages.at(-1)
    expect(last?.level).toBe('info')
    expect(last?.text).toContain('5 m')
  })
})

describe('herramienta borrar', () => {
  it('un clic borra el objeto bajo el cursor', () => {
    const store = new EditorStore()
    store.pickPreset('cat_table-round-4')
    down(store, 2, 2)
    expect(store.getState().document.scenario.objects).toHaveLength(1)
    store.selectTool('delete')
    down(store, 2, 2)
    expect(store.getState().document.scenario.objects).toHaveLength(0)
    expect(store.getState().canUndo).toBe(true)
  })

  it('un clic en vacío informa sin error', () => {
    const store = new EditorStore()
    store.selectTool('delete')
    down(store, 5, 5)
    expect(store.getState().messages.at(-1)?.level).toBe('info')
  })
})

describe('registro de herramientas', () => {
  it('las 8 herramientas del contrato están definidas y seleccionables', () => {
    const store = new EditorStore()
    expect(TOOL_IDS).toEqual([
      'select',
      'wall',
      'door',
      'window',
      'object',
      'zone',
      'measure',
      'delete',
    ])
    for (const tool of TOOL_IDS) {
      store.selectTool(tool)
      expect(store.getState().tool).toBe(tool)
    }
  })

  it('cambiar de herramienta cancela el borrador en curso', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    down(store, 0, 0)
    move(store, 2, 0)
    expect(store.getState().draft).not.toBeNull()
    store.selectTool('select')
    expect(store.getState().draft).toBeNull()
    expect(store.getState().document.scenario.objects).toHaveLength(0)
  })
})
