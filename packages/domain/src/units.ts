import { z } from 'zod'

/**
 * Unidades y geometría del mundo (contrato docs/guia/04, secciones 2 y 6):
 * unidades reales (m/cm) con proyección a píxeles solo en pantalla;
 * coordenadas siempre finitas; dimensiones positivas; rotación en grados.
 */

/** Números finitos: el dominio rechaza `Infinity` y `NaN` en cualquier magnitud. */
export const FiniteNumberSchema = z.number().refine((v) => Number.isFinite(v), {
  error: 'debe ser un número finito (sin Infinity ni NaN)',
})

/** Número finito estrictamente mayor que 0. */
export const PositiveFiniteNumberSchema = z.number().refine((v) => Number.isFinite(v) && v > 0, {
  error: 'debe ser un número finito mayor que 0',
})

/** Número finito mayor o igual que 0. */
export const NonNegativeFiniteNumberSchema = z
  .number()
  .refine((v) => Number.isFinite(v) && v >= 0, {
    error: 'debe ser un número finito mayor o igual que 0',
  })

/** Unidad de longitud del mundo: metros o centímetros (reales, no píxeles). */
export const WorldLengthUnitSchema = z.enum(['m', 'cm'])
export type WorldLengthUnit = z.infer<typeof WorldLengthUnitSchema>

/** Unidades de inventario permitidas (cantidad de artículo). */
export const InventoryUnitSchema = z.enum(['unit', 'g', 'kg', 'ml', 'l'])
export type InventoryUnit = z.infer<typeof InventoryUnitSchema>

/**
 * Unidades de parámetro permitidas, con la semántica que el dominio les
 * impone (la aplicación está en `parameter.ts`, tabla `UNIT_CONSTRAINTS`):
 *
 * - `s`: duración de simulación; no negativa, decimales permitidos.
 * - `C`: temperatura en grados Celsius; admite valores negativos (p. ej.
 *   rangos de congelador de −25 a −15); solo se exige número finito.
 * - `m`/`cm`: longitud (magnitud: alturas, distancias); no negativa,
 *   decimales permitidos.
 * - `persons`: conteo de personas; entero no negativo.
 * - `unit`: conteo de artículos; entero no negativo.
 * - `%`: porcentaje; rango inclusivo 0–100 en todos los campos numéricos.
 */
export const ParameterUnitSchema = z.enum(['s', 'C', 'm', 'cm', 'persons', 'unit', '%'])
export type ParameterUnit = z.infer<typeof ParameterUnitSchema>

/** Posición en coordenadas del mundo (siempre finitas). */
export const PositionSchema = z.object({
  x: FiniteNumberSchema,
  y: FiniteNumberSchema,
})
export type Position = z.infer<typeof PositionSchema>

/** Dimensiones (huella rectangular) en unidades del mundo, ambas positivas. */
export const DimensionsSchema = z.object({
  width: PositiveFiniteNumberSchema,
  depth: PositiveFiniteNumberSchema,
})
export type Dimensions = z.infer<typeof DimensionsSchema>

/** Rotación en grados dentro de [0, 360). */
export const RotationSchema = z.number().refine((v) => Number.isFinite(v) && v >= 0 && v < 360, {
  error: 'la rotación debe estar en grados dentro de [0, 360)',
})
export type Rotation = z.infer<typeof RotationSchema>

/** Etiqueta simple no vacía (nombres visibles, categorías, etc.). */
export const NonEmptyStringSchema = z.string().min(1, {
  error: 'no puede estar vacío',
})
