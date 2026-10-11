import { describe, expect, it } from 'vitest'
import { WorldObjectSchema } from '@lba/domain'
import type { WorldObject } from '@lba/domain'
import { getObjectPreset } from '@lba/asset-catalog'
import { createEmptyDocument } from './document'
import { instantiateObject } from './instantiate'
import { dimensionLimitsFor, rangeErrorMessage } from './validation'

function muro(id: string, length: number): WorldObject {
  const preset = getObjectPreset('cat_wall-interior-100')!
  const obj = instantiateObject(preset, createEmptyDocument().scenario, {
    position: { x: 0, y: 0 },
    rotation: 0,
    wallLength: length,
  })
  return WorldObjectSchema.parse({ ...obj, id })
}

describe('límites de dimensión declarados por el catálogo', () => {
  it('un muro del catálogo usa el rango del parámetro length (0.1–50 m)', () => {
    const wall = muro('obj_muro-a', 3)
    expect(dimensionLimitsFor(wall, 'length')).toEqual({ min: 0.1, max: 50 })
  })

  it('un mueble sin parámetro de ancho cae a los límites de seguridad', () => {
    const preset = getObjectPreset('cat_table-round-4')!
    const table = WorldObjectSchema.parse({
      ...instantiateObject(preset, createEmptyDocument().scenario, {
        position: { x: 0, y: 0 },
        rotation: 0,
      }),
      id: 'obj_mesa-a',
    })
    expect(dimensionLimitsFor(table, 'width')).toEqual({ min: 0.05, max: 100 })
  })

  it('un objeto sin origen de catálogo usa los límites de seguridad', () => {
    const wall = muro('obj_muro-a', 3)
    const orphan: WorldObject = { ...wall, properties: {} }
    expect(dimensionLimitsFor(orphan, 'length')).toEqual({ min: 0.05, max: 100 })
  })

  it('rangeErrorMessage cita unidad, rango y procedencia', () => {
    const msg = rangeErrorMessage('Longitud del tramo', 60, { min: 0.1, max: 50 }, 'm')
    expect(msg).toContain('Longitud del tramo')
    expect(msg).toContain('60 m')
    expect(msg).toContain('entre 0.1 y 50 m')
    expect(msg).toContain('catálogo')
  })
})
