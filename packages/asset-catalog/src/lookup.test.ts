import { describe, expect, it } from 'vitest'
import {
  getObjectPreset,
  getZonePreset,
  listObjectPresetsByGroup,
  listZonePresetsByCategory,
  listPresetsByEquipmentKind,
  objectPresetIds,
  zonePresetIds,
  getCatalog,
} from './lookup'
import { CATALOG } from './catalog'

/**
 * Pruebas de las consultas del catálogo. Las búsquedas por grupo vuelven
 * ordenadas por label (es) para que el editor las muestre estable.
 */

describe('consultas por ID', () => {
  it('getObjectPreset devuelve el preset o undefined', () => {
    const preset = getObjectPreset('cat_table-round-4')
    expect(preset?.group).toBe('table')
    expect(getObjectPreset('cat_no-existe')).toBeUndefined()
  })

  it('getZonePreset devuelve la zona o undefined', () => {
    const zone = getZonePreset('cat_zone-dining')
    expect(zone?.category).toBe('dining')
    expect(getZonePreset('cat_zone-no-existe')).toBeUndefined()
  })
})

describe('consultas por grupo y categoría', () => {
  it('listObjectPresetsByGroup filtra y ordena por label (es)', () => {
    const tables = listObjectPresetsByGroup('table')
    expect(tables.length).toBeGreaterThanOrEqual(5)
    const labels = tables.map((t) => t.label)
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'es')))
    for (const table of tables) {
      expect(table.group).toBe('table')
    }
  })

  it('listZonePresetsByCategory filtra por categoría', () => {
    const kitchens = listZonePresetsByCategory('kitchen')
    expect(kitchens.length).toBeGreaterThanOrEqual(1)
    for (const zone of kitchens) {
      expect(zone.category).toBe('kitchen')
    }
    expect(listZonePresetsByCategory('exit')).toHaveLength(1)
  })

  it('listPresetsByEquipmentKind filtra por tipo de equipo', () => {
    const griddles = listPresetsByEquipmentKind('griddle')
    expect(griddles.length).toBeGreaterThanOrEqual(1)
    for (const preset of griddles) {
      expect(preset.equipmentKind).toBe('griddle')
      expect(preset.family).toBe('equipment')
    }
  })
})

describe('listas de IDs', () => {
  it('objectPresetIds y zonePresetIds vuelven ordenadas y completas', () => {
    const objectIds = objectPresetIds()
    const zoneIds = zonePresetIds()
    expect(objectIds).toEqual([...objectIds].sort())
    expect(zoneIds).toEqual([...zoneIds].sort())
    expect(objectIds.length).toBe(CATALOG.objects.size)
    expect(zoneIds.length).toBe(CATALOG.zones.size)
    expect(objectIds.includes('cat_griddle-120')).toBe(true)
    expect(zoneIds.includes('cat_zone-vip')).toBe(true)
  })
})

describe('getCatalog', () => {
  it('devuelve el catálogo único del proyecto', () => {
    const catalog = getCatalog()
    expect(catalog).toBe(CATALOG)
    expect(catalog.objects.size).toBeGreaterThan(30)
    expect(catalog.zones.size).toBe(11)
  })
})
