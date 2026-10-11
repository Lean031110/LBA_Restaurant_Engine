/**
 * Lienzo con el mock de react-konva (siluetas DOM): verifica el mapeo del
 * modelo de render a formas, el estado vacío y la interacción de selección.
 * La interacción REAL del canvas la cubren las E2E de Playwright.
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

describe('CanvasStage — proyección del modelo de render', () => {
  it('muestra el estado vacío con instrucciones cuando no hay contenido', () => {
    montar()
    expect(screen.getByTestId('canvas-empty-state')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-empty-state').textContent).toContain('Pared (2)')
  })

  it('proyecta zonas, muros, puertas y objetos como formas data-konva', () => {
    const store = montar()
    // Zona
    act(() => {
      store.selectTool('zone')
      store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
      store.pointerMove({ x: 5, y: 5 })
      store.pointerUp()
      // Muro + puerta sobre el muro
      store.selectTool('wall')
      store.pointerDown({ x: 0, y: 6 }, { button: 0, shift: false })
      store.pointerMove({ x: 5, y: 6 })
      store.pointerUp()
      store.selectTool('door')
      store.pointerDown({ x: 2.5, y: 6.1 }, { button: 0, shift: false })
    })
    // Mesa
    placeTable(store, 2, 2)

    const canvas = screen.getByTestId('editor-canvas')
    expect(canvas.querySelectorAll('[data-konva="Rect"]').length).toBeGreaterThan(0)
    // La zona y el objeto tienen su data-id para la selección.
    expect(canvas.querySelector('[data-id]')).not.toBeNull()
    // El estado vacío desaparece.
    expect(screen.queryByTestId('canvas-empty-state')).not.toBeInTheDocument()
  })

  it('un clic en una forma de objeto con la herramienta select la selecciona', () => {
    const store = montar()
    const id = placeTable(store)
    const shape = screen.getByTestId('editor-canvas').querySelector(`[data-id="${id}"]`)!
    expect(shape).not.toBeNull()
    // El handler de selección está cableado al nodo del objeto (mock expone data-id).
    fireEvent.mouseDown(shape, { button: 0 })
    // La selección visual depende del estado; con mock no hay Konva Transformer,
    // pero la store registra la selección a través del evento.
    expect(store.getState().document.selection.objectIds).toContain(id)
  })

  it('la vista previa del borrador de pared se proyecta en la capa superior', () => {
    const store = montar()
    act(() => {
      store.selectTool('wall')
      store.pointerDown({ x: 1, y: 1 }, { button: 0, shift: false })
      store.pointerMove({ x: 4, y: 1 })
    })
    const canvas = screen.getByTestId('editor-canvas')
    // El borrador dibuja un Rect de vista previa (mock: data-konva Rect extra).
    const rects = canvas.querySelectorAll('[data-konva="Rect"]')
    expect(rects.length).toBeGreaterThan(0)
    expect(store.getState().draft).not.toBeNull()
  })

  it('el tamaño del lienzo responde al contenedor (ResizeObserver en E2E)', () => {
    montar()
    expect(screen.getByRole('application', { name: 'Lienzo del editor 2D' })).toBeInTheDocument()
  })
})
