/**
 * EditorApp completo con la store real: atajos de teclado, confirmación de
 * borrado masivo, ayuda, autosave y estados vacíos (prompts 03.1–03.3).
 */
import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EditorStore } from '@lba/editor-2d'
import { EditorApp } from './EditorApp'
import { createEditorStore } from './useEditorStore'

function montar(store = createEditorStore()) {
  render(<EditorApp store={store} />)
  return store
}

function placeTable(store: EditorStore, x = 1, y = 1) {
  act(() => {
    store.pickPreset('cat_table-round-4')
    store.pointerDown({ x, y }, { button: 0, shift: false })
  })
  return store.getState().document.scenario.objects.at(-1)!.id
}

describe('EditorApp — layout y estados vacíos', () => {
  it('renderiza las cinco regiones del layout (regla 15)', () => {
    montar()
    expect(screen.getByTestId('editor-app')).toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Barra superior del editor' })).toBeInTheDocument()
    expect(screen.getByRole('toolbar', { name: 'Herramientas del editor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Catálogo de presets')).toBeInTheDocument()
    expect(screen.getByRole('application', { name: 'Lienzo del editor 2D' })).toBeInTheDocument()
    expect(screen.getByTestId('inspector-scenario')).toBeInTheDocument()
    expect(screen.getByTestId('status-panel')).toBeInTheDocument()
  })

  it('el estado vacío del lienzo desaparece al crear contenido', () => {
    const store = montar()
    expect(screen.getByTestId('canvas-empty-state')).toBeInTheDocument()
    placeTable(store)
    expect(screen.queryByTestId('canvas-empty-state')).not.toBeInTheDocument()
  })

  it('el panel de estado muestra la pista de la herramienta activa y el cursor', () => {
    const store = montar()
    expect(screen.getByTestId('status-tool').textContent).toContain('Haz clic para seleccionar')
    act(() => {
      store.selectTool('wall')
      store.pointerMove({ x: 2.5, y: 1.5 })
    })
    expect(screen.getByTestId('status-tool').textContent).toContain('Arrastra desde el punto')
    expect(screen.getByTestId('status-cursor').textContent).toContain('2.5 m')
  })
})

describe('EditorApp — atajos de teclado (03.3)', () => {
  it('las teclas 1–8 cambian de herramienta', () => {
    const store = montar()
    fireEvent.keyDown(window, { key: '2' })
    expect(store.getState().tool).toBe('wall')
    fireEvent.keyDown(window, { key: '7' })
    expect(store.getState().tool).toBe('measure')
    fireEvent.keyDown(window, { key: '1' })
    expect(store.getState().tool).toBe('select')
  })

  it('los atajos no actúan mientras se escribe en un input', () => {
    const store = montar()
    const field = screen.getByTestId('field-scenario-name') as HTMLInputElement
    fireEvent.keyDown(field, { key: '2' })
    expect(store.getState().tool).toBe('select')
  })

  it('Supr borra un elemento único sin confirmación; con varios pide confirmar', () => {
    const store = montar()
    placeTable(store, 1, 1)
    fireEvent.keyDown(window, { key: 'Delete' })
    expect(store.getState().document.scenario.objects).toHaveLength(0)

    const b = placeTable(store, 1, 1)
    const c = placeTable(store, 3, 1)
    act(() => {
      store.selectObject(b, false)
      store.selectObject(c, true)
    })
    fireEvent.keyDown(window, { key: 'Delete' })
    // Aparece la barra de confirmación; nada se borra aún.
    expect(screen.getByTestId('delete-confirm')).toBeInTheDocument()
    expect(store.getState().document.scenario.objects).toHaveLength(2)

    fireEvent.click(screen.getByTestId('delete-confirm-yes'))
    expect(store.getState().document.scenario.objects).toHaveLength(0)
    expect(screen.queryByTestId('delete-confirm')).not.toBeInTheDocument()
  })

  it('Escape cancela la confirmación de borrado sin borrar', () => {
    const store = montar()
    const a = placeTable(store, 1, 1)
    const b = placeTable(store, 3, 1)
    act(() => {
      store.selectObject(a, false)
      store.selectObject(b, true)
    })
    fireEvent.keyDown(window, { key: 'Delete' })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByTestId('delete-confirm')).not.toBeInTheDocument()
    expect(store.getState().document.scenario.objects).toHaveLength(2)
  })

  it('Ctrl+Z deshace y Ctrl+Shift+Z rehace; Ctrl+D duplica', () => {
    const store = montar()
    placeTable(store)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(store.getState().document.scenario.objects).toHaveLength(0)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true })
    expect(store.getState().document.scenario.objects).toHaveLength(1)

    fireEvent.keyDown(window, { key: 'd', ctrlKey: true })
    expect(store.getState().document.scenario.objects).toHaveLength(2)
  })

  it('las flechas mueven la selección un paso de rejilla (Shift ×5)', () => {
    const store = montar()
    const a = placeTable(store, 1, 1)
    store.selectObject(a, false)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(store.getObject(a)!.position.x).toBeCloseTo(1.5, 10)
    fireEvent.keyDown(window, { key: 'ArrowRight', shiftKey: true })
    expect(store.getObject(a)!.position.x).toBeCloseTo(4, 10)
  })

  it('R rota 90° y G/X conmutan cuadrícula y snap', () => {
    const store = montar()
    const a = placeTable(store)
    act(() => store.selectObject(a, false))
    fireEvent.keyDown(window, { key: 'r' })
    expect(store.getObject(a)!.rotation).toBe(90)

    fireEvent.keyDown(window, { key: 'g' })
    expect(store.getState().grid.visible).toBe(false)
    fireEvent.keyDown(window, { key: 'x' })
    expect(store.getState().grid.snapEnabled).toBe(false)
  })

  it('Tab cicla la selección entre elementos', () => {
    const store = montar()
    const a = placeTable(store, 1, 1)
    const b = placeTable(store, 3, 1)
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(store.getState().document.selection.objectIds).toEqual([a])
    fireEvent.keyDown(window, { key: 'Tab' })
    expect(store.getState().document.selection.objectIds).toEqual([b])
  })

  it('Ctrl+S guarda el escenario con la operación compartida de fichero', () => {
    const store = montar()
    placeTable(store)
    const clicks: string[] = []
    const anchorClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      clicks.push(this.download)
    }
    try {
      fireEvent.keyDown(window, { key: 's', ctrlKey: true })
      expect(clicks).toHaveLength(1)
      expect(clicks[0]).toBe('local-nuevo.json')
    } finally {
      HTMLAnchorElement.prototype.click = anchorClick
    }
  })

  it('? abre y cierra la ayuda con la tabla de atajos', () => {
    montar()
    fireEvent.keyDown(window, { key: '?' })
    expect(screen.getByTestId('help-modal')).toBeInTheDocument()
    expect(screen.getByTestId('help-modal').textContent).toContain('Ctrl+Z')
    fireEvent.click(screen.getByTestId('help-close'))
    expect(screen.queryByTestId('help-modal')).not.toBeInTheDocument()
  })
})

describe('EditorApp — catálogo conectado al flujo de dibujo', () => {
  it('elegir un preset de puerta activa la herramienta puerta y lo marca activo', () => {
    const store = montar()
    const doorPreset = document.querySelector(
      '[data-preset-id="cat_door-swing-wood-90"]',
    ) as HTMLButtonElement
    fireEvent.click(doorPreset)
    expect(store.getState().tool).toBe('door')
    expect(store.getState().activePresetId).toBe('cat_door-swing-wood-90')
    expect(doorPreset.getAttribute('aria-pressed')).toBe('true')
  })

  it('la búsqueda del catálogo filtra presets', () => {
    montar()
    const search = screen.getByTestId('catalog-search') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'pizza' } })
    const items = document.querySelectorAll('.catalog__item')
    expect(items.length).toBeGreaterThan(0)
    for (const item of Array.from(items)) {
      expect(item.textContent?.toLowerCase()).toContain('pizza')
    }
  })

  it('una búsqueda sin resultados muestra el estado vacío del catálogo', () => {
    montar()
    fireEvent.change(screen.getByTestId('catalog-search'), {
      target: { value: 'zzzz-inexistente' },
    })
    expect(screen.getByTestId('catalog-empty')).toBeInTheDocument()
  })
})

describe('EditorApp — autosave local (03.3)', () => {
  it('restaura el autosave desde el banner y puede descartarlo', async () => {
    // Prepara un autosave previo en localStorage.
    const store = createEditorStore()
    placeTable(store)
    const scenario = store.getState().document.scenario
    window.localStorage.setItem(`lba:autosave:${scenario.id}`, JSON.stringify(scenario))

    const appStore = montar()
    const banner = screen.getByTestId('autosave-banner')
    expect(banner.textContent).toContain('Nuevo restaurante')

    fireEvent.click(screen.getByTestId('autosave-restore'))
    await waitFor(() => expect(appStore.getState().document.scenario.objects).toHaveLength(1))
    expect(screen.queryByTestId('autosave-banner')).not.toBeInTheDocument()
  })

  it('descartar elimina el autosave y cierra el banner', async () => {
    const store = createEditorStore()
    placeTable(store)
    const scenario = store.getState().document.scenario
    window.localStorage.setItem(`lba:autosave:${scenario.id}`, JSON.stringify(scenario))

    const appStore = montar()
    fireEvent.click(screen.getByTestId('autosave-discard'))
    expect(screen.queryByTestId('autosave-banner')).not.toBeInTheDocument()
    expect(
      window.localStorage.getItem(`lba:autosave:${appStore.getState().document.scenario.id}`),
    ).toBeNull()
  })
})
