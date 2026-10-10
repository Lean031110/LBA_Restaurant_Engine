import { CATALOG } from './catalog'
import { CatalogGroupSchema, type CatalogObjectPreset, type CatalogZonePreset } from './preset'

/**
 * Tabla de presets para la evidencia de FASE 02 (prompt 02.4: «Guarda
 * evidencia, tests y una tabla de presets»). La tabla se GENERA desde el
 * catálogo (única fuente de verdad) y se sincroniza por test con un file
 * snapshot: si el catálogo cambia sin regenerar la tabla, el CI falla.
 * Regenerar: `npx vitest run -u` dentro de este paquete.
 *
 * Orden determinista: grupos en el orden fijo del enum, presets por label
 * (es) dentro de cada grupo; zonas por el orden fijo de categorías.
 */

/** Formatea un número sin ceros decorativos (3, 0.9, 2.4). */
function num(value: number): string {
  return String(value)
}

/** Resumen de unidades de los parámetros de un preset, en orden del enum. */
function parameterSummary(preset: CatalogObjectPreset): string {
  const entries = Object.values(preset.parameters)
  if (entries.length === 0) {
    return '—'
  }
  const byUnit = new Map<string, number>()
  for (const spec of entries) {
    const unit = spec.record.unit
    byUnit.set(unit, (byUnit.get(unit) ?? 0) + 1)
  }
  const parts = [...byUnit.entries()].map(([unit, count]) => `${unit}×${count}`)
  return `${entries.length} (${parts.join(', ')})`
}

function flagsSummary(preset: CatalogObjectPreset): string {
  const entries = Object.values(preset.flags)
  if (entries.length === 0) {
    return '—'
  }
  return String(entries.length)
}

function objectRow(preset: CatalogObjectPreset): string {
  const defaultMaterial =
    preset.materials.find((m) => m.id === preset.defaultMaterialId)?.label ??
    preset.defaultMaterialId
  return `| \`${preset.id}\` | ${preset.group} | ${preset.label} | ${num(preset.dimensions.width)} × ${num(preset.dimensions.depth)} | ${num(preset.heightM)} | ${defaultMaterial} | ${parameterSummary(preset)} | ${flagsSummary(preset)} |`
}

function zoneRow(zone: CatalogZonePreset): string {
  const capacity = `${zone.defaultCapacity.record.value} ${zone.defaultCapacity.record.unit}`
  const roles = zone.allowedRoles.length > 0 ? zone.allowedRoles.join(', ') : 'sin restricción'
  return `| \`${zone.id}\` | ${zone.category} | ${zone.label} | ${num(zone.suggestedSize.width)} × ${num(zone.suggestedSize.depth)} | ${capacity} | ${roles} |`
}

/** Renderiza la tabla completa de presets en Markdown determinista. */
export function renderPresetTable(): string {
  const lines: string[] = []
  lines.push('# Tabla de presets del catálogo (FASE 02)')
  lines.push('')
  lines.push(
    '> Generada desde `@lba/asset-catalog` con `renderPresetTable()`; el test `table.test.ts` la mantiene sincronizada (file snapshot). Regenerar: `npx vitest run -u`.',
  )
  lines.push('')

  const objectList = [...CATALOG.objects.values()]
  lines.push(`## Presets de objeto (${objectList.length})`)
  lines.push('')
  lines.push(
    '| ID | Grupo | Etiqueta | Huella (m) | Altura (m) | Material por defecto | Parámetros | Flags |',
  )
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
  for (const group of CatalogGroupSchema.options) {
    const members = objectList
      .filter((p) => p.group === group)
      .sort((a, b) => a.label.localeCompare(b.label, 'es'))
    for (const preset of members) {
      lines.push(objectRow(preset))
    }
  }
  lines.push('')

  const zoneList = [...CATALOG.zones.values()]
  lines.push(`## Presets de zona (${zoneList.length})`)
  lines.push('')
  lines.push(
    '| ID | Categoría | Etiqueta | Tamaño sugerido (m) | Capacidad por defecto | Roles permitidos |',
  )
  lines.push('| --- | --- | --- | --- | --- | --- |')
  // Zonas en el orden fijo de categorías del dominio.
  const categoryOrder = [
    'kitchen',
    'preparation',
    'dining',
    'bar',
    'vip',
    'pizzeria',
    'dishwashing',
    'storage',
    'restroom',
    'exit',
    'corridor',
  ] as const
  for (const category of categoryOrder) {
    for (const zone of zoneList.filter((z) => z.category === category)) {
      lines.push(zoneRow(zone))
    }
  }
  lines.push('')

  lines.push('## Notas')
  lines.push('')
  lines.push('- Huella y tamaño en metros de mundo (docs/guia/01); nunca píxeles de pantalla.')
  lines.push(
    '- Parámetros: total y desglose por unidad (s, C, m, cm, persons, unit, %). Todos son estimaciones de ejemplo con procedencia completa (regla 10).',
  )
  lines.push('- Flags: propiedades booleanas (sin unidad; no son magnitudes).')
  lines.push(
    '- Roles «sin restricción» = sin restricción DECLARADA (contrato del dominio), no prohibición.',
  )
  lines.push('')

  return lines.join('\n')
}
