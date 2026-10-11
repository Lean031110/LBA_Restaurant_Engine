import { describe, expect, it } from 'vitest'
import { EditorStore } from './store'
import { emptyScenario } from './document'
import { HISTORY_LIMIT, MESSAGE_LIMIT } from './types'

/** Mesa en (x,y) usando el flujo real: catálogo → herramienta objeto. */
function placeTable(store: EditorStore, x: number, y: number) {
  store.pickPreset('cat_table-round-4')
  store.pointerDown({ x, y }, { button: 0, shift: false })
  return store.getState().document.scenario.objects.at(-1)!.id
}

describe('selección y multi-selección', () => {
  it('selecciona un objeto, añade con Shift y alterna', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    const b = placeTable(store, 3, 1)

    store.selectObject(a, false)
    expect(store.getState().document.selection.objectIds).toEqual([a])
    store.selectObject(b, true)
    expect(store.getState().document.selection.objectIds).toEqual([a, b])
    store.selectObject(a, true)
    expect(store.getState().document.selection.objectIds).toEqual([b])
  })

  it('la banda (marquee) selecciona lo que cubre', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    const b = placeTable(store, 3, 1)
    placeTable(store, 9, 9)

    store.beginMarquee({ x: 0, y: 0 })
    store.pointerMove({ x: 4.5, y: 2 })
    store.pointerUp()
    const ids = store.getState().document.selection.objectIds
    expect(ids).toContain(a)
    expect(ids).toContain(b)
    expect(ids).toHaveLength(2)
  })

  it('Tab cicla la selección por todos los elementos', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    const b = placeTable(store, 3, 1)
    store.clearSelection()
    store.cycleSelection(1)
    expect(store.getState().document.selection.objectIds).toEqual([a])
    store.cycleSelection(1)
    expect(store.getState().document.selection.objectIds).toEqual([b])
    store.cycleSelection(-1)
    expect(store.getState().document.selection.objectIds).toEqual([a])
  })
})

describe('mover, rotar, duplicar y borrar', () => {
  it('el arrastre de la selección confirma un único comando con snap', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    store.beginMoveDrag({ x: 1, y: 1 })
    store.pointerMove({ x: 1.7, y: 1.2 })
    store.commitMoveDrag()
    const moved = store.getObject(a)!
    expect(moved.position.x).toBeCloseTo(1.5, 10) // snap 0.5
    expect(moved.position.y).toBeCloseTo(1.0, 10)
    // Colocar + arrastrar = 2 entradas; el arrastre añade exactamente una.
    const labels = store.historyLabels().undo
    expect(labels).toHaveLength(2)
    expect(labels[1]).toContain('Mover')
  })

  it('el arrastre se cancela sin tocar el documento', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    store.beginMoveDrag({ x: 1, y: 1 })
    store.pointerMove({ x: 3, y: 3 })
    store.cancelMoveDrag()
    expect(store.getObject(a)!.position).toEqual({ x: 1, y: 1 })
    expect(store.getState().moveDrag).toBeNull()
  })

  it('mover con teclado usa el paso de rejilla y Shift lo multiplica', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    store.moveSelection({ x: 1, y: 0 })
    expect(store.getObject(a)!.position.x).toBeCloseTo(1.5, 10)
    store.moveSelection({ x: 1, y: 0 }, 5)
    expect(store.getObject(a)!.position.x).toBeCloseTo(4, 10)
  })

  it('rotar con teclado rota en sitio y arrastra el punto de interacción', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    const before = store.getObject(a)!
    store.rotateSelection(90)
    const after = store.getObject(a)!
    expect(after.rotation).toBe(90)
    expect(after.position).toEqual(before.position)
    expect(after.interactionPoint.x).toBeCloseTo(
      before.position.x - (before.interactionPoint.y - before.position.y),
      10,
    )
  })

  it('commitObjectTransform aplica la transformación del Transformer', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    store.commitObjectTransform(a, { position: { x: 2, y: 2 }, rotation: 45, width: 2, depth: 1 })
    const obj = store.getObject(a)!
    expect(obj.position).toEqual({ x: 2, y: 2 })
    expect(obj.rotation).toBe(45)
    expect(obj.dimensions).toEqual({ width: 2, depth: 1 })
  })

  it('duplicar crea una copia con ID nuevo y la selecciona', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    store.duplicateSelection()
    const objects = store.getState().document.scenario.objects
    expect(objects).toHaveLength(2)
    const copy = objects[1]!
    expect(copy.id).not.toBe(a)
    expect(copy.position).toEqual({ x: 1.5, y: 1.5 })
    expect(store.getState().document.selection.objectIds).toEqual([copy.id])
  })

  it('borrar la selección vacía falla con mensaje y sin historial', () => {
    const store = new EditorStore()
    store.deleteSelection()
    expect(store.getState().canUndo).toBe(false)
    expect(store.getState().messages.at(-1)?.level).toBe('error')
  })
})

describe('undo/redo por instantáneas', () => {
  it('secuencia completa: crear, mover, editar, deshacer todo, rehacer todo', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    store.moveSelection({ x: 1, y: 0 })
    store.patchObject(a, { name: 'Mesa del rincón' })
    expect(store.historyLabels().undo).toHaveLength(3)

    store.undo()
    expect(store.getObject(a)!.name).toBe('Mesa redonda 4 plazas')
    store.undo()
    expect(store.getObject(a)!.position).toEqual({ x: 1, y: 1 })
    store.undo()
    expect(store.getState().document.scenario.objects).toHaveLength(0)

    store.redo()
    store.redo()
    store.redo()
    const obj = store.getState().document.scenario.objects[0]!
    expect(obj.position).toEqual({ x: 1.5, y: 1 })
    expect(obj.name).toBe('Mesa del rincón')
  })

  it('una operación nueva tras deshacer limpia la pila de rehacer', () => {
    const store = new EditorStore()
    placeTable(store, 1, 1)
    store.undo()
    expect(store.getState().canRedo).toBe(true)
    placeTable(store, 2, 2)
    expect(store.getState().canRedo).toBe(false)
    expect(store.getState().document.scenario.objects).toHaveLength(1)
  })

  it('las etiquetas de historial describen la operación', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    store.moveSelection({ x: 1, y: 0 })
    const labels = store.historyLabels().undo
    expect(labels[0]).toContain('Añadir')
    expect(labels[1]).toContain('Mover')
  })

  it('el historial está acotado (no crece sin límite)', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    for (let i = 0; i < HISTORY_LIMIT + 30; i++) {
      store.moveSelection({ x: 1, y: 0 })
      store.undo()
    }
    expect(store.historyLabels().undo.length).toBeLessThanOrEqual(HISTORY_LIMIT)
  })

  it('después de deshacer un borrado, el objeto vuelve con el mismo ID', () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    store.deleteSelection()
    expect(store.getState().document.scenario.objects).toHaveLength(0)
    store.undo()
    expect(store.getState().document.scenario.objects[0]!.id).toBe(a)
  })
})

describe('ramas de la store: entradas atípicas de la UI', () => {
  it('pickPreset desconocido avisa sin cambiar la herramienta', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    store.pickPreset('cat_inexistente-xx')
    expect(store.getState().tool).toBe('wall')
    expect(store.getState().activePresetId).toBeNull()
    expect(store.getState().messages.at(-1)?.level).toBe('error')
  })

  it('pickPreset(null) limpia el preset activo', () => {
    const store = new EditorStore()
    store.pickPreset('cat_table-round-4')
    store.pickPreset(null)
    expect(store.getState().activePresetId).toBeNull()
  })

  it('pointerDown con botón secundario no dibuja; la herramienta select ignora el puntero', () => {
    const store = new EditorStore()
    store.selectTool('wall')
    store.pointerDown({ x: 0, y: 0 }, { button: 2, shift: false })
    expect(store.getState().draft).toBeNull()
    store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
    expect(store.getState().draft).not.toBeNull()
    store.pointerMove({ x: 3, y: 0 })
    store.pointerUp()
    expect(store.getState().document.scenario.objects).toHaveLength(1)
    store.selectTool('select')
    store.pointerDown({ x: 1, y: 0 }, { button: 0, shift: false })
    expect(store.getState().document.scenario.objects).toHaveLength(1)
  })

  it('setCursor sin cambio no emite (comparación por valor)', () => {
    const store = new EditorStore()
    store.setCursor({ x: 1, y: 1 })
    const state = store.getState()
    store.setCursor({ x: 1, y: 1 })
    expect(store.getState()).toBe(state)
    store.setCursor(null)
    expect(store.getState().cursor).toBeNull()
    store.setCursor(null)
    expect(store.getState().cursor).toBeNull()
  })

  it('cyclear en un documento vacío no hace nada', () => {
    const store = new EditorStore()
    store.cycleSelection(1)
    expect(store.getState().document.selection.objectIds).toHaveLength(0)
  })

  it('la herramienta objeto con un preset de pared activo avisa (grupo incompatible)', () => {
    const store = new EditorStore()
    store.selectTool('object')
    store.pickPreset('cat_wall-interior-100') // cambia a herramienta wall
    store.selectTool('object') // y vuelve a object con el preset de pared activo
    store.pointerDown({ x: 1, y: 1 }, { button: 0, shift: false })
    expect(store.getState().document.scenario.objects).toHaveLength(0)
    expect(store.getState().messages.at(-1)?.level).toBe('error')
  })

  it('mover/rotar sin selección es un no-op silencioso', () => {
    const store = new EditorStore()
    store.moveSelection({ x: 1, y: 0 })
    store.rotateSelection(90)
    expect(store.getState().canUndo).toBe(false)
  })

  it('el panel de mensajes está acotado a MESSAGE_LIMIT', () => {
    const store = new EditorStore()
    for (let i = 0; i < MESSAGE_LIMIT + 10; i++) store.pushMessage('info', `m${i}`)
    expect(store.getState().messages).toHaveLength(MESSAGE_LIMIT)
  })

  it('una zona seleccionada se puede borrar con la selección', () => {
    const store = new EditorStore()
    store.selectTool('zone')
    store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
    store.pointerMove({ x: 4, y: 4 })
    store.pointerUp()
    expect(store.getState().document.scenario.zones).toHaveLength(1)
    store.deleteSelection()
    expect(store.getState().document.scenario.zones).toHaveLength(0)
    store.undo()
    expect(store.getState().document.scenario.zones).toHaveLength(1)
  })
})

describe('mensajes del panel de estado', () => {
  it('los mensajes se acumulan y se pueden descartar', () => {
    const store = new EditorStore()
    store.pushMessage('info', 'uno')
    store.pushMessage('warn', 'dos')
    expect(store.getState().messages).toHaveLength(2)
    const first = store.getState().messages[0]!
    store.dismissMessage(first.id)
    expect(store.getState().messages).toHaveLength(1)
    store.clearMessages()
    expect(store.getState().messages).toHaveLength(0)
  })

  it('el solapamiento de muebles genera una advertencia', () => {
    const store = new EditorStore()
    placeTable(store, 1, 1)
    placeTable(store, 1.2, 1) // mesa encima → solape
    const warn = store.getState().messages.find((m) => m.level === 'warn')
    expect(warn).toBeDefined()
    expect(warn!.text).toContain('solapamiento')
    // El aviso es geométrico, no una garantía arquitectónica.
    expect(warn!.text).toContain('no una comprobación arquitectónica')
    expect(store.getState().overlappingObjectIds).toHaveLength(2)
  })
})

describe('cambio de escenario', () => {
  it('loadScenario sustituye el documento y el undo recupera el anterior', () => {
    const store = new EditorStore()
    placeTable(store, 1, 1)
    const parsed = JSON.parse(
      JSON.stringify({ ...emptyScenario(), id: 'scn_otro', name: 'Otro plano' }),
    )
    store.loadScenario(parsed, 'Cargar fichero')
    expect(store.getState().document.scenario.id).toBe('scn_otro')
    expect(store.getState().document.scenario.objects).toHaveLength(0)
    store.undo()
    expect(store.getState().document.scenario.id).toBe('scn_local-nuevo')
    expect(store.getState().document.scenario.objects).toHaveLength(1)
  })
})
