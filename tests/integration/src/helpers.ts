import type {
  Agent,
  Equipment,
  ParameterRecord,
  Position,
  Recipe,
  Scenario,
  TaskTemplate,
  WorldObject,
  Zone,
  InventoryItem,
} from '@lba/domain'
import {
  AgentIdSchema,
  CelsiusParameterSchema,
  EquipmentIdSchema,
  InventoryItemIdSchema,
  OrderIdSchema,
  RecipeIdSchema,
  ScenarioIdSchema,
  SecondsParameterSchema,
  TaskTemplateIdSchema,
  WorldObjectIdSchema,
  ZoneIdSchema,
} from '@lba/domain'
import { getObjectPreset, getZonePreset } from '@lba/asset-catalog'
import type { CatalogObjectPreset, CatalogZonePreset } from '@lba/asset-catalog'

/**
 * Helpers de instanciación para las pruebas de integración de FASE 02.
 *
 * Simulan el flujo real que usará el editor 2D (FASE 03): consultar el
 * catálogo y colocar sus presets en el mundo como entidades validadas de
 * @lba/domain. Los helpers NO inventan datos: todo sale de los presets del
 * catálogo (dimensiones, materiales, parámetros, banderas) o de las
 * colocaciones explícitas que declara cada prueba.
 *
 * Convención (igual que en el catálogo): el origen del preset es el centro
 * geométrico de su huella; la rotación se aplica al instanciar en el editor.
 * Aquí las colocaciones usan rotación fija declarada por la prueba; el punto
 * de interacción se traslada al mundo sin rotar (documentado; no inventa
 * transformaciones que FASE 03 todavía no define).
 */

function requireObjectPreset(presetId: string): CatalogObjectPreset {
  const preset = getObjectPreset(presetId)
  if (preset === undefined) {
    throw new Error(`preset de objeto no encontrado en el catálogo: ${presetId}`)
  }
  return preset
}

function requireZonePreset(presetId: string): CatalogZonePreset {
  const preset = getZonePreset(presetId)
  if (preset === undefined) {
    throw new Error(`preset de zona no encontrado en el catálogo: ${presetId}`)
  }
  return preset
}

/** Colocación de un preset de objeto en el mundo (la prueba la declara). */
export interface ObjectPlacement {
  presetId: string
  position: Position
  /** Grados [0, 360); por defecto 0. */
  rotation?: number
  /** ID de zona funcional donde vive el objeto (opcional). */
  zoneId?: string
  /** Sufijo kebab-case que distingue instancias del mismo preset. */
  suffix: string
  /** Nombre visible; por defecto el label del preset. */
  name?: string
}

/**
 * Instancia un WorldObject desde un preset del catálogo. El mapeo es el
 * contrato editorial de FASE 02: family→kind, layer→layer, dimensiones y
 * punto de interacción trasladado, material por defecto + color sugerido,
 * parámetros numéricos → properties (canal sancionado de extensión v1),
 * banderas → properties booleanas, seats→capacity (solo si el preset lo
 * declara) y doorMechanism→doorType (solo puertas).
 */
export function instantiateWorldObject(placement: ObjectPlacement): WorldObject {
  const preset = requireObjectPreset(placement.presetId)
  const material = preset.materials.find((m) => m.id === preset.defaultMaterialId)
  const numericProperties: Record<string, number> = {}
  for (const [key, spec] of Object.entries(preset.parameters)) {
    numericProperties[key] = spec.record.value
  }
  const flagProperties: Record<string, boolean> = {}
  for (const [key, spec] of Object.entries(preset.flags)) {
    flagProperties[key] = spec.value
  }

  return {
    id: WorldObjectIdSchema.parse(`obj_${preset.id.replace('cat_', '')}-${placement.suffix}`),
    kind: preset.family,
    name: placement.name ?? preset.label,
    position: placement.position,
    rotation: placement.rotation ?? 0,
    dimensions: preset.dimensions,
    ...(preset.footprint !== undefined ? { footprint: preset.footprint } : {}),
    interactionPoint: {
      x: placement.position.x + preset.interactionPoint.x,
      y: placement.position.y + preset.interactionPoint.y,
    },
    ...(placement.zoneId !== undefined ? { zoneId: ZoneIdSchema.parse(placement.zoneId) } : {}),
    tags: [...preset.tags],
    layer: preset.layer,
    material: preset.defaultMaterialId,
    color: material?.suggestedColor,
    properties: { ...numericProperties, ...flagProperties },
    ...(preset.parameters.seats !== undefined
      ? { capacity: preset.parameters.seats.record.value }
      : {}),
    ...(preset.doorMechanism !== undefined ? { doorType: preset.doorMechanism } : {}),
  }
}

/** Colocación de un preset de zona en el mundo. */
export interface ZonePlacement {
  presetId: string
  /** Esquina mínima de los límites; el tamaño sale del suggestedSize del preset. */
  origin: Position
  suffix: string
}

/** Instancia una Zone desde un preset de zona del catálogo. */
export function instantiateZone(placement: ZonePlacement): Zone {
  const preset = requireZonePreset(placement.presetId)
  return {
    id: ZoneIdSchema.parse(`zone_${preset.id.replace('cat_zone-', '')}-${placement.suffix}`),
    name: preset.label,
    category: preset.category,
    bounds: {
      min: placement.origin,
      max: {
        x: placement.origin.x + preset.suggestedSize.width,
        y: placement.origin.y + preset.suggestedSize.depth,
      },
    },
    capacity: preset.defaultCapacity.record.value,
    allowedRoles: [...preset.allowedRoles],
    accessRules: [...preset.accessRules],
  }
}

/** Instancia una entidad Equipment desde un preset de equipo del catálogo. */
export function instantiateEquipment(presetId: string, suffix: string): Equipment {
  const preset = requireObjectPreset(presetId)
  if (preset.equipmentKind === undefined) {
    throw new Error(`el preset ${presetId} no es un equipo (falta equipmentKind)`)
  }
  const seconds = (key: string) => {
    const record = preset.parameters[key]?.record
    return record === undefined ? undefined : SecondsParameterSchema.parse(record)
  }
  const celsius = (key: string) => {
    const record = preset.parameters[key]?.record
    return record === undefined ? undefined : CelsiusParameterSchema.parse(record)
  }

  return {
    id: EquipmentIdSchema.parse(`eq_${preset.id.replace('cat_', '')}-${suffix}`),
    name: preset.label,
    kind: preset.equipmentKind,
    capacity: preset.parameters.capacity?.record.value ?? 1,
    initialState: 'off',
    ...(seconds('powerOnSeconds') !== undefined
      ? { powerOnSeconds: seconds('powerOnSeconds') }
      : {}),
    ...(seconds('warmupSeconds') !== undefined ? { warmupSeconds: seconds('warmupSeconds') } : {}),
    ...(celsius('targetTemperatureC') !== undefined
      ? { targetTemperatureC: celsius('targetTemperatureC') }
      : {}),
    ...(seconds('heatRecoverySeconds') !== undefined
      ? { heatRecoverySeconds: seconds('heatRecoverySeconds') }
      : {}),
    ...(seconds('cycleSeconds') !== undefined ? { cycleSeconds: seconds('cycleSeconds') } : {}),
    ...(seconds('cleaningSeconds') !== undefined
      ? { cleaningSeconds: seconds('cleaningSeconds') }
      : {}),
    ...(seconds('cooldownSeconds') !== undefined
      ? { cooldownSeconds: seconds('cooldownSeconds') }
      : {}),
    usageRules: [...preset.usageNotes],
  }
}

/**
 * Escenario de integración construido íntegramente desde el catálogo:
 * comedor con mesas y silla, cocina con plancha y nevera, puerta de acceso,
 * tabique divisor, un mesero, una plantilla de tarea sobre la plancha, una
 * receta con su artículo de inventario en la nevera y un pedido de dos
 * raciones. El parámetro global `cleaningSeconds` lleva un override de
 * escenario VÁLIDO (240 s, dentro del rango declarado 60..1800) para
 * comprobar que el override sobrevive al ciclo export→import.
 */
export function buildIntegrationScenario(): Scenario {
  const tableRound = requireObjectPreset('cat_table-round-4')
  const griddle = requireObjectPreset('cat_griddle-120')
  const cleaningRecord: ParameterRecord = tableRound.parameters.cleaningSeconds.record
  const griddleTemperature: ParameterRecord = griddle.parameters.targetTemperatureC.record

  return {
    schemaVersion: 1,
    id: ScenarioIdSchema.parse('scn_integration-flow-01'),
    name: 'Cafetería de integración',
    description:
      'Escenario de prueba del flujo completo: catálogo → validación → exportación → importación.',
    world: { lengthUnit: 'm', size: { width: 14, depth: 12 } },
    seed: 20261010,
    objects: [
      instantiateWorldObject({
        presetId: 'cat_table-round-4',
        position: { x: 2.0, y: 2.0 },
        zoneId: 'zone_dining-salon',
        suffix: 'a',
      }),
      instantiateWorldObject({
        presetId: 'cat_table-square-4',
        position: { x: 4.5, y: 4.0 },
        zoneId: 'zone_dining-salon',
        suffix: 'a',
      }),
      instantiateWorldObject({
        presetId: 'cat_chair-standard',
        position: { x: 2.0, y: 1.0 },
        zoneId: 'zone_dining-salon',
        suffix: 'a',
      }),
      instantiateWorldObject({
        presetId: 'cat_door-swing-wood-90',
        position: { x: 10.0, y: 0.4 },
        suffix: 'a',
      }),
      instantiateWorldObject({
        presetId: 'cat_wall-interior-150',
        position: { x: 3.2, y: 6.55 },
        suffix: 'a',
      }),
      instantiateWorldObject({
        presetId: 'cat_griddle-120',
        position: { x: 2.0, y: 8.5 },
        zoneId: 'zone_kitchen-cocina',
        suffix: 'a',
      }),
      instantiateWorldObject({
        presetId: 'cat_fridge-upright-70',
        position: { x: 5.5, y: 8.0 },
        zoneId: 'zone_kitchen-cocina',
        suffix: 'a',
      }),
    ],
    zones: [
      instantiateZone({ presetId: 'cat_zone-dining', origin: { x: 0.2, y: 0.2 }, suffix: 'salon' }),
      instantiateZone({
        presetId: 'cat_zone-kitchen',
        origin: { x: 0.2, y: 7.0 },
        suffix: 'cocina',
      }),
    ],
    agents: [
      {
        id: AgentIdSchema.parse('agent_mesero-01'),
        displayName: 'María',
        role: 'waiter',
        skills: ['servir', 'recoger'],
        position: { x: 1.5, y: 5.5 },
        speedMps: 1.2,
        homeZoneId: ZoneIdSchema.parse('zone_dining-salon'),
        state: 'idle',
        policy: { priorityOrder: ['atender-clientes', 'limpiar-mesa'] },
      } satisfies Agent,
    ],
    taskTemplates: [
      {
        id: TaskTemplateIdSchema.parse('task_cocinar-plancha'),
        name: 'Cocinar en la plancha',
        preconditions: ['La plancha está en temperatura'],
        steps: [
          {
            name: 'Cocinar la base',
            requiresEquipmentId: EquipmentIdSchema.parse('eq_griddle-120-a'),
            durationSeconds: SecondsParameterSchema.parse({
              value: 240,
              unit: 's',
              minValue: 60,
              maxValue: 1800,
              sourceType: 'estimated',
              confidence: 'low',
              verifiedAt: '2026-10-09',
              assumptions: 'Estimación de ejemplo para la prueba de integración.',
            }),
            parallelizable: false,
          },
        ],
        dependencies: [],
        requiredResourceIds: ['eq_griddle-120-a'],
        effects: ['La base queda lista para emplatar'],
        priority: 50,
      } satisfies TaskTemplate,
    ],
    equipment: [instantiateEquipment('cat_griddle-120', 'a')],
    orders: [
      {
        id: OrderIdSchema.parse('order_0001'),
        items: [
          { recipeId: RecipeIdSchema.parse('recipe_pizza-margarita'), quantity: 2, modifiers: [] },
        ],
        notes: 'Mesa junto a la ventana',
        priority: 'normal',
        createdAtSeconds: 0,
        promisedAtSeconds: 900,
        initialStatus: 'pendiente',
      },
    ],
    recipes: [
      {
        id: RecipeIdSchema.parse('recipe_pizza-margarita'),
        name: 'Pizza margarita',
        components: [
          {
            inventoryItemId: InventoryItemIdSchema.parse('inv_harina-0001'),
            quantity: 0.25,
            unit: 'kg',
          },
        ],
        steps: [
          {
            name: 'Amasar y extender',
            kind: 'prepare',
            requiredResourceIds: [],
            durationSeconds: SecondsParameterSchema.parse({
              value: 180,
              unit: 's',
              minValue: 60,
              maxValue: 900,
              sourceType: 'estimated',
              confidence: 'low',
              verifiedAt: '2026-10-09',
              assumptions: 'Estimación de ejemplo para la prueba de integración.',
            }),
          },
          {
            name: 'Cocinar en plancha',
            kind: 'cook',
            requiredResourceIds: ['eq_griddle-120-a'],
            targetTemperatureC: CelsiusParameterSchema.parse(griddleTemperature),
            durationSeconds: SecondsParameterSchema.parse({
              value: 240,
              unit: 's',
              minValue: 60,
              maxValue: 1800,
              sourceType: 'estimated',
              confidence: 'low',
              verifiedAt: '2026-10-09',
              assumptions: 'Estimación de ejemplo para la prueba de integración.',
            }),
          },
          {
            name: 'Emplatar',
            kind: 'plate',
            requiredResourceIds: [],
          },
        ],
        estimatedTotalSeconds: SecondsParameterSchema.parse({
          value: 660,
          unit: 's',
          minValue: 300,
          maxValue: 3600,
          sourceType: 'estimated',
          confidence: 'low',
          verifiedAt: '2026-10-09',
          assumptions: 'Estimación de ejemplo para la prueba de integración.',
        }),
        finalCondition: 'Pizza dorada y emplatada',
      } satisfies Recipe,
    ],
    inventory: [
      {
        id: InventoryItemIdSchema.parse('inv_harina-0001'),
        name: 'Harina de trigo',
        unit: 'kg',
        stock: 50,
        reorderPoint: 10,
        replenishmentQuantity: 25,
        locationWorldObjectId: WorldObjectIdSchema.parse('obj_fridge-upright-70-a'),
      } satisfies InventoryItem,
    ],
    parameters: {
      cleaningSeconds: { ...cleaningRecord, scenarioOverrideValue: 240 },
    },
  }
}

/** Referencias a los presets consultados, para aserciones de procedencia. */
export const catalogReferences = {
  tableRound: () => requireObjectPreset('cat_table-round-4'),
  tableSquare: () => requireObjectPreset('cat_table-square-4'),
  chair: () => requireObjectPreset('cat_chair-standard'),
  door: () => requireObjectPreset('cat_door-swing-wood-90'),
  wall: () => requireObjectPreset('cat_wall-interior-150'),
  griddle: () => requireObjectPreset('cat_griddle-120'),
  fridge: () => requireObjectPreset('cat_fridge-upright-70'),
  zoneDining: () => requireZonePreset('cat_zone-dining'),
  zoneKitchen: () => requireZonePreset('cat_zone-kitchen'),
}
