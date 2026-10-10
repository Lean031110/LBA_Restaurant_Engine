import { describe, expect, it } from 'vitest'
import { ICONS } from './icons'
import { IconIdSchema } from './preset'
import { ZONE_PRESETS } from './data/zones'
import { EQUIPMENT_PRESETS } from './data/equipment'
import { FURNITURE_PRESETS } from './data/furniture'
import { STRUCTURE_PRESETS } from './data/structure'

/**
 * Pruebas del registro de iconos: cobertura 1:1 con IconId, sintaxis SVG
 * válida y originalidad documentada (obra del proyecto; sin descargas).
 */

const ALL_PRESETS = [...STRUCTURE_PRESETS, ...FURNITURE_PRESETS, ...EQUIPMENT_PRESETS]

describe('registro de iconos', () => {
  it('el registro cubre exactamente los valores de IconIdSchema (1:1)', () => {
    const iconKeys = Object.keys(ICONS).sort()
    const enumOptions = [...IconIdSchema.options].sort()
    expect(iconKeys).toEqual(enumOptions)
    expect(new Set(iconKeys).size).toBe(iconKeys.length)
  })

  it('todo icono usa viewBox "0 0 24 24" y un trazado no vacío', () => {
    for (const [id, icon] of Object.entries(ICONS)) {
      expect(icon.viewBox, id).toBe('0 0 24 24')
      expect(icon.path.length, id).toBeGreaterThan(0)
    }
  })

  it('los trazados solo usan comandos SVG y números válidos', () => {
    const validPath = /^[MmLlHhVvCcSsAaZz0-9 ,.\-]+$/
    for (const [id, icon] of Object.entries(ICONS)) {
      expect(validPath.test(icon.path), `icono ${id} con caracteres no SVG`).toBe(true)
    }
  })

  it('todo preset de objeto y de zona referencia un icono existente', () => {
    for (const preset of ALL_PRESETS) {
      expect(ICONS[preset.iconId], `${preset.id} → ${preset.iconId}`).toBeDefined()
    }
    for (const zone of ZONE_PRESETS) {
      expect(ICONS[zone.iconId], `${zone.id} → ${zone.iconId}`).toBeDefined()
    }
  })
})
