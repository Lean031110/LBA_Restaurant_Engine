/**
 * Prueba de humo de la pantalla base (FASE 01 + editor desde FASE 03):
 * arranque, título, controles de simulación de fases futuras deshabilitados
 * con explicación (regla 16) y presencia del editor 2D real (FASE 03).
 */
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { App } from './App'
import { createLogger } from './logger/core'
import { createLogStore } from './logger/store'

function montarApp() {
  const store = createLogStore()
  const logger = createLogger({ module: 'test', sink: () => undefined })
  return render(<App store={store} logger={logger} />)
}

describe('App — pantalla base', () => {
  it('muestra el nombre de la aplicación y su subtítulo', () => {
    montarApp()
    expect(
      screen.getByRole('heading', { level: 1, name: 'LBA_Restaurant_Engine' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Simulador de operaciones de restaurante')).toBeInTheDocument()
  })

  it('renderiza el editor 2D real (FASE 03): herramientas, catálogo, lienzo e inspector', () => {
    montarApp()
    // 8 herramientas del contrato en la barra izquierda (por data-tool: los
    // presets del catálogo también contienen palabras como «Pared»).
    const toolbar = screen.getByRole('toolbar', { name: 'Herramientas del editor' })
    for (const tool of [
      'select',
      'wall',
      'door',
      'window',
      'object',
      'zone',
      'measure',
      'delete',
    ]) {
      const button = toolbar.querySelector(`[data-tool="${tool}"]`)
      expect(button).not.toBeNull()
      expect(button?.getAttribute('aria-pressed')).toBe(tool === 'select' ? 'true' : 'false')
    }
    // Catálogo y lienzo con estado vacío explicado (03.3).
    expect(screen.getByLabelText('Catálogo de presets')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-empty-state')).toBeInTheDocument()
    // Inspector en modo escenario.
    expect(screen.getByTestId('inspector-scenario')).toBeInTheDocument()
    // El panel de eventos/estadísticas sigue siendo marcador de fase 09.
    expect(screen.getByText(/fase 09/)).toBeInTheDocument()
  })

  it('renderiza los controles de simulación deshabilitados y con explicación', () => {
    montarApp()
    for (const nombre of ['Iniciar', 'Pausar', 'Paso a paso', 'Reiniciar', 'Velocidad 1x']) {
      const boton = screen.getByRole('button', { name: nombre })
      expect(boton).toBeDisabled()
      expect(boton.getAttribute('title')).toMatch(/fase 04/)
    }
  })

  it('alterna entre el panel de eventos y el panel de diagnóstico', () => {
    montarApp()
    expect(screen.queryByRole('log')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Diagnóstico/ }))
    expect(screen.getByRole('log')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ver eventos/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Ver eventos/ }))
    expect(screen.queryByRole('log')).not.toBeInTheDocument()
  })

  it('no registra entradas de diagnóstico solo por montarse (sin log ruidoso)', () => {
    const store = createLogStore()
    const logger = createLogger({ module: 'test', sink: (e) => store.append(e) })
    render(<App store={store} logger={logger} />)
    // Regla de la guía: registrar operaciones importantes, no cada frame ni montaje.
    expect(store.size()).toBe(0)
  })
})
