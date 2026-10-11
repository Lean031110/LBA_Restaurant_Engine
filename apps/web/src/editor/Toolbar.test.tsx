/**
 * Inventario de controles de la barra de herramientas (regla 16): las 8
 * herramientas del contrato, su activación y su estado aria-pressed.
 */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Toolbar } from './Toolbar'

function montar(onToolChange = vi.fn()) {
  render(<Toolbar activeTool="select" onToolChange={onToolChange} />)
  return { onToolChange }
}

describe('Toolbar — inventario de herramientas', () => {
  it('renderiza las 8 herramientas del contrato con icono, etiqueta y atajo', () => {
    montar()
    const toolbar = screen.getByRole('toolbar', { name: 'Herramientas del editor' })
    const expected: Array<[string, string, string]> = [
      ['select', 'Seleccionar', '1'],
      ['wall', 'Pared', '2'],
      ['door', 'Puerta', '3'],
      ['window', 'Ventana', '4'],
      ['object', 'Objeto', '5'],
      ['zone', 'Zona', '6'],
      ['measure', 'Medir', '7'],
      ['delete', 'Borrar', '8'],
    ]
    for (const [tool, label, shortcut] of expected) {
      const button = toolbar.querySelector(`[data-tool="${tool}"]`) as HTMLButtonElement
      expect(button).not.toBeNull()
      expect(button.textContent).toContain(label)
      expect(button.textContent).toContain(shortcut)
      expect(button.querySelector('svg')).not.toBeNull()
    }
  })

  it('marca la herramienta activa con aria-pressed y clase visual', () => {
    montar()
    const active = screen.getByRole('toolbar').querySelector('[data-tool="select"]')!
    expect(active.getAttribute('aria-pressed')).toBe('true')
    expect(active.className).toContain('toolbar__tool--active')
    const inactive = screen.getByRole('toolbar').querySelector('[data-tool="wall"]')!
    expect(inactive.getAttribute('aria-pressed')).toBe('false')
  })

  it('un clic notifica el cambio de herramienta', () => {
    const onToolChange = vi.fn()
    montar(onToolChange)
    fireEvent.click(screen.getByRole('toolbar').querySelector('[data-tool="measure"]')!)
    expect(onToolChange).toHaveBeenCalledWith('measure')
  })

  it('el título de cada botón explica la herramienta (pista de uso)', () => {
    montar()
    const wall = screen.getByRole('toolbar').querySelector('[data-tool="wall"]')!
    expect(wall.getAttribute('title')).toContain('Arrastra desde el punto inicial')
  })
})
