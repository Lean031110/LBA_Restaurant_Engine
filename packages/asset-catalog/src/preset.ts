import { z } from 'zod'
import {
  DimensionsSchema,
  EquipmentKindSchema,
  NonEmptyStringSchema,
  ParameterRecordSchema,
  PositionSchema,
  PositiveFiniteNumberSchema,
  WorldObjectKindSchema,
  WorldObjectLayerSchema,
  ZoneCategorySchema,
} from '@lba/domain'
import type { ParameterUnit, Position } from '@lba/domain'

/**
 * Esquemas del catálogo de presets (prompt 02.2, FASE 02).
 *
 * PRINCIPIO RECTOR (decisión 02.1-c, documentada en @lba/domain parameter.ts):
 * este paquete declara DATOS, no reglas. Toda la semántica de unidades
 * (cotas, integralidad, rangos de override) vive en `UNIT_CONSTRAINTS` de
 * @lba/domain y se aplica aquí mediante la REUTILIZACIÓN de sus esquemas
 * (`ParameterRecordSchema`). Re-implementar esas reglas en el catálogo está
 * prohibido; un test estructural (catalog.test.ts) audita el código fuente
 * de este paquete y falla si aparece una tabla de cotas local.
 *
 * Convención de coordenadas de preset: el origen del preset es el centro
 * geométrico de su huella (dimensions.width × dimensions.depth); la
 * rotación se aplica en la instanciación (editor, FASE 03). El punto de
 * interacción se expresa en coordenadas locales del preset.
 */

/**
 * Distancia máxima a la que el punto de interacción puede apartarse de la
 * huella del preset. Los elementos activos (equipos, mostradores) colocan el
 * punto a unos 0.45 m delante de su cara frontal: es donde se para una
 * persona para operar. Los elementos pasivos (paredes, ventanas) usan el
 * centro geométrico: el motor no los usa como destino de agentes.
 */
export const INTERACTION_POINT_MAX_OFFSET_M = 0.5

/** Desplazamiento estándar del punto de interacción desde la cara frontal. */
export const INTERACTION_FRONT_OFFSET_M = 0.45

/**
 * Identificador de preset: `cat_` + cuerpo kebab-case (2..64), mismo formato
 * que los IDs de @lba/domain (ids.ts) para consistencia visual y de errores.
 */
const PRESET_ID_BODY = '[a-z0-9]+(?:-[a-z0-9]+)*'
const PRESET_ID_MAX = 64
export const PresetIdSchema = z
  .string()
  .max(PRESET_ID_MAX + 5, {
    error: `el ID de preset debe tener como máximo ${PRESET_ID_MAX + 5} caracteres`,
  })
  .regex(new RegExp(`^cat_${PRESET_ID_BODY}$`), {
    error:
      'ID de preset inválido: se esperaba el formato "cat_<kebab-case>" (ej. "cat_table-round-4")',
  })
export type PresetId = z.infer<typeof PresetIdSchema>

/** Grupos del catálogo de objetos (un grupo = una familia de presets). */
export const CatalogGroupSchema = z.enum([
  'wall',
  'door',
  'window',
  'table',
  'chair',
  'counter',
  'bar',
  'station',
  'tray',
  'range',
  'griddle',
  'fryer',
  'oven',
  'pizza-oven',
  'fridge',
  'freezer',
  'blender',
  'sink',
  'dishwasher',
  'ticket-printer',
  'pos',
])
export type CatalogGroup = z.infer<typeof CatalogGroupSchema>

/** Color sugerido en formato #RRGGBB (misma regla que WorldObject.color). */
const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, {
  error: 'suggestedColor debe tener formato #RRGGBB',
})

/** Material sugerido del preset con su color asociado. */
export const MaterialSchema = z.object({
  id: z
    .string()
    .min(1, { error: 'el id de material no puede estar vacío' })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: 'el id de material debe ser kebab-case (ej. "stainless-steel")',
    }),
  label: NonEmptyStringSchema,
  suggestedColor: HexColorSchema,
})
export type Material = z.infer<typeof MaterialSchema>

/**
 * Especificación de propiedad numérica editable. El `record` ES un
 * `ParameterRecord` de @lba/domain (regla 10 completa: unidad, rango,
 * procedencia, confianza, override). La etiqueta y el permiso de edición
 * son específicos del catálogo.
 */
export const CatalogParameterSpecSchema = z.object({
  label: NonEmptyStringSchema,
  editable: z.boolean(),
  record: ParameterRecordSchema,
})
export type CatalogParameterSpec = z.infer<typeof CatalogParameterSpecSchema>

/**
 * Especificación de propiedad booleana. Los booleanos no son magnitudes:
 * no llevan unidad ni rango, así que NO son ParameterRecord. La procedencia
 * se expresa con la nota (qué representa y qué no).
 */
export const CatalogFlagSpecSchema = z.object({
  label: NonEmptyStringSchema,
  value: z.boolean(),
  note: NonEmptyStringSchema.optional(),
})
export type CatalogFlagSpec = z.infer<typeof CatalogFlagSpecSchema>

/** Mecanismo de apertura (solo presets de puerta). */
export const DoorMechanismSchema = z.enum(['swing', 'sliding'])
export type DoorMechanism = z.infer<typeof DoorMechanismSchema>

/** Referencia a un icono del registro (icons.ts); válida por construcción. */
export const IconIdSchema = z.enum([
  'wall',
  'door',
  'window',
  'table',
  'chair',
  'counter',
  'bar',
  'station',
  'tray',
  'range',
  'griddle',
  'fryer',
  'oven',
  'pizza-oven',
  'fridge',
  'freezer',
  'blender',
  'sink',
  'dishwasher',
  'ticket-printer',
  'pos',
  'zone',
])
export type IconId = z.infer<typeof IconIdSchema>

/**
 * Caja del bounding box de la huella (origen centrado): [−w/2, w/2] ×
 * [−d/2, d/2], expandida por `INTERACTION_POINT_MAX_OFFSET_M`.
 */
function interactionBoxAllows(
  dimensions: { width: number; depth: number },
  point: { x: number; y: number },
): boolean {
  const xMin = -dimensions.width / 2 - INTERACTION_POINT_MAX_OFFSET_M
  const xMax = dimensions.width / 2 + INTERACTION_POINT_MAX_OFFSET_M
  const yMin = -dimensions.depth / 2 - INTERACTION_POINT_MAX_OFFSET_M
  const yMax = dimensions.depth / 2 + INTERACTION_POINT_MAX_OFFSET_M
  return point.x >= xMin && point.x <= xMax && point.y >= yMin && point.y <= yMax
}

/** Objeto base compartido; los refinamientos se aplican después (zod 4). */
const ObjectPresetObject = z.object({
  id: PresetIdSchema,
  group: CatalogGroupSchema,
  label: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  /** Clase WorldObject que produce al instanciar (mapeo a @lba/domain). */
  family: WorldObjectKindSchema,
  /** Capa de dibujo del editor (mapeo a @lba/domain). */
  layer: WorldObjectLayerSchema,
  tags: z.array(NonEmptyStringSchema).min(1, { error: 'incluye al menos una etiqueta' }),
  /** Huella por defecto (ancho × fondo en metros de mundo). */
  dimensions: DimensionsSchema,
  /** Altura física en metros (elevación; la usa la vista 3D en FASE 10). */
  heightM: PositiveFiniteNumberSchema,
  /** Huella de colisión poligonal opcional (≥3 puntos); por defecto, el rectángulo de dimensions. */
  footprint: z
    .array(PositionSchema)
    .min(3, { error: 'la huella de colisión necesita al menos 3 puntos' })
    .optional(),
  /** Punto donde se coloca un agente para operar el elemento (coordenadas locales). */
  interactionPoint: PositionSchema,
  /** Materiales sugeridos con color; el primero no es necesariamente el por defecto. */
  materials: z.array(MaterialSchema).min(1, { error: 'declara al menos un material sugerido' }),
  /** Material seleccionado por defecto; debe existir en materials. */
  defaultMaterialId: NonEmptyStringSchema,
  /** Propiedades numéricas editables (regla 10 completa vía ParameterRecord). */
  parameters: z.record(z.string(), CatalogParameterSpecSchema),
  /** Propiedades booleanas (sin unidad; no son magnitudes). */
  flags: z.record(z.string(), CatalogFlagSpecSchema),
  /** Icono vectorial de respaldo (obra original del proyecto; sin descargas). */
  iconId: IconIdSchema,
  /** Qué NO representan los valores (requisito de docs/guia/02). */
  usageNotes: z.array(NonEmptyStringSchema).min(1, { error: 'declara al menos una nota de uso' }),
  /** Tipo de equipo que produce al instanciar (solo family "equipment"). */
  equipmentKind: EquipmentKindSchema.optional(),
  /** Mecanismo de apertura (solo group "door"). */
  doorMechanism: DoorMechanismSchema.optional(),
})

/**
 * Preset de objeto del catálogo. Reglas cruzadas (aplicadas con superRefine
 * para reportar todas juntas, igual que hace @lba/domain):
 *
 * 1. `defaultMaterialId` debe existir en `materials`.
 * 2. `interactionPoint` debe caer dentro del anillo de la huella ampliada
 *    `INTERACTION_POINT_MAX_OFFSET_M` (evita puntos de interacción perdidos
 *    a metros del mueble).
 * 3. `equipmentKind` es obligatorio si y solo si `family === "equipment"`.
 * 4. `doorMechanism` es obligatorio si y solo si `group === "door"`.
 */
export const CatalogObjectPresetSchema = ObjectPresetObject.superRefine((p, ctx) => {
  if (!p.materials.some((m) => m.id === p.defaultMaterialId)) {
    ctx.addIssue({
      code: 'custom',
      path: ['defaultMaterialId'],
      message: `defaultMaterialId "${p.defaultMaterialId}" no existe en materials`,
    })
  }
  if (!interactionBoxAllows(p.dimensions, p.interactionPoint)) {
    ctx.addIssue({
      code: 'custom',
      path: ['interactionPoint'],
      message: `interactionPoint está a más de ${INTERACTION_POINT_MAX_OFFSET_M} m de la huella (anillo ampliado)`,
    })
  }
  if (p.family === 'equipment' && p.equipmentKind === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['equipmentKind'],
      message: 'los presets con family "equipment" deben declarar equipmentKind',
    })
  }
  if (p.family !== 'equipment' && p.equipmentKind !== undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['equipmentKind'],
      message: 'equipmentKind solo aplica a presets con family "equipment"',
    })
  }
  if (p.group === 'door' && p.doorMechanism === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['doorMechanism'],
      message: 'los presets de puerta deben declarar doorMechanism ("swing" o "sliding")',
    })
  }
  if (p.group !== 'door' && p.doorMechanism !== undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['doorMechanism'],
      message: 'doorMechanism solo aplica a presets de puerta (group "door")',
    })
  }
})
export type CatalogObjectPreset = z.infer<typeof CatalogObjectPresetSchema>

/** Preset de zona funcional (no tiene huella de colisión ni materiales). */
export const CatalogZonePresetSchema = z.object({
  id: PresetIdSchema,
  /** Categoría funcional de @lba/domain (se reutiliza; no se duplica). */
  category: ZoneCategorySchema,
  label: NonEmptyStringSchema,
  description: NonEmptyStringSchema,
  tags: z.array(NonEmptyStringSchema).min(1, { error: 'incluye al menos una etiqueta' }),
  /** Tamaño sugerido para dibujar la zona nueva (ancho × fondo, metros). */
  suggestedSize: DimensionsSchema,
  /** Capacidad por defecto de personas simultáneas (editable, unidad persons). */
  defaultCapacity: CatalogParameterSpecSchema,
  /** Roles con permiso de acceso (vacío = sin restricción declarada). */
  allowedRoles: z.array(NonEmptyStringSchema),
  /** Reglas de acceso descriptivas (el motor las formaliza en fases 06+). */
  accessRules: z
    .array(NonEmptyStringSchema)
    .min(1, { error: 'declara al menos una regla de acceso' }),
  iconId: IconIdSchema,
  usageNotes: z.array(NonEmptyStringSchema).min(1, { error: 'declara al menos una nota de uso' }),
})
export type CatalogZonePreset = z.infer<typeof CatalogZonePresetSchema>

/**
 * Construye una especificación de parámetro estimado y la VALIDA al momento
 * (falla con la ruta del campo si los datos son inconsistentes). Todos los
 * valores del catálogo 02.2 son estimaciones de ejemplo: no hay fuente
 * fiable para el modelo exacto de cada equipo, así que `sourceType` es
 * "estimated", la confianza es "low" y `assumptions` es obligatorio
 * (docs/guia/02: «Los valores iniciales deben estar etiquetados como
 * estimaciones de ejemplo si no existe una fuente fiable para ese modelo
 * exacto de equipo»).
 */
export function estimatedSpec(input: {
  label: string
  editable?: boolean
  value: number
  unit: ParameterUnit
  minValue?: number
  maxValue?: number
  assumptions: string
  scenarioOverrideValue?: number
}): CatalogParameterSpec {
  return CatalogParameterSpecSchema.parse({
    label: input.label,
    editable: input.editable ?? true,
    record: {
      value: input.value,
      unit: input.unit,
      minValue: input.minValue,
      maxValue: input.maxValue,
      sourceType: 'estimated',
      confidence: 'low',
      verifiedAt: '2026-10-09',
      assumptions: input.assumptions,
      scenarioOverrideValue: input.scenarioOverrideValue,
    },
  })
}

/** Construye y valida una especificación booleana. */
export function flagSpec(input: { label: string; value: boolean; note?: string }): CatalogFlagSpec {
  return CatalogFlagSpecSchema.parse(input)
}

/**
 * Punto de interacción estándar: delante de la cara frontal (+y) del preset.
 * Coordenadas locales; la rotación se aplica al instanciar.
 */
export function frontInteractionPoint(dimensions: { width: number; depth: number }): Position {
  return { x: 0, y: dimensions.depth / 2 + INTERACTION_FRONT_OFFSET_M }
}

/**
 * Punto de interacción pasivo: centro geométrico. Para paredes y ventanas,
 * que no son destino de agentes; mantiene el esquema válido y documentado.
 */
export function centerInteractionPoint(): Position {
  return { x: 0, y: 0 }
}
