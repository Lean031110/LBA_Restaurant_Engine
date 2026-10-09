/**
 * Prueba de humo de la pantalla base (FASE 01):
 * arranque, título, paneles de fases futuras y controles deshabilitados
 * con explicación (regla 16 de la guía).
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

  it('muestra los paneles de fases futuras con su fase correspondiente', () => {
    montarApp()
    expect(screen.getByRole('heading', { name: 'Herramientas' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lienzo 2D' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Inspector' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Eventos y estadísticas' })).toBeInTheDocument()
    // La guía exige explicar qué fase construirá cada panel.
    expect(screen.getAllByText(/fase 03/).length).toBeGreaterThanOrEqual(3)
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
