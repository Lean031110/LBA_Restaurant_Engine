import { describe, expect, it } from 'vitest'
import {
  aabbIntersects,
  closestPointOnSegment,
  obbCorners,
  rotatedRectAabb,
  scale,
  subtractSpans,
} from './geometry'
import {
  DEFAULT_GRID,
  GRID_SIZE_OPTIONS,
  HISTORY_LIMIT,
  MESSAGE_LIMIT,
  TOOL_HINTS,
  TOOL_IDS,
  TOOL_LABELS,
  ZOOM_MAX,
  ZOOM_MIN,
  formatLength,
  marqueeRect,
  normalizeRotation,
} from './types'

describe('utilidades de tipos del editor', () => {
  it('formatLength recorta a 2 decimales y respeta la unidad', () => {
    expect(formatLength(3.4567, 'm')).toBe('3.46 m')
    expect(formatLength(120, 'cm')).toBe('120 cm')
    expect(formatLength(0.5, 'm')).toBe('0.5 m')
  })

  it('normalizeRotation envuelve a [0, 360)', () => {
    expect(normalizeRotation(-15)).toBe(345)
    expect(normalizeRotation(725)).toBeCloseTo(5, 10)
    expect(normalizeRotation(180)).toBe(180)
    expect(normalizeRotation(0)).toBe(0)
  })

  it('marqueeRect normaliza en cualquier dirección de arrastre', () => {
    expect(marqueeRect({ start: { x: 4, y: 3 }, current: { x: 0, y: 0 } })).toEqual({
      min: { x: 0, y: 0 },
      max: { x: 4, y: 3 },
    })
    expect(marqueeRect({ start: { x: 0, y: 3 }, current: { x: 4, y: 0 } })).toEqual({
      min: { x: 0, y: 0 },
      max: { x: 4, y: 3 },
    })
  })

  it('constantes del contrato: 8 herramientas con etiqueta y pista', () => {
    expect(TOOL_IDS).toHaveLength(8)
    for (const tool of TOOL_IDS) {
      expect(TOOL_LABELS[tool].length).toBeGreaterThan(0)
      expect(TOOL_HINTS[tool].length).toBeGreaterThan(0)
    }
    expect(GRID_SIZE_OPTIONS.length).toBeGreaterThan(0)
    expect(DEFAULT_GRID.snapEnabled).toBe(true)
    expect(HISTORY_LIMIT).toBeGreaterThan(0)
    expect(MESSAGE_LIMIT).toBeGreaterThan(0)
    expect(ZOOM_MIN).toBeLessThan(ZOOM_MAX)
  })
})

describe('geometría: ramas adicionales', () => {
  it('scale multiplica un vector', () => {
    expect(scale({ x: 2, y: -3 }, 2)).toEqual({ x: 4, y: -6 })
  })

  it('segmento degenerado: la proyección cae en el punto único', () => {
    const p = { x: 5, y: 5 }
    expect(closestPointOnSegment({ x: 1, y: 0 }, p, p)).toEqual(p)
  })

  it('aabbIntersects con y sin tolerancia', () => {
    const a = { minX: 0, minY: 0, maxX: 2, maxY: 2 }
    const far = { minX: 3, minY: 3, maxX: 4, maxY: 4 }
    expect(aabbIntersects(a, far)).toBe(false)
    expect(aabbIntersects(a, far, 2)).toBe(true)
    const near = { minX: 2, minY: 2, maxX: 3, maxY: 3 }
    expect(aabbIntersects(a, near)).toBe(true)
  })

  it('rotatedRectAabb contiene las 4 esquinas rotadas', () => {
    const box = rotatedRectAabb({ x: 0, y: 0 }, 2, 2, 45)
    expect(box.minX).toBeCloseTo(-Math.SQRT2, 10)
    expect(box.maxX).toBeCloseTo(Math.SQRT2, 10)
    expect(box.minY).toBeCloseTo(-Math.SQRT2, 10)
    expect(box.maxY).toBeCloseTo(Math.SQRT2, 10)
  })

  it('obbCorners devuelve 4 esquinas coherentes con la rotación', () => {
    const corners = obbCorners({ x: 0, y: 0 }, 2, 2, 0)
    expect(corners).toEqual([
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: -1, y: 1 },
    ])
  })

  it('subtractSpans sin huecos devuelve el tramo completo', () => {
    expect(subtractSpans(5, [])).toEqual([{ start: 0, end: 5 }])
  })
})
