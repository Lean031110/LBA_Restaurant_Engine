import { z } from 'zod'
import { WorldObjectIdSchema, ZoneIdSchema } from '../ids'
import { DimensionsSchema, NonEmptyStringSchema, PositionSchema, RotationSchema } from '../units'

/**
 * WorldObject (contrato docs/guia/04, secciones 2 y 3): pared, puerta,
 * ventana, mueble, mesa, equipo, estación, salida u objeto físico del local.
 * El catálogo de presets ampliable llega en FASE 02 (prompt 02.2); aquí se
 * definen el tipo base y sus invariantes.
 */

/** Clases base de objeto del mundo. */
export const WorldObjectKindSchema = z.enum([
  'wall',
  'door',
  'window',
  'furniture',
  'equipment',
  'station',
  'exit',
  'other',
])
export type WorldObjectKind = z.infer<typeof WorldObjectKindSchema>

/** Capa de dibujo/edición del objeto. */
export const WorldObjectLayerSchema = z.enum(['structure', 'furniture', 'equipment', 'decor'])
export type WorldObjectLayer = z.infer<typeof WorldObjectLayerSchema>

/** Propiedad editable: valor primitivo etiquetado (evita JSON arbitrario). */
export const EditablePropertySchema = z.union([
  z.number().refine((v) => Number.isFinite(v), {
    error: 'las propiedades numéricas deben ser finitas',
  }),
  z.string().min(1),
  z.boolean(),
])
export type EditableProperty = z.infer<typeof EditablePropertySchema>

/**
 * Objeto del mundo con posición, rotación, dimensiones, huella opcional,
 * punto de interacción, zona, etiquetas, capa y propiedades editables.
 */
export const WorldObjectSchema = z
  .object({
    id: WorldObjectIdSchema,
    /** Clase base del objeto. */
    kind: WorldObjectKindSchema,
    /** Nombre visible opcional (p. ej. "Mesa ventana 4"). */
    name: NonEmptyStringSchema.optional(),
    /** Posición del origen del objeto en unidades del mundo. */
    position: PositionSchema,
    /** Rotación en grados [0, 360). */
    rotation: RotationSchema,
    /** Huella rectangular (ancho × fondo) en unidades del mundo. */
    dimensions: DimensionsSchema,
    /** Huella de colisión poligonal opcional (mínimo 3 puntos, finitos). */
    footprint: z
      .array(PositionSchema)
      .min(3, {
        error: 'la huella de colisión necesita al menos 3 puntos',
      })
      .optional(),
    /** Punto donde el agente se sitúa para interactuar con el objeto. */
    interactionPoint: PositionSchema,
    /** Zona funcional a la que pertenece (opcional). */
    zoneId: ZoneIdSchema.optional(),
    /** Etiquetas libres para filtrado y reglas. */
    tags: z.array(NonEmptyStringSchema),
    /** Capa de dibujo/edición. */
    layer: WorldObjectLayerSchema,
    /** Material sugerido (catálogo en prompt 02.2). */
    material: NonEmptyStringSchema.optional(),
    /** Color sugerido en formato #RRGGBB. */
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, {
        error: 'color debe tener formato #RRGGBB',
      })
      .optional(),
    /** Propiedades editables adicionales (pliegue avanzado en la UI). */
    properties: z.record(z.string(), EditablePropertySchema),
    /** Capacidad de comensales (solo mesas/bancos; mínimo 1). */
    capacity: z
      .number()
      .int({ error: 'capacity debe ser un entero' })
      .refine((v) => v >= 1, { error: 'capacity debe ser mayor o igual que 1' })
      .optional(),
    /** Tipo de puerta (obligatorio si kind === "door"). */
    doorType: z.enum(['swing', 'sliding']).optional(),
  })
  .refine((o) => o.kind !== 'door' || o.doorType !== undefined, {
    error: 'los objetos de tipo "door" deben declarar doorType ("swing" o "sliding")',
    path: ['doorType'],
  })
  .refine((o) => o.kind !== 'wall' || o.doorType === undefined, {
    error: 'doorType solo aplica a objetos de tipo "door"',
    path: ['doorType'],
  })

export type WorldObject = z.infer<typeof WorldObjectSchema>
