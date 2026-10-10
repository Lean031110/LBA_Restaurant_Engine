import { describe, expect, it } from 'vitest'
import { renderPresetTable } from './table'
import { CATALOG } from './catalog'

/**
 * Sincronización de la tabla de presets (prompt 02.4): la tabla del
 * repositorio (PRESET_TABLE.md) debe ser EXACTAMENTE la que genera el
 * catálogo. Si el catálogo cambia, regenerar con `npx vitest run -u`.
 */

describe('renderPresetTable', () => {
  it('coincide con el archivo comprometido (file snapshot)', async () => {
    await expect(renderPresetTable()).toMatchFileSnapshot('../PRESET_TABLE.md')
  })

  it('contiene todos los IDs de presets de objeto y de zona', () => {
    const table = renderPresetTable()
    for (const preset of CATALOG.objects.values()) {
      expect(table).toContain(preset.id)
    }
    for (const zone of CATALOG.zones.values()) {
      expect(table).toContain(zone.id)
    }
  })

  it('declara las secciones y los recuentos correctos', () => {
    const table = renderPresetTable()
    expect(table).toContain(`## Presets de objeto (${CATALOG.objects.size})`)
    expect(table).toContain(`## Presets de zona (${CATALOG.zones.size})`)
    expect(table).toContain('## Notas')
  })

  it('es determinista: dos renderizados son idénticos', () => {
    expect(renderPresetTable()).toBe(renderPresetTable())
  })
})
