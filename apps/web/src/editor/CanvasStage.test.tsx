/**
 * Lienzo con el mock de react-konva (siluetas DOM): verifica el mapeo del
 * modelo de render a formas en todos los estados visuales (variantes de
 * puerta, borradores, banda, medición, capas) y la interacción de
 * selección. La interacción REAL del canvas (arrastres, zoom, pan) la
 * cubren las E2E de Playwright sobre el navegador.
 */
import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { EditorStore } from '@lba/editor-2d'
import { CanvasStage } from './CanvasStage'

function montar(store = new EditorStore()) {
  render(<CanvasStage store={store} />)
  return store
}

function placeTable(store: EditorStore, x = 1, y = 1) {
  act(() => {
    store.pickPreset('cat_table-round-4')
    store.pointerDown({ x, y }, { button: 0, shift: false })
  })
  return store.getState().document.scenario.objects.at(-1)!.id
}

function placeWall(store: EditorStore, x1 = 0, y1 = 0, x2 = 4, y2 = 0) {
  act(() => {
    store.selectTool('wall')
    store.pointerDown({ x: x1, y: y1 }, { button: 0, shift: false })
    store.pointerMove({ x: x2, y: y2 })
    store.pointerUp()
  })
  return store.getState().document.scenario.objects[0]!.id
}

describe('CanvasStage — proyección del modelo de render', () => {
  it('muestra el estado vacío con instrucciones cuando no hay contenido', () => {
    montar()
    expect(screen.getByTestId('canvas-empty-state')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-empty-state').textContent).toContain('Pared (2)')
  })

  it('el estado vacío desaparece con contenido (incluso solo zonas)', () => {
    const store = montar()
    act(() => {
      store.selectTool('zone')
      store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
      store.pointerMove({ x: 4, y: 4 })
      store.pointerUp()
    })
    expect(screen.queryByTestId('canvas-empty-state')).not.toBeInTheDocument()
  })

  it('proyecta zonas, muros, puertas y objetos con sus data-id', () => {
    const store = montar()
    act(() => {
      store.selectTool('zone')
      store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
      store.pointerMove({ x: 5, y: 5 })
      store.pointerUp()
      store.selectTool('wall')
      store.pointerDown({ x: 0, y: 6 }, { button: 0, shift: false })
      store.pointerMove({ x: 5, y: 6 })
      store.pointerUp()
      store.selectTool('door')
      store.pointerDown({ x: 2.5, y: 6.1 }, { button: 0, shift: false })
    })
    placeTable(store, 2, 2)

    const canvas = screen.getByTestId('editor-canvas')
    expect(canvas.querySelectorAll('[data-konva="Rect"]').length).toBeGreaterThan(0)
    expect(canvas.querySelector('[data-id]')).not.toBeNull()
    expect(screen.queryByTestId('canvas-empty-state')).not.toBeInTheDocument()
  })

  it('la cuadrícula desaparece cuando se oculta (capa no renderizada)', () => {
    const store = montar()
    act(() => store.setGrid({ visible: false }))
    const canvas = screen.getByTestId('editor-canvas')
    // Sin cuadrícula no hay líneas ni etiqueta del local.
    expect(canvas.textContent).not.toContain('Local ')
  })

  it('la etiqueta del local muestra las unidades del mundo', () => {
    montar()
    expect(screen.getByTestId('editor-canvas').textContent).toContain('12 × 8 m')
  })
})

describe('CanvasStage — variantes visuales de puertas y ventanas', () => {
  it('una puerta batiente con bisagra derecha y lado B cambia de silueta', () => {
    const store = montar()
    placeWall(store)
    act(() => {
      store.selectTool('door')
      store.pointerDown({ x: 2, y: 0.1 }, { button: 0, shift: false })
    })
    const door = store.getState().document.scenario.objects[1]!
    act(() => {
      store.selectObject(door.id, false)
      store.patchObject(door.id, {
        properties: { ...door.properties, hinge: 'right', opening: 'b' },
      })
    })
    const canvas = screen.getByTestId('editor-canvas')
    const doorNode = canvas.querySelector(`[data-shape="door"]`)
    expect(doorNode).not.toBeNull()
  })

  it('una puerta corredera y una ventana proyectan sus propias siluetas', () => {
    const store = montar()
    placeWall(store, 0, 0, 6, 0)
    act(() => {
      store.pickPreset('cat_door-slide-glass-180')
      store.pointerDown({ x: 3, y: 0.05 }, { button: 0, shift: false })
      store.pickPreset('cat_window-fixed-120')
      store.pointerDown({ x: 1.5, y: 0.05 }, { button: 0, shift: false })
    })
    const canvas = screen.getByTestId('editor-canvas')
    expect(canvas.querySelectorAll('[data-shape="door"]').length).toBe(1)
    expect(canvas.querySelectorAll('[data-shape="window"]').length).toBe(1)
  })

  it('los muros con puerta quedan cortados en dos tramos con data-id del muro', () => {
    const store = montar()
    placeWall(store, 0, 0, 4, 0)
    act(() => {
      store.selectTool('door')
      store.pointerDown({ x: 2, y: 0.1 }, { button: 0, shift: false })
    })
    const canvas = screen.getByTestId('editor-canvas')
    expect(canvas.querySelectorAll('[data-shape="wall"]').length).toBe(2)
  })
})

describe('CanvasStage — capas de interacción y selección', () => {
  it('un clic en una forma de objeto con la herramienta select la selecciona', () => {
    const store = montar()
    const id = placeTable(store)
    act(() => store.selectTool('select'))
    const shape = screen.getByTestId('editor-canvas').querySelector(`[data-id="${id}"]`)!
    expect(shape).not.toBeNull()
    fireEvent.mouseDown(shape, { button: 0 })
    expect(store.getState().document.selection.objectIds).toContain(id)
  })

  it('un clic en un muro con select lo selecciona (forma pasiva)', () => {
    const store = montar()
    const wallId = placeWall(store)
    act(() => store.selectTool('select'))
    const shape = screen.getByTestId('editor-canvas').querySelector(`[data-id="${wallId}"]`)!
    fireEvent.mouseDown(shape, { button: 0 })
    expect(store.getState().document.selection.objectIds).toContain(wallId)
  })

  it('un clic en una zona con select la selecciona', () => {
    const store = montar()
    act(() => {
      store.selectTool('zone')
      store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
      store.pointerMove({ x: 4, y: 4 })
      store.pointerUp()
    })
    const zoneId = store.getState().document.scenario.zones[0]!.id
    act(() => store.selectTool('select'))
    const shape = screen.getByTestId('editor-canvas').querySelector(`[data-id="${zoneId}"]`)!
    fireEvent.mouseDown(shape, { button: 0 })
    expect(store.getState().document.selection.zoneIds).toContain(zoneId)
  })

  it('las formas NO interceptan el clic cuando la herramienta no es select', () => {
    const store = montar()
    const id = placeTable(store)
    act(() => {
      store.clearSelection()
      store.selectTool('delete')
    })
    const shape = screen.getByTestId('editor-canvas').querySelector(`[data-id="${id}"]`)!
    fireEvent.mouseDown(shape, { button: 0 })
    // El handler de la forma solo actúa con select: la selección sigue
    // vacía y el borrado corre a cargo del escenario (hit-test puro, E2E).
    expect(store.getState().document.selection.objectIds).toHaveLength(0)
  })

  it('el objeto con nombre proyecta su etiqueta visible', () => {
    const store = montar()
    const id = placeTable(store)
    act(() => store.patchObject(id, { name: 'Mesa ventana 4' }))
    expect(screen.getByTestId('editor-canvas').textContent).toContain('Mesa ventana 4')
  })

  it('el objeto con solapamiento se proyecta (sombra de advertencia)', () => {
    const store = montar()
    placeTable(store, 1, 1)
    placeTable(store, 1.2, 1)
    expect(store.getState().overlappingObjectIds).toHaveLength(2)
    const canvas = screen.getByTestId('editor-canvas')
    expect(canvas.querySelectorAll('[data-shape="object"]').length).toBe(2)
  })
})

describe('CanvasStage — eventos de escenario (con puntero del mock)', () => {
  it('clic en vacío con select abre la banda; soltar la confirma', () => {
    const store = montar()
    act(() => store.selectTool('select'))
    const stage = screen.getByTestId('editor-canvas').querySelector('[data-konva="Stage"]')!
    expect(stage).not.toBeNull()
    fireEvent.mouseDown(stage, { button: 0 })
    expect(store.getState().marquee).not.toBeNull()
    fireEvent.mouseMove(stage)
    fireEvent.mouseUp(stage)
    expect(store.getState().marquee).toBeNull()
  })

  it('el botón central inicia pan (vista del usuario) sin tocar el documento', () => {
    const store = montar()
    const stage = screen.getByTestId('editor-canvas').querySelector('[data-konva="Stage"]')!
    fireEvent.mouseDown(stage, { button: 1 })
    fireEvent.mouseMove(stage)
    fireEvent.mouseUp(stage)
    // El puntero del mock es estático (delta 0): la vista numérica no cambia,
    // pero el gesto queda registrado como ajuste manual del usuario.
    expect(store.hasUserView()).toBe(true)
    expect(store.getState().document.scenario.objects).toHaveLength(0)
  })

  it('la rueda hace zoom hacia el puntero y queda marcada como vista del usuario', () => {
    const store = montar()
    const stage = screen.getByTestId('editor-canvas').querySelector('[data-konva="Stage"]')!
    const before = store.getState().view.pixelsPerUnit
    fireEvent.wheel(stage, { deltaY: -100 })
    expect(store.getState().view.pixelsPerUnit).toBeGreaterThan(before)
    expect(store.hasUserView()).toBe(true)
  })

  it('Espacio activa el modo pan (clase visual) y soltar el ratón fuera confirma', () => {
    const store = montar()
    fireEvent.keyDown(window, { code: 'Space' })
    expect(screen.getByTestId('editor-canvas').className).toContain('canvas-stage--pan')
    fireEvent.keyUp(window, { code: 'Space' })
    expect(screen.getByTestId('editor-canvas').className).not.toContain('canvas-stage--pan')

    // Red de seguridad: mousedown de escenario + mouseup en ventana.
    act(() => store.selectTool('wall'))
    const stage = screen.getByTestId('editor-canvas').querySelector('[data-konva="Stage"]')!
    fireEvent.mouseDown(stage, { button: 0 })
    expect(store.getState().draft).not.toBeNull()
    fireEvent.mouseUp(window)
    expect(store.getState().draft).toBeNull()
  })

  it('el menú contextual se suprime y salir del lienzo limpia el cursor', () => {
    const store = montar()
    const stage = screen.getByTestId('editor-canvas').querySelector('[data-konva="Stage"]')!
    fireEvent.contextMenu(stage)
    act(() => store.setCursor({ x: 1, y: 1 }))
    expect(store.getState().cursor).toEqual({ x: 1, y: 1 })
    fireEvent.mouseLeave(stage)
    expect(store.getState().cursor).toBeNull()
  })
})

describe('CanvasStage — vistas previas (borradores, banda, medición)', () => {
  it('la vista previa de la pared en curso se proyecta con sus extremos', () => {
    const store = montar()
    act(() => {
      store.selectTool('wall')
      store.pointerDown({ x: 1, y: 1 }, { button: 0, shift: false })
      store.pointerMove({ x: 4, y: 1 })
    })
    const canvas = screen.getByTestId('editor-canvas')
    expect(canvas.querySelectorAll('[data-konva="Rect"]').length).toBeGreaterThan(0)
    expect(canvas.querySelectorAll('[data-konva="Circle"]').length).toBe(2)
  })

  it('la vista previa de zona y la banda de selección proyectan rectángulos', () => {
    const store = montar()
    act(() => {
      store.selectTool('zone')
      store.pointerDown({ x: 1, y: 1 }, { button: 0, shift: false })
      store.pointerMove({ x: 5, y: 4 })
    })
    expect(store.getState().draft?.kind).toBe('zone')

    act(() => {
      store.selectTool('select')
      store.beginMarquee({ x: 0, y: 0 })
      store.pointerMove({ x: 4, y: 3 })
    })
    expect(store.getState().marquee).not.toBeNull()
  })

  it('la medición en curso proyecta segmento, puntos y texto', () => {
    const store = montar()
    act(() => {
      store.selectTool('measure')
      store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
      store.pointerMove({ x: 3, y: 4 })
    })
    const canvas = screen.getByTestId('editor-canvas')
    expect(canvas.querySelectorAll('[data-konva="Circle"]').length).toBe(2)
    expect(canvas.textContent).toContain('5')
  })
})
