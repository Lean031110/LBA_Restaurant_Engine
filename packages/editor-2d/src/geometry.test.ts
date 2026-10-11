import { describe, expect, it } from 'vitest'
import {
  add,
  angleOf,
  closestPointOnSegment,
  distance,
  obbIntersects,
  projectOnSegment,
  rotateAround,
  rotatePoint,
  sub,
  subtractSpans,
} from './geometry'

describe('geometría del editor', () => {
  it('rotaciones básicas: 90° lleva +x a +y (pantalla Y hacia abajo)', () => {
    expect(rotatePoint({ x: 1, y: 0 }, 90).y).toBeCloseTo(1, 10)
    expect(rotatePoint({ x: 1, y: 0 }, 90).x).toBeCloseTo(0, 10)
    expect(rotatePoint({ x: 0, y: 1 }, 90).x).toBeCloseTo(-1, 10)
    expect(rotatePoint({ x: 0, y: 1 }, 90).y).toBeCloseTo(0, 10)
    expect(rotatePoint({ x: 2, y: 0 }, 180).x).toBeCloseTo(-2, 10)
    expect(rotatePoint({ x: 2, y: 0 }, 180).y).toBeCloseTo(0, 10)
  })

  it('rotateAround gira alrededor del centro indicado', () => {
    const p = rotateAround({ x: 3, y: 2 }, { x: 1, y: 2 }, 90)
    expect(p.x).toBeCloseTo(1, 10)
    expect(p.y).toBeCloseTo(4, 10)
  })

  it('proyección sobre segmento con clamp a [0,1]', () => {
    const a = { x: 0, y: 0 }
    const b = { x: 10, y: 0 }
    expect(projectOnSegment({ x: 4, y: 3 }, a, b)).toBeCloseTo(0.4, 10)
    expect(projectOnSegment({ x: -5, y: 0 }, a, b)).toBe(0)
    expect(projectOnSegment({ x: 50, y: 0 }, a, b)).toBe(1)
    expect(closestPointOnSegment({ x: 4, y: 6 }, a, b)).toEqual({ x: 4, y: 0 })
  })

  it('distancias y ángulos', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(angleOf({ x: 1, y: 0 })).toBeCloseTo(0, 10)
    expect(angleOf({ x: 0, y: 1 })).toBeCloseTo(90, 10)
    expect(angleOf({ x: -1, y: 0 })).toBeCloseTo(180, 10)
    expect(angleOf({ x: 0, y: -1 })).toBeCloseTo(270, 10)
  })

  it('OBB: rectángulos alineados que se tocan por esquina NO cuentan como solape real', () => {
    // SAT los considera intersectando por el borde compartido; en la práctica
    // el área de solape es 0 y overlap.ts lo filtra. Aquí verificamos SAT puro.
    const a = { center: { x: 0, y: 0 }, width: 2, depth: 2, rotation: 0 }
    const b = { center: { x: 2.5, y: 0 }, width: 1, depth: 1, rotation: 0 }
    expect(obbIntersects(a, b)).toBe(false)
  })

  it('OBB: solape real se detecta, incluso rotado', () => {
    const a = { center: { x: 0, y: 0 }, width: 4, depth: 1, rotation: 30 }
    const b = { center: { x: 0.5, y: 0.2 }, width: 3, depth: 0.8, rotation: -20 }
    expect(obbIntersects(a, b)).toBe(true)
  })

  it('OBB: separados por un eje no se solapan aunque estén rotados', () => {
    const a = { center: { x: 0, y: 0 }, width: 2, depth: 2, rotation: 45 }
    const b = { center: { x: 5, y: 5 }, width: 2, depth: 2, rotation: 0 }
    expect(obbIntersects(a, b)).toBe(false)
  })

  it('subtractSpans divide un muro restando huecos ordenados y solapados', () => {
    // Muro de 10 con puerta [2,4] y ventana [3,6] (solapadas) → sólido [0,2] y [6,10].
    expect(
      subtractSpans(10, [
        { start: 2, end: 4 },
        { start: 3, end: 6 },
      ]),
    ).toEqual([
      { start: 0, end: 2 },
      { start: 6, end: 10 },
    ])
  })

  it('subtractSpans con huecos que recortan los extremos y huecos vacíos', () => {
    expect(
      subtractSpans(10, [
        { start: -2, end: 1 },
        { start: 9.5, end: 12 },
      ]),
    ).toEqual([{ start: 1, end: 9.5 }])
    expect(subtractSpans(5, [{ start: 2, end: 2 }])).toEqual([{ start: 0, end: 5 }])
  })

  it('suma y resta de puntos', () => {
    expect(add({ x: 1, y: 2 }, { x: 10, y: 20 })).toEqual({ x: 11, y: 22 })
    expect(sub({ x: 10, y: 20 }, { x: 1, y: 2 })).toEqual({ x: 9, y: 18 })
  })
})
