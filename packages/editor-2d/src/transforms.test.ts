import { describe, expect, it } from 'vitest'
import {
  clampZoom,
  fitRect,
  initialViewport,
  screenToWorld,
  worldToScreen,
  zoomAt,
} from './transforms'
import { ZOOM_MAX, ZOOM_MIN } from './types'

/** Pruebas mínimas requeridas (03.4): transformaciones y conversiones mundo-píxel. */
describe('transformaciones mundo ↔ pantalla', () => {
  it('convierte mundo→pantalla y pantalla→mundo de forma inversa', () => {
    const view = { pixelsPerUnit: 60, pan: { x: 40, y: 30 } }
    const world = { x: 2.5, y: -1.25 }
    const screen = worldToScreen(world, view)
    expect(screen).toEqual({ x: 2.5 * 60 + 40, y: -1.25 * 60 + 30 })
    expect(screenToWorld(screen, view)).toEqual(world)
  })

  it('el zoom no cambia el punto del mundo bajo el ancla', () => {
    const view = initialViewport()
    const anchor = { x: 320, y: 180 }
    const before = screenToWorld(anchor, view)
    const zoomed = zoomAt(view, 1.5, anchor)
    const after = screenToWorld(anchor, zoomed)
    expect(after.x).toBeCloseTo(before.x, 10)
    expect(after.y).toBeCloseTo(before.y, 10)
  })

  it('el zoom respeta los límites absolutes', () => {
    expect(clampZoom(0.001)).toBe(ZOOM_MIN)
    expect(clampZoom(99999)).toBe(ZOOM_MAX)
    const min = zoomAt({ pixelsPerUnit: ZOOM_MIN, pan: { x: 0, y: 0 } }, 0.01, { x: 0, y: 0 })
    expect(min.pixelsPerUnit).toBe(ZOOM_MIN)
  })

  it('zoom con factor 1 devuelve la misma vista (sin derivas)', () => {
    const view = { pixelsPerUnit: 42, pan: { x: 7, y: 9 } }
    expect(zoomAt(view, 1, { x: 100, y: 100 })).toBe(view)
  })

  it('fitRect encaja el mundo con margen y lo centra', () => {
    const view = fitRect({ width: 12, depth: 8 }, { width: 800, height: 600 }, 40)
    expect(view.pixelsPerUnit).toBeGreaterThan(0)
    // El rectángulo del mundo en pantalla debe caber en el área útil.
    const w = 12 * view.pixelsPerUnit
    const h = 8 * view.pixelsPerUnit
    expect(w).toBeLessThanOrEqual(800 - 40)
    expect(h).toBeLessThanOrEqual(600 - 40)
    // Centrado: márgenes iguales a ambos lados.
    expect(view.pan.x * 2 + w).toBeCloseTo(800, 6)
    expect(view.pan.y * 2 + h).toBeCloseTo(600, 6)
  })

  it('fitRect con rectángulo degenerado cae en la vista inicial', () => {
    expect(fitRect({ width: 0, depth: 8 }, { width: 800, height: 600 })).toEqual(initialViewport())
  })

  it('la ubicación y las unidades son independientes de píxeles: cambiar zoom no altera el mundo', () => {
    const world = { x: 3, y: 4 }
    const v1 = { pixelsPerUnit: 30, pan: { x: 0, y: 0 } }
    const v2 = { pixelsPerUnit: 120, pan: { x: 10, y: -5 } }
    // El punto del mundo es el mismo: solo cambia su proyección a pantalla.
    expect(screenToWorld(worldToScreen(world, v1), v1)).toEqual(world)
    expect(screenToWorld(worldToScreen(world, v2), v2)).toEqual(world)
  })
})
