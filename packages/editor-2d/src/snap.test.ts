import { describe, expect, it } from 'vitest'
import { WorldObjectSchema } from '@lba/domain'
import type { WorldObject } from '@lba/domain'
import { snapAngle, snapPoint, snapToWallEndpoints, snapWallEnd } from './snap'
import { DEFAULT_GRID } from './types'

/** Muro auxiliar centrado en (x,y) con longitud L y rotación dada. */
function wall(x: number, y: number, length: number, rotation: number): WorldObject {
  return WorldObjectSchema.parse({
    id: `obj_muro-${x}-${y}`,
    kind: 'wall',
    position: { x, y },
    rotation,
    dimensions: { width: length, depth: 0.1 },
    interactionPoint: { x, y },
    tags: ['estructura'],
    layer: 'structure',
    properties: {},
  })
}

describe('ajuste a cuadrícula', () => {
  it('ajusta al múltiplo de la celda cuando el snap está activo', () => {
    expect(snapPoint({ x: 0.26, y: 1.27 }, DEFAULT_GRID)).toEqual({ x: 0.5, y: 1.5 })
    expect(snapPoint({ x: 0.24, y: 1.27 }, { ...DEFAULT_GRID, snapEnabled: false })).toEqual({
      x: 0.24,
      y: 1.27,
    })
  })

  it('celda de 0.25 produce ajustes a cuartos', () => {
    expect(snapPoint({ x: 0.13, y: 0.63 }, { ...DEFAULT_GRID, size: 0.25 })).toEqual({
      x: 0.25,
      y: 0.75,
    })
  })
})

describe('ajuste de ángulo', () => {
  it('redondea al paso configurado (15° por defecto)', () => {
    expect(snapAngle(8, DEFAULT_GRID)).toBe(15)
    expect(snapAngle(7, DEFAULT_GRID)).toBe(0)
    expect(snapAngle(44, DEFAULT_GRID)).toBe(45)
    expect(snapAngle(7, { ...DEFAULT_GRID, snapEnabled: false })).toBe(7)
  })
})

describe('imán a extremos de muros', () => {
  it('engancha el extremo de un muro cercano', () => {
    const walls = [wall(2, 3, 4, 0)] // extremos en (0,3) y (4,3)
    expect(snapToWallEndpoints({ x: 0.1, y: 3.05 }, walls)).toEqual({ x: 0, y: 3 })
    expect(snapToWallEndpoints({ x: 3.95, y: 2.9 }, walls)).toEqual({ x: 4, y: 3 })
  })

  it('devuelve null si no hay extremos en el radio', () => {
    const walls = [wall(10, 10, 2, 0)]
    expect(snapToWallEndpoints({ x: 0, y: 0 }, walls)).toBeNull()
  })
})

describe('snapWallEnd: extremo de pared en curso', () => {
  it('con snap activo ajusta ángulo y longitud a la rejilla y recalcula el extremo', () => {
    // Cursor a 46° y 3.1 de distancia: ángulo → 45°, longitud → 3.0.
    const rawEnd = { x: 2.15, y: 2.226 } // ~3.1 a ~46°
    const snap = snapWallEnd({ x: 0, y: 0 }, rawEnd, [], DEFAULT_GRID)
    expect(snap.angleDeg).toBe(45)
    expect(snap.length).toBe(3)
    expect(snap.end.x).toBeCloseTo(3 * Math.cos(Math.PI / 4), 10)
    expect(snap.end.y).toBeCloseTo(3 * Math.sin(Math.PI / 4), 10)
    expect(snap.magnet).toBe(false)
  })

  it('el imán a extremos existentes gana sobre la rejilla (encadenado exacto)', () => {
    const walls = [wall(2, 0, 4, 0)] // extremos en (0,0) y (4,0)
    const snap = snapWallEnd({ x: 0, y: 0 }, { x: 0.12, y: 0.1 }, walls, DEFAULT_GRID)
    expect(snap.magnet).toBe(true)
    expect(snap.end).toEqual({ x: 0, y: 0 })
  })

  it('sin snap usa el punto exacto del cursor', () => {
    const snap = snapWallEnd({ x: 1, y: 1 }, { x: 2.13, y: 1.07 }, [], {
      ...DEFAULT_GRID,
      snapEnabled: false,
    })
    expect(snap.end).toEqual({ x: 2.13, y: 1.07 })
    expect(snap.length).toBeCloseTo(1.132, 2)
  })
})
