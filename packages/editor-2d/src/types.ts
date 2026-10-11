import type {
  Position,
  Rotation,
  Scenario,
  WorldLengthUnit,
  WorldObjectId,
  ZoneId,
} from '@lba/domain'

/**
 * Tipos del núcleo del editor 2D (FASE 03, prompt 03.1).
 *
 * Principio (regla 11 del prompt maestro): este paquete contiene el estado
 * y la lógica de edición — NO la presentación. React y Konva viven en
 * apps/web y consumen este estado a través de la store (store.ts).
 *
 * Convención de coordenadas: el mundo usa unidades reales (m o cm según
 * `scenario.world.lengthUnit`); los píxeles existen SOLO en `Viewport`
 * (transforms.ts hace la conversión). Los objetos se posicionan por su
 * centro geométrico (misma convención que @lba/asset-catalog).
 */

/** Herramientas del editor (prompt 03.1). */
export const TOOL_IDS = [
  'select',
  'wall',
  'door',
  'window',
  'object',
  'zone',
  'measure',
  'delete',
] as const
export type ToolId = (typeof TOOL_IDS)[number]

/** Etiquetas visibles de cada herramienta (UI en español). */
export const TOOL_LABELS: Readonly<Record<ToolId, string>> = {
  select: 'Seleccionar',
  wall: 'Pared',
  door: 'Puerta',
  window: 'Ventana',
  object: 'Objeto',
  zone: 'Zona',
  measure: 'Medir',
  delete: 'Borrar',
}

/** Pistas de uso que la barra de estado muestra por herramienta. */
export const TOOL_HINTS: Readonly<Record<ToolId, string>> = {
  select: 'Haz clic para seleccionar; arrastra para mover; Shift+clic añade a la selección.',
  wall: 'Arrastra desde el punto inicial hasta el final para dibujar la pared.',
  door: 'Elige una puerta del catálogo y haz clic sobre un muro para colocarla.',
  window: 'Elige una ventana del catálogo y haz clic sobre un muro para colocarla.',
  object: 'Elige un objeto del catálogo y haz clic en el lienzo para colocarlo.',
  zone: 'Arrastra para dibujar el rectángulo de la zona; luego ponle nombre.',
  measure: 'Haz clic en dos puntos para medir la distancia entre ellos.',
  delete: 'Haz clic sobre un objeto o zona para borrarlo (Ctrl+Z para deshacer).',
}

/** Selección activa: objetos y zonas (los IDs son estables y únicos). */
export interface Selection {
  readonly objectIds: readonly WorldObjectId[]
  readonly zoneIds: readonly ZoneId[]
}

/** Selección vacía. */
export const EMPTY_SELECTION: Selection = { objectIds: [], zoneIds: [] }

/**
 * Vista de la cámara: `pixelsPerUnit` es el factor de zoom (px por unidad
 * del mundo) y `pan` el desplazamiento de pantalla en píxeles. El mundo NO
 * conoce píxeles; esta es la única frontera (criterio 03.2: ubicación y
 * unidades independientes de píxeles).
 */
export interface Viewport {
  readonly pixelsPerUnit: number
  readonly pan: Position
}

/** Límites del zoom (px por unidad) para evitar lienzo degenerado. */
export const ZOOM_MIN = 4
export const ZOOM_MAX = 600

/** Configuración de cuadrícula y ajuste (snap) en unidades del mundo. */
export interface GridConfig {
  /** Mostrar la cuadrícula. */
  readonly visible: boolean
  /** Tamaño de la celda en unidades del mundo (> 0). */
  readonly size: number
  /** Ajustar puntos y ángulos a la cuadrícula. */
  readonly snapEnabled: boolean
  /** Paso de ajuste angular en grados (paredes y rotaciones). */
  readonly angleSnapDeg: number
}

/** Configuración por defecto: celda de 0.5 unidades y ángulos de 15°. */
export const DEFAULT_GRID: GridConfig = {
  visible: true,
  size: 0.5,
  snapEnabled: true,
  angleSnapDeg: 15,
}

/** Pasos de cuadrícula permitidos en el selector (unidades del mundo). */
export const GRID_SIZE_OPTIONS = [0.1, 0.25, 0.5, 1, 2] as const

/** Punto de arranque del borrador de pared (en unidades del mundo). */
export interface WallDraft {
  readonly kind: 'wall'
  readonly start: Position
  readonly current: Position
  readonly presetId: string
  /** Espesor del preset (copiado al iniciar para que la vista previa sea pura). */
  readonly thickness: number
}

/** Borrador de zona en curso (esquinas en unidades del mundo). */
export interface ZoneDraft {
  readonly kind: 'zone'
  readonly start: Position
  readonly current: Position
  readonly presetId: string
}

/** Sesión de medición: primer punto fijado y punto actual. */
export interface MeasureSession {
  readonly start: Position
  readonly current: Position
}

/** Arrastre de objetos seleccionados en curso (herramienta seleccionar). */
export interface MoveDrag {
  readonly start: Position
  readonly current: Position
}

/** Sesión de banda de selección: ancla del clic y punto actual. */
export interface MarqueeSession {
  readonly start: Position
  readonly current: Position
}

/** Rectángulo de la banda normalizado (min/max). */
export interface MarqueeRect {
  readonly min: Position
  readonly max: Position
}

/** Normaliza una sesión de banda a su rectángulo. */
export function marqueeRect(session: MarqueeSession): MarqueeRect {
  return {
    min: {
      x: Math.min(session.start.x, session.current.x),
      y: Math.min(session.start.y, session.current.y),
    },
    max: {
      x: Math.max(session.start.x, session.current.x),
      y: Math.max(session.start.y, session.current.y),
    },
  }
}

/** Borradores posibles (pared o zona); la medición vive aparte. */
export type Draft = WallDraft | ZoneDraft

/** Niveles de mensaje del panel de estado. */
export type MessageLevel = 'info' | 'warn' | 'error'

/** Mensaje discreto del panel de estado (prompt 03.1: «panel de mensajes»). */
export interface EditorMessage {
  readonly id: number
  readonly level: MessageLevel
  readonly text: string
  /** Marca temporal en ms desde el origen de tiempo del editor. */
  readonly at: number
}

/** Documento editable: el escenario del dominio + la selección actual. */
export interface EditorDocument {
  readonly scenario: Scenario
  readonly selection: Selection
}

/** Estado completo del editor (lo que la UI consume vía snapshot). */
export interface EditorState {
  readonly document: EditorDocument
  readonly tool: ToolId
  /** Preset activo del catálogo (puerta/ventana/objeto/zona). */
  readonly activePresetId: string | null
  readonly view: Viewport
  readonly grid: GridConfig
  /** Borrador de dibujo en curso, si lo hay. */
  readonly draft: Draft | null
  /** Medición en curso, si la hay. */
  readonly measure: MeasureSession | null
  /** Arrastre de objetos en curso (vista previa; se confirma al soltar). */
  readonly moveDrag: MoveDrag | null
  /** Banda de selección en curso. */
  readonly marquee: MarqueeSession | null
  /** Posición del cursor en unidades del mundo (null si está fuera). */
  readonly cursor: Position | null
  /** Últimos mensajes del panel de estado (máximo HISTORY_MESSAGE_LIMIT). */
  readonly messages: readonly EditorMessage[]
  /** Se puede deshacer (y etiqueta de la operación a deshacer). */
  readonly canUndo: boolean
  readonly undoLabel: string | null
  readonly canRedo: boolean
  readonly redoLabel: string | null
  /** IDs de objetos con advertencia de solapamiento (03.3). */
  readonly overlappingObjectIds: readonly WorldObjectId[]
}

/** Máximo de mensajes retenidos en el panel de estado. */
export const MESSAGE_LIMIT = 50

/** Tamaño máximo del historial undo/redo (instantáneas de documento). */
export const HISTORY_LIMIT = 100

/** Entrada del historial: instantáneas antes/después de una operación. */
export interface HistoryEntry {
  readonly label: string
  readonly before: EditorDocument
  readonly after: EditorDocument
}

/** Formatea una longitud en la unidad del mundo con 2 decimales recortados. */
export function formatLength(value: number, unit: WorldLengthUnit): string {
  const rounded = Math.round(value * 100) / 100
  return `${rounded} ${unit}`
}

/** Normaliza una rotación a [0, 360). */
export function normalizeRotation(degrees: number): Rotation {
  const wrapped = degrees % 360
  return (wrapped < 0 ? wrapped + 360 : wrapped) as Rotation
}
