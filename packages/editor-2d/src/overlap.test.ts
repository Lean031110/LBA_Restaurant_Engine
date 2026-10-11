import { describe, expect, it } from 'vitest'
import { WorldObjectSchema } from '@lba/domain'
import type { WorldObject } from '@lba/domain'
import { getObjectPreset } from '@lba/asset-catalog'
import { createEmptyDocument } from './document'
import { instantiateObject } from './instantiate'
import { computeOverlappingObjects } from './overlap'

let seq = 0
function mueble(presetId: string, x: number, y: number, rotation = 0): WorldObject {
  const preset = getObjectPreset(presetId)!
  const obj = instantiateObject(preset, createEmptyDocument().scenario, {
    position: { x, y },
    rotation: rotation as never,
  })
  seq += 1
  return WorldObjectSchema.parse({ ...obj, id: `obj_mueble-${seq}` })
}

describe('advertencia de solapamiento (aviso geométrico)', () => {
  it('dos mesas superpuestas generan advertencia para ambas', () => {
    const overlapping = computeOverlappingObjects([
      mueble('cat_table-round-4', 0, 0),
      mueble('cat_table-round-4', 0.3, 0),
    ])
    expect(overlapping).toHaveLength(2)
  })

  it('mesas separadas no generan advertencia', () => {
    const overlapping = computeOverlappingObjects([
      mueble('cat_table-round-4', 0, 0),
      mueble('cat_table-round-4', 4, 0),
    ])
    expect(overlapping).toHaveLength(0)
  })

  it('el contacto por esquina no cuenta como solape', () => {
    // Dos mesas de 1.1 de diámetro: centros a 1.1 de distancia se tocan por el borde.
    const overlapping = computeOverlappingObjects([
      mueble('cat_table-round-4', 0, 0),
      mueble('cat_table-round-4', 1.15, 0),
    ])
    expect(overlapping).toHaveLength(0)
  })

  it('el solape rotado también se detecta', () => {
    const overlapping = computeOverlappingObjects([
      mueble('cat_table-rect-6', 0, 0, 30),
      mueble('cat_table-rect-6', 0.4, 0.2, 30),
    ])
    expect(overlapping).toHaveLength(2)
  })

  it('muros, puertas y ventanas se excluyen del aviso (encuentros legítimos)', () => {
    const wallPreset = getObjectPreset('cat_wall-interior-100')!
    const wall1 = WorldObjectSchema.parse({
      ...instantiateObject(wallPreset, createEmptyDocument().scenario, {
        position: { x: 2, y: 0 },
        rotation: 0,
        wallLength: 4,
      }),
      id: 'obj_muro-a',
    })
    const wall2 = WorldObjectSchema.parse({
      ...instantiateObject(wallPreset, createEmptyDocument().scenario, {
        position: { x: 4, y: 2 },
        rotation: 90,
        wallLength: 4,
      }),
      id: 'obj_muro-b',
    })
    // Se cruzan en (4,0): encuentro en T perfectamente legítimo.
    expect(computeOverlappingObjects([wall1, wall2])).toHaveLength(0)
  })
})
