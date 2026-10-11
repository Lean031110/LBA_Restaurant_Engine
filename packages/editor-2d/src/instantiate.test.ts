import { describe, expect, it } from 'vitest'
import { getObjectPreset, getZonePreset } from '@lba/asset-catalog'
import { emptyScenario } from './document'
import {
  HINGE_KEY,
  OPENING_KEY,
  PRESET_ORIGIN_KEY,
  SLIDE_KEY,
  instantiateObject,
  instantiateZone,
} from './instantiate'

describe('instancia de presets de objeto', () => {
  it('una mesa hereda huella, material por defecto y propiedades del catálogo', () => {
    const preset = getObjectPreset('cat_table-round-4')!
    const obj = instantiateObject(preset, emptyScenario(), {
      position: { x: 2, y: 3 },
      rotation: 0,
    })
    expect(obj.kind).toBe('furniture')
    expect(obj.name).toBe(preset.label)
    expect(obj.position).toEqual({ x: 2, y: 3 })
    expect(obj.dimensions).toEqual(preset.dimensions)
    expect(obj.layer).toBe(preset.layer)
    expect(obj.tags).toEqual(preset.tags)
    expect(obj.material).toBe(
      preset.materials.find((m) => m.id === preset.defaultMaterialId)!.label,
    )
    expect(obj.color).toBe(
      preset.materials.find((m) => m.id === preset.defaultMaterialId)!.suggestedColor,
    )
    expect(obj.properties[PRESET_ORIGIN_KEY]).toBe('cat_table-round-4')
    expect(obj.properties['seats']).toBe(preset.parameters['seats']!.record.value)
    expect(obj.capacity).toBe(preset.parameters['seats']!.record.value)
  })

  it('el punto de interacción local se rota y traslada con el objeto', () => {
    const preset = getObjectPreset('cat_counter-straight-180')!
    const rotation = 90 as const
    const obj = instantiateObject(preset, emptyScenario(), {
      position: { x: 1, y: 1 },
      rotation,
    })
    // Punto local (0, depth/2 + 0.45) rotado 90°: (−y, x) + posición.
    const local = preset.interactionPoint
    const expectedX = 1 - local.y
    const expectedY = 1 + local.x
    expect(obj.interactionPoint.x).toBeCloseTo(expectedX, 10)
    expect(obj.interactionPoint.y).toBeCloseTo(expectedY, 10)
  })

  it('el muro usa la longitud del tramo en dimensions.width (convención del catálogo)', () => {
    const preset = getObjectPreset('cat_wall-interior-100')!
    const obj = instantiateObject(preset, emptyScenario(), {
      position: { x: 2, y: 0 },
      rotation: 0,
      wallLength: 5.5,
    })
    expect(obj.dimensions.width).toBe(5.5)
    expect(obj.dimensions.depth).toBe(preset.dimensions.depth)
    expect(obj.kind).toBe('wall')
    // El muro es pasivo: su punto de interacción es su centro.
    expect(obj.interactionPoint).toEqual({ x: 2, y: 0 })
  })

  it('las puertas declaran doorType y las propiedades visuales de apertura', () => {
    const swing = getObjectPreset('cat_door-swing-wood-90')!
    const door = instantiateObject(swing, emptyScenario(), {
      position: { x: 0, y: 0 },
      rotation: 0,
    })
    expect(door.kind).toBe('door')
    expect(door.doorType).toBe('swing')
    expect(door.properties[HINGE_KEY]).toBe('left')
    expect(door.properties[OPENING_KEY]).toBe('a')

    const sliding = getObjectPreset('cat_door-slide-glass-180')!
    const slide = instantiateObject(sliding, emptyScenario(), {
      position: { x: 0, y: 0 },
      rotation: 0,
    })
    expect(slide.doorType).toBe('sliding')
    expect(slide.properties[SLIDE_KEY]).toBe('right')
    expect(slide.properties[HINGE_KEY]).toBeUndefined()
  })

  it('respeta el material forzado cuando se indica', () => {
    const preset = getObjectPreset('cat_wall-interior-150')!
    const obj = instantiateObject(preset, emptyScenario(), {
      position: { x: 0, y: 0 },
      rotation: 0,
      materialId: 'drywall',
    })
    expect(obj.material).toBe('Placa de yeso')
    expect(obj.color).toBe('#e8e4dc')
  })

  it('los flags booleanos del preset pasan a properties', () => {
    const preset = getObjectPreset('cat_table-round-4')!
    const obj = instantiateObject(preset, emptyScenario(), {
      position: { x: 0, y: 0 },
      rotation: 0,
    })
    for (const [key, flag] of Object.entries(preset.flags)) {
      expect(obj.properties[key]).toBe(flag.value)
    }
  })
})

describe('instancia de presets de zona', () => {
  it('crea una zona con bounds, nombre y categoría del preset', () => {
    const preset = getZonePreset('cat_zone-kitchen')!
    const zone = instantiateZone(preset, emptyScenario(), {
      min: { x: 0, y: 0 },
      max: { x: 6, y: 4 },
    })
    expect(zone.name).toBe(preset.label)
    expect(zone.category).toBe('kitchen')
    expect(zone.bounds).toEqual({ min: { x: 0, y: 0 }, max: { x: 6, y: 4 } })
    expect(zone.allowedRoles).toEqual(preset.allowedRoles)
    expect(zone.id).toMatch(/^zone_/)
  })

  it('la capacidad estimada del preset se copia como valor inicial editable', () => {
    const preset = getZonePreset('cat_zone-dining')!
    const zone = instantiateZone(preset, emptyScenario(), {
      min: { x: 0, y: 0 },
      max: { x: 8, y: 6 },
    })
    expect(zone.capacity).toBe(preset.defaultCapacity!.record.value)
  })
})
