/**
 * Barra superior conectada a la store real: historial, archivo, zoom y
 * cuadrícula (regla 16: cada botón probado con estados reales).
 */
import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EditorStore } from '@lba/editor-2d'
import { TopBar } from './TopBar'

function montar(store = new EditorStore()) {
  render(<TopBar store={store} onFitView={vi.fn()} />)
  return store
}

describe('TopBar — historial y estado', () => {
  it('deshacer/rehacer nacen deshabilitados y se activan tras editar', () => {
    const store = montar()
    expect(screen.getByTestId('undo-button')).toBeDisabled()
    expect(screen.getByTestId('redo-button')).toBeDisabled()

    act(() => {
      store.pickPreset('cat_table-round-4')
      store.pointerDown({ x: 1, y: 1 }, { button: 0, shift: false })
    })
    expect(screen.getByTestId('undo-button')).toBeEnabled()

    act(() => store.undo())
    expect(screen.getByTestId('redo-button')).toBeEnabled()
    expect(screen.getByTestId('undo-button')).toBeDisabled()
  })

  it('muestra el nombre del escenario y el recuento de elementos', () => {
    const store = montar()
    expect(screen.getByTestId('scenario-name').textContent).toBe('Nuevo restaurante')
    expect(screen.getByTestId('scenario-counts').textContent).toContain('0 objetos')
    expect(screen.getByTestId('scenario-counts').textContent).toContain('0 zonas')

    act(() => {
      store.pickPreset('cat_table-round-4')
      store.pointerDown({ x: 1, y: 1 }, { button: 0, shift: false })
    })
    expect(screen.getByTestId('scenario-counts').textContent).toContain('1 objeto')
  })

  it('el título del botón deshacer describe la operación a deshacer', () => {
    const store = montar()
    act(() => {
      store.pickPreset('cat_table-round-4')
      store.pointerDown({ x: 1, y: 1 }, { button: 0, shift: false })
    })
    expect(screen.getByTestId('undo-button').getAttribute('title')).toContain('Añadir')
  })
})

describe('TopBar — zoom y cuadrícula', () => {
  it('los botones de zoom cambian el factor px/unidad mostrado', () => {
    montar()
    const label = screen.getByTestId('zoom-label')
    const before = Number(label.textContent?.split(' ')[0])
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    const after = Number(screen.getByTestId('zoom-label').textContent?.split(' ')[0])
    expect(after).toBeGreaterThan(before)
    fireEvent.click(screen.getByRole('button', { name: '−' }))
    expect(Number(screen.getByTestId('zoom-label').textContent?.split(' ')[0])).toBe(before)
  })

  it('Ajustar pide al lienzo que encaque la vista', () => {
    const onFitView = vi.fn()
    render(<TopBar store={new EditorStore()} onFitView={onFitView} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ajustar' }))
    expect(onFitView).toHaveBeenCalledTimes(1)
  })

  it('los interruptores de cuadrícula y snap reflejan y cambian el estado', () => {
    const store = montar()
    const grid = screen.getByTestId('grid-toggle')
    const snap = screen.getByTestId('snap-toggle')
    expect(grid.getAttribute('aria-pressed')).toBe('true')
    expect(snap.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(grid)
    expect(store.getState().grid.visible).toBe(false)
    expect(grid.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(snap)
    expect(store.getState().grid.snapEnabled).toBe(false)
  })

  it('el selector de celda cambia el tamaño de rejilla', () => {
    const store = montar()
    fireEvent.change(screen.getByTestId('grid-size'), { target: { value: '0.25' } })
    expect(store.getState().grid.size).toBe(0.25)
  })
})

describe('TopBar — archivo', () => {
  it('Guardar descarga un JSON cuando el escenario es válido', async () => {
    montar()
    const clicks: string[] = []
    const anchorClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      clicks.push(this.download)
    }
    try {
      fireEvent.click(screen.getByTestId('save-button'))
      await waitFor(() => expect(clicks).toHaveLength(1))
      expect(clicks[0]).toBe('local-nuevo.json')
    } finally {
      HTMLAnchorElement.prototype.click = anchorClick
    }
  })

  it('Cargar un fichero válido sustituye el escenario', async () => {
    const store = montar()
    act(() => {
      store.pickPreset('cat_table-round-4')
      store.pointerDown({ x: 1, y: 1 }, { button: 0, shift: false })
    })
    expect(store.getState().document.scenario.objects).toHaveLength(1)

    // Exporta el escenario actual, cámbiale el nombre y vuelve a cargarlo.
    const json = JSON.stringify({ ...store.getState().document.scenario, name: 'Plano importado' })
    const file = new File([json], 'plano.json', { type: 'application/json' })
    const input = screen.getByTestId('load-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(store.getState().document.scenario.name).toBe('Plano importado'))
  })

  it('Cargar un fichero inválido NO toca el plano actual y explica el error', async () => {
    const store = montar()
    const file = new File(['{ "schemaVersion": 99 }'], 'malo.json', { type: 'application/json' })
    const input = screen.getByTestId('load-input') as HTMLInputElement
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(store.getState().messages.at(-1)?.level).toBe('error'))
    expect(store.getState().document.scenario.name).toBe('Nuevo restaurante')
    expect(store.getState().messages.at(-1)?.text).toContain('NO se ha modificado')
  })
})
