import { describe, expect, it } from 'vitest'
import { validateScenario, validateScenarioOrThrow } from '@lba/domain'
import type { Scenario } from '@lba/domain'
import { exportScenario, loadScenarioJson } from '@lba/persistence'
import { listPresetsByEquipmentKind, listZonePresetsByCategory } from '@lba/asset-catalog'
import { buildIntegrationScenario, catalogReferences } from './helpers'

/**
 * Prueba de integración del FLUJO COMPLETO de FASE 02 (los tres paquetes
 * juntos, como los usará el editor 2D en FASE 03):
 *
 *   escenario válido → validación → consulta de catálogo → exportación →
 *   importación → comparación de datos.
 *
 * El escenario se construye consultando presets reales de @lba/asset-catalog
 * y validándolos con @lba/domain; el ciclo export→import usa @lba/persistence.
 */

const scenario: Scenario = buildIntegrationScenario()

describe('flujo completo — etapa 1: consulta de catálogo e instanciación', () => {
  it('los presets consultados existen y el objeto se deriva de ellos', () => {
    const tablePreset = catalogReferences.tableRound()
    const table = scenario.objects[0]
    expect(table).toBeDefined()
    expect(table.id).toBe('obj_table-round-4-a')
    expect(table.kind).toBe(tablePreset.family)
    expect(table.layer).toBe(tablePreset.layer)
    expect(table.dimensions).toEqual(tablePreset.dimensions)
    // El punto de interacción del preset se traslada al mundo con la posición.
    expect(table.interactionPoint).toEqual({
      x: 2.0 + tablePreset.interactionPoint.x,
      y: 2.0 + tablePreset.interactionPoint.y,
    })
    // Material y color salen del material por defecto del preset.
    const defaultMaterial = tablePreset.materials.find(
      (m) => m.id === tablePreset.defaultMaterialId,
    )
    expect(table.material).toBe(tablePreset.defaultMaterialId)
    expect(table.color).toBe(defaultMaterial?.suggestedColor)
    // seats → capacity; los parámetros numéricos → properties.
    expect(table.capacity).toBe(tablePreset.parameters.seats?.record.value)
    expect(table.properties).toEqual({ seats: 4, cleaningSeconds: 300, accessibleClearance: 0.75 })
  })

  it('la puerta instancia doorType desde doorMechanism del preset', () => {
    const doorPreset = catalogReferences.door()
    const door = scenario.objects.find((o) => o.id === 'obj_door-swing-wood-90-a')
    expect(door).toBeDefined()
    expect(door?.doorType).toBe(doorPreset.doorMechanism)
    expect(door?.doorType).toBe('swing')
  })

  it('las zonas se derivan del suggestedSize y defaultCapacity del preset', () => {
    const diningPreset = catalogReferences.zoneDining()
    const dining = scenario.zones.find((z) => z.id === 'zone_dining-salon')
    expect(dining).toBeDefined()
    expect(dining?.bounds).toEqual({
      min: { x: 0.2, y: 0.2 },
      max: { x: 0.2 + diningPreset.suggestedSize.width, y: 0.2 + diningPreset.suggestedSize.depth },
    })
    expect(dining?.capacity).toBe(diningPreset.defaultCapacity.record.value)
    expect(dining?.allowedRoles).toEqual(diningPreset.allowedRoles)
    expect(dining?.accessRules).toEqual(diningPreset.accessRules)
  })

  it('las consultas por tipo de equipo y categoría de zona encuentran los presets usados', () => {
    const griddlePresets = listPresetsByEquipmentKind('griddle')
    expect(griddlePresets.map((p) => p.id)).toContain('cat_griddle-120')
    const diningZones = listZonePresetsByCategory('dining')
    expect(diningZones.map((z) => z.id)).toContain('cat_zone-dining')
  })

  it('la entidad Equipment hereda los parámetros del preset con sus unidades', () => {
    const griddlePreset = catalogReferences.griddle()
    const griddle = scenario.equipment.find((e) => e.id === 'eq_griddle-120-a')
    expect(griddle).toBeDefined()
    expect(griddle?.kind).toBe(griddlePreset.equipmentKind)
    expect(griddle?.capacity).toBe(griddlePreset.parameters.capacity?.record.value)
    expect(griddle?.warmupSeconds).toEqual(griddlePreset.parameters.warmupSeconds?.record)
    expect(griddle?.targetTemperatureC).toEqual(griddlePreset.parameters.targetTemperatureC?.record)
    expect(griddle?.targetTemperatureC?.unit).toBe('C')
  })
})

describe('flujo completo — etapa 2: validación del dominio', () => {
  it('validateScenario acepta el escenario instanciado desde el catálogo', () => {
    const result = validateScenario(scenario)
    expect(result.ok).toBe(true)
  })

  it('validateScenarioOrThrow devuelve los mismos datos sin lanzar', () => {
    const data = validateScenarioOrThrow(scenario)
    expect(data).toEqual(scenario)
  })
})

describe('flujo completo — etapas 3-6: exportación → importación → comparación de datos', () => {
  const exported = exportScenario(scenario)
  const loaded = loadScenarioJson(exported)

  it('la importación de la exportación tiene éxito', () => {
    expect(loaded.ok).toBe(true)
    if (!loaded.ok) throw new Error('carga fallida en el flujo válido')
  })

  it('la comparación profunda de datos es idéntica (nada se pierde ni se altera)', () => {
    if (!loaded.ok) throw new Error('la carga debió ser exitosa')
    expect(loaded.data).toEqual(scenario)
  })

  it('la exportación canónica es un punto fijo (determinismo de extremo a extremo)', () => {
    if (!loaded.ok) throw new Error('la carga debió ser exitosa')
    // Hallazgo documentado del flujo integrado: la primera validación
    // normaliza el orden de claves al orden declarado por el esquema (zod
    // reconstruye el objeto). Los DATOS son idénticos — lo prueba la
    // comparación profunda del test anterior — pero la forma canónica se
    // alcanza tras una ronda de validación. A partir de ahí, exportar es un
    // punto fijo: reimportar la exportación canónica y reexportarla produce
    // exactamente el mismo texto.
    const canonical = exportScenario(loaded.data)
    const reloaded = loadScenarioJson(canonical)
    expect(reloaded.ok).toBe(true)
    if (reloaded.ok) {
      expect(exportScenario(reloaded.data)).toBe(canonical)
    }
  })

  it('el override de escenario del parámetro global sobrevive al ciclo', () => {
    if (!loaded.ok) throw new Error('la carga debió ser exitosa')
    expect(loaded.data.parameters.cleaningSeconds).toEqual(scenario.parameters.cleaningSeconds)
    expect(loaded.data.parameters.cleaningSeconds.scenarioOverrideValue).toBe(240)
  })

  it('el punto de interacción y la referencia cruzada sobreviven al ciclo', () => {
    if (!loaded.ok) throw new Error('la carga debió ser exitosa')
    expect(loaded.data.objects[0]?.interactionPoint).toEqual(scenario.objects[0]?.interactionPoint)
    expect(loaded.data.inventory[0]?.locationWorldObjectId).toBe('obj_fridge-upright-70-a')
    expect(loaded.data.taskTemplates[0]?.steps[0]?.requiresEquipmentId).toBe('eq_griddle-120-a')
  })
})
