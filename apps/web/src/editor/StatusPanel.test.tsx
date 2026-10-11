/**
 * Panel de estado: pistas, coordenadas, medición y mensajes por nivel.
 */
import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { EditorStore } from '@lba/editor-2d'
import { StatusPanel } from './StatusPanel'

function montar(store = new EditorStore()) {
  render(<StatusPanel store={store} />)
  return store
}

describe('StatusPanel', () => {
  it('muestra la pista de la herramienta activa', () => {
    const store = montar()
    expect(screen.getByTestId('status-tool').textContent).toContain('Seleccionar')
    act(() => store.selectTool('wall'))
    expect(screen.getByTestId('status-tool').textContent).toContain('Pared')
  })

  it('muestra las coordenadas del cursor en unidades del mundo (no píxeles)', () => {
    const store = montar()
    act(() => store.pointerMove({ x: 3.25, y: 2 }))
    expect(screen.getByTestId('status-cursor').textContent).toBe('Cursor: 3.25 m, 2 m')
    act(() => store.setCursor(null))
    expect(screen.getByTestId('status-cursor').textContent).toContain('fuera del lienzo')
  })

  it('muestra la medición en curso con su distancia', () => {
    const store = montar()
    act(() => {
      store.selectTool('measure')
      store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
      store.pointerMove({ x: 3, y: 4 })
    })
    expect(screen.getByTestId('status-measure').textContent).toContain('5 m')
  })

  it('el último mensaje se muestra por nivel y se descarta con un clic', () => {
    const store = montar()
    act(() => store.pushMessage('info', 'Pared añadida (3 m).'))
    expect(screen.getByTestId('status-message-info').textContent).toContain('Pared añadida')
    fireEvent.click(screen.getByTestId('status-message-info'))
    expect(store.getState().messages).toHaveLength(0)
  })

  it('la advertencia de solapamiento es visible y explícita', () => {
    const store = montar()
    act(() => {
      store.pickPreset('cat_table-round-4')
      store.pointerDown({ x: 1, y: 1 }, { button: 0, shift: false })
      store.pointerDown({ x: 1.2, y: 1 }, { button: 0, shift: false })
    })
    expect(screen.getByTestId('status-overlap').textContent).toContain('solapamiento')
    expect(screen.getByTestId('status-message-warn').textContent).toContain(
      'no una comprobación arquitectónica',
    )
  })
})
