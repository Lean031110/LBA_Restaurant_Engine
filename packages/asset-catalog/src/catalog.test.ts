import { describe, expect, it } from 'vitest'
import {
  CatalogGroupSchema,
  CatalogObjectPresetSchema,
  CatalogZonePresetSchema,
  INTERACTION_POINT_MAX_OFFSET_M,
  type CatalogObjectPreset,
} from './preset'
import { CATALOG, buildCatalog } from './catalog'
import { EQUIPMENT_PRESETS } from './data/equipment'
import { FURNITURE_PRESETS } from './data/furniture'
import { STRUCTURE_PRESETS } from './data/structure'
import { ZONE_PRESETS } from './data/zones'
import { EquipmentKindSchema, UNIT_CONSTRAINTS, ZoneCategorySchema } from '@lba/domain'

/**
 * Integridad del catálogo (prompt 02.2):
 *
 * 1. Todos los presets pasan sus esquemas (re-parse real, no confianza de tipos).
 * 2. Cobertura completa: 21/21 grupos, 12/12 EquipmentKind, 11/11 ZoneCategory.
 * 3. Anti-contradicción: los rangos declarados no pueden contradecir a
 *    UNIT_CONSTRAINTS de @lba/domain (única fuente de verdad).
 * 4. Honestidad de estimaciones: sourceType "estimated", confianza "low",
 *    supuestos y fecha de registro presentes en TODO parámetro.
 * 5. Coherencia de datos: length de pared = dimensions.width; punto de
 *    interacción dentro del anillo; huella poligonal dentro de dimensions.
 * 6. Propiedades obligatorias por grupo/equipo según docs/guia/02.
 * 7. Auditoría estructural: el código fuente del paquete no re-implementa
 *    reglas de unidades (prohibición de la decisión 02.1-c).
 */

// Aumento de tipos para import.meta.glob (transformación de vitest):
// el paquete no depende de node:fs ni de vite/client para la auditoría.
declare global {
  interface ImportMeta {
    readonly glob: (
      patterns: string | string[],
      options?: { query?: string; import?: string; eager?: boolean },
    ) => Record<string, unknown>
  }
}

const ALL_OBJECT_PRESETS: readonly CatalogObjectPreset[] = [
  ...STRUCTURE_PRESETS,
  ...FURNITURE_PRESETS,
  ...EQUIPMENT_PRESETS,
]

describe('integridad de esquemas del catálogo', () => {
  it('todos los presets de objeto pasan CatalogObjectPresetSchema', () => {
    for (const preset of ALL_OBJECT_PRESETS) {
      const result = CatalogObjectPresetSchema.safeParse(preset)
      expect(result.success, `preset ${preset.id} debería ser válido`).toBe(true)
    }
  })

  it('todos los presets de zona pasan CatalogZonePresetSchema', () => {
    for (const zone of ZONE_PRESETS) {
      const result = CatalogZonePresetSchema.safeParse(zone)
      expect(result.success, `zona ${zone.id} debería ser válida`).toBe(true)
    }
  })

  it('buildCatalog rechaza IDs duplicados', () => {
    expect(() => buildCatalog([STRUCTURE_PRESETS[0], STRUCTURE_PRESETS[0]], [])).toThrow(
      /duplicado/,
    )
    expect(() => buildCatalog([], [ZONE_PRESETS[0], ZONE_PRESETS[0]])).toThrow(/duplicado/)
  })

  it('el catálogo real no tiene IDs duplicados ni colisionados', () => {
    const objectIds = ALL_OBJECT_PRESETS.map((p) => p.id)
    const zoneIds = ZONE_PRESETS.map((z) => z.id)
    expect(new Set(objectIds).size).toBe(objectIds.length)
    expect(new Set(zoneIds).size).toBe(zoneIds.length)
    expect(objectIds.filter((id) => zoneIds.includes(id))).toEqual([])
    expect(CATALOG.objects.size).toBe(objectIds.length)
    expect(CATALOG.zones.size).toBe(zoneIds.length)
  })
})

describe('cobertura del catálogo', () => {
  it('cubre los 21 grupos de objeto con al menos un preset', () => {
    for (const group of CatalogGroupSchema.options) {
      const members = ALL_OBJECT_PRESETS.filter((p) => p.group === group)
      expect(members.length, `grupo ${group} sin presets`).toBeGreaterThan(0)
    }
  })

  it('cubre los 12 EquipmentKind con al menos un preset de equipo', () => {
    for (const kind of EquipmentKindSchema.options) {
      const members = ALL_OBJECT_PRESETS.filter((p) => p.equipmentKind === kind)
      expect(members.length, `equipo ${kind} sin presets`).toBeGreaterThan(0)
    }
  })

  it('cubre las 11 categorías de zona con al menos un preset', () => {
    for (const category of ZoneCategorySchema.options) {
      const members = ZONE_PRESETS.filter((z) => z.category === category)
      expect(members.length, `categoría ${category} sin presets`).toBeGreaterThan(0)
    }
  })
})

describe('anti-contradicción con UNIT_CONSTRAINTS (única fuente de verdad)', () => {
  it('ningún rango declarado contradice las cotas de su unidad', () => {
    const failures: string[] = []
    for (const preset of ALL_OBJECT_PRESETS) {
      for (const [key, spec] of Object.entries(preset.parameters)) {
        const { record } = spec
        const constraints = UNIT_CONSTRAINTS[record.unit]
        if (constraints.min !== undefined && record.minValue !== undefined) {
          if (record.minValue < constraints.min) {
            failures.push(
              `${preset.id}.${key}: minValue ${record.minValue} < cota ${constraints.min} de ${record.unit}`,
            )
          }
        }
        if (constraints.max !== undefined && record.maxValue !== undefined) {
          if (record.maxValue > constraints.max) {
            failures.push(
              `${preset.id}.${key}: maxValue ${record.maxValue} > cota ${constraints.max} de ${record.unit}`,
            )
          }
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('todos los parámetros re-validan con ParameterRecordSchema del dominio', () => {
    // El tipo TS no ejecuta refinamientos: este re-parse los ejecuta de verdad.
    for (const preset of ALL_OBJECT_PRESETS) {
      const result = CatalogObjectPresetSchema.safeParse(preset)
      expect(result.success, `re-parse falló para ${preset.id}`).toBe(true)
    }
    for (const zone of ZONE_PRESETS) {
      const result = CatalogZonePresetSchema.safeParse(zone)
      expect(result.success, `re-parse falló para ${zone.id}`).toBe(true)
    }
  })

  it('las capacidades de zona usan unidad persons y son editables', () => {
    for (const zone of ZONE_PRESETS) {
      expect(zone.defaultCapacity.record.unit, `${zone.id}`).toBe('persons')
      expect(zone.defaultCapacity.editable, `${zone.id}`).toBe(true)
    }
  })
})

describe('honestidad de las estimaciones (docs/guia/02)', () => {
  it('todo parámetro es estimación de ejemplo con supuestos y fecha', () => {
    const all = [...ALL_OBJECT_PRESETS.map((p) => [p.id, p.parameters] as const)]
    for (const [presetId, parameters] of all) {
      for (const [key, spec] of Object.entries(parameters)) {
        expect(spec.record.sourceType, `${presetId}.${key}:sourceType`).toBe('estimated')
        expect(spec.record.confidence, `${presetId}.${key}:confidence`).toBe('low')
        expect(spec.record.assumptions, `${presetId}.${key}:assumptions`).toBeTruthy()
        expect(spec.record.verifiedAt, `${presetId}.${key}:verifiedAt`).toMatch(
          /^\d{4}-\d{2}-\d{2}$/,
        )
      }
    }
  })

  it('toda zona declara supuestos y fecha en su capacidad por defecto', () => {
    for (const zone of ZONE_PRESETS) {
      expect(zone.defaultCapacity.record.sourceType, `${zone.id}`).toBe('estimated')
      expect(zone.defaultCapacity.record.confidence, `${zone.id}`).toBe('low')
      expect(zone.defaultCapacity.record.assumptions, `${zone.id}`).toBeTruthy()
      expect(zone.defaultCapacity.record.verifiedAt, `${zone.id}`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('coherencia de datos', () => {
  it('el parámetro length de una pared coincide con dimensions.width', () => {
    const walls = ALL_OBJECT_PRESETS.filter((p) => p.group === 'wall')
    expect(walls.length).toBeGreaterThan(0)
    for (const wall of walls) {
      const lengthSpec = wall.parameters.length
      expect(lengthSpec, `${wall.id} debe declarar parameters.length`).toBeDefined()
      expect(lengthSpec.record.value, `${wall.id}`).toBe(wall.dimensions.width)
    }
  })

  it('todo punto de interacción cae dentro del anillo ampliado', () => {
    for (const preset of ALL_OBJECT_PRESETS) {
      const { width, depth } = preset.dimensions
      const { x, y } = preset.interactionPoint
      const ok =
        Math.abs(x) <= width / 2 + INTERACTION_POINT_MAX_OFFSET_M &&
        Math.abs(y) <= depth / 2 + INTERACTION_POINT_MAX_OFFSET_M
      expect(ok, `${preset.id}: punto (${x}, ${y}) fuera del anillo de ${width}×${depth}`).toBe(
        true,
      )
    }
  })

  it('las paredes y ventanas usan el punto central (pasivas)', () => {
    for (const preset of ALL_OBJECT_PRESETS.filter(
      (p) => p.group === 'wall' || p.group === 'window',
    )) {
      expect(preset.interactionPoint, `${preset.id}`).toEqual({ x: 0, y: 0 })
    }
  })

  it('la huella poligonal queda dentro de la caja de dimensions', () => {
    for (const preset of ALL_OBJECT_PRESETS.filter((p) => p.footprint !== undefined)) {
      const { width, depth } = preset.dimensions
      for (const point of preset.footprint ?? []) {
        expect(
          Math.abs(point.x) <= width / 2 && Math.abs(point.y) <= depth / 2,
          `${preset.id}: punto (${point.x}, ${point.y}) fuera de ${width}×${depth}`,
        ).toBe(true)
      }
    }
  })

  it('defaultMaterialId existe y los colores son #RRGGBB', () => {
    for (const preset of ALL_OBJECT_PRESETS) {
      const ids = preset.materials.map((m) => m.id)
      expect(ids.includes(preset.defaultMaterialId), `${preset.id}`).toBe(true)
      for (const material of preset.materials) {
        expect(material.suggestedColor, `${preset.id}.${material.id}`).toMatch(/^#[0-9a-fA-F]{6}$/)
      }
    }
  })
})

describe('propiedades obligatorias por grupo (docs/guia/02)', () => {
  // Listas de la guía, unificadas con la nomenclatura del dominio: el guide
  // llama "recoverySeconds" a la recuperación del horno de pizza y
  // "heatRecoverySeconds" a la de la plancha; el catálogo usa
  // "heatRecoverySeconds" en ambos para coincidir con EquipmentSchema.
  const requiredByGroup: Record<string, string[]> = {
    table: ['seats', 'cleaningSeconds', 'accessibleClearance'],
  }
  const requiredByEquipment: Record<string, string[]> = {
    griddle: [
      'powerOnSeconds',
      'targetTemperatureC',
      'warmupSeconds',
      'heatRecoverySeconds',
      'capacity',
      'cooldownSeconds',
      'cleaningSeconds',
    ],
    blender: ['startupSeconds', 'cycleSeconds', 'capacity', 'cleaningSeconds'],
    ticket_printer: ['ticketPrintSeconds', 'capacity'],
    sink: ['capacity', 'washSeconds', 'drySeconds', 'cleaningSeconds'],
    dishwasher: ['capacity', 'washSeconds', 'drySeconds', 'cleaningSeconds'],
    pizza_oven: [
      'warmupSeconds',
      'targetTemperatureC',
      'bakeSeconds',
      'capacity',
      'heatRecoverySeconds',
    ],
  }
  const requiredFlags: Record<string, string[]> = {
    blender: ['requiresFreeContainer'],
    ticket_printer: ['paperAvailable'],
  }

  it('los grupos declaran sus parámetros obligatorios', () => {
    for (const preset of ALL_OBJECT_PRESETS) {
      const byGroup = requiredByGroup[preset.group] ?? []
      for (const key of byGroup) {
        expect(preset.parameters[key], `${preset.id} debería declarar ${key}`).toBeDefined()
      }
      if (preset.equipmentKind) {
        const byEquipment = requiredByEquipment[preset.equipmentKind] ?? []
        for (const key of byEquipment) {
          expect(preset.parameters[key], `${preset.id} debería declarar ${key}`).toBeDefined()
        }
        const flags = requiredFlags[preset.equipmentKind] ?? []
        for (const key of flags) {
          expect(preset.flags[key], `${preset.id} debería declarar el flag ${key}`).toBeDefined()
        }
      }
    }
  })
})

describe('auditoría estructural: el catálogo no re-implementa reglas', () => {
  // Fuentes no-test del paquete como texto crudo, vía transformación de
  // vitest (import.meta.glob con ?raw). Sin dependencias de node:fs.
  const rawSources = import.meta.glob(['./*.ts', './data/*.ts'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>
  const sourceEntries = Object.entries(rawSources).filter(([file]) => !file.endsWith('.test.ts'))

  it('se auditaron todas las fuentes no-test del paquete', () => {
    // preset, icons, catalog, lookup, index, table (6) + 4 de data = 10.
    expect(sourceEntries.length).toBe(10)
    expect(Object.keys(rawSources).some((f) => f.endsWith('.test.ts'))).toBe(true)
  })

  it('ninguna fuente declara tablas de cotas ni validadores de unidad locales', () => {
    // Lo prohibido es RE-DECLARAR reglas (una tabla o validador local);
    // mencionar o importar las del dominio es exactamente lo que se pide.
    const forbidden = [
      /\b(?:const|let|var|export)\s+\w*(?:CONSTRAINTS|LIMITS|RANGES|BOUNDS)\w*\s*=/, // tablas de cotas locales
      /\bfunction\s+\w*(?:checkUnit|validateUnit|unitRange|applyUnit)\w*\s*\(/, // re-validadores
    ]
    for (const [file, source] of sourceEntries) {
      for (const pattern of forbidden) {
        expect(
          pattern.test(source),
          `${file} contiene el patrón prohibido ${pattern} (regla de la decisión 02.1-c: el catálogo declara datos, no reglas)`,
        ).toBe(false)
      }
    }
  })

  it('preset.ts reutiliza los esquemas del dominio en lugar de duplicarlos', () => {
    const presetSource = rawSources['./preset.ts']
    expect(presetSource).toBeDefined()
    expect(presetSource).toMatch(/ParameterRecordSchema/)
    expect(presetSource).toMatch(/from '@lba\/domain'/)
  })
})
