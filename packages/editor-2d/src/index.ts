/**
 * @lba/editor-2d — Núcleo del editor 2D de LBA_Restaurant_Engine (FASE 03).
 *
 * Traduce operaciones de usuario en comandos validados sobre el escenario
 * de @lba/domain, con undo/redo por instantáneas, snapping, transformaciones
 * mundo-pantalla y un modelo de render puro. La presentación (React/Konva)
 * vive en apps/web y consume este paquete; aquí NO hay DOM ni frameworks
 * (regla 11 del prompt maestro), lo que permite probar cada herramienta,
 * comando y transformación de forma unitaria.
 */

// Estado y tipos
export {
  TOOL_IDS,
  TOOL_LABELS,
  TOOL_HINTS,
  EMPTY_SELECTION,
  MESSAGE_LIMIT,
  HISTORY_LIMIT,
  GRID_SIZE_OPTIONS,
  DEFAULT_GRID,
  ZOOM_MIN,
  ZOOM_MAX,
  formatLength,
  normalizeRotation,
  marqueeRect,
} from './types'
export type {
  ToolId,
  Selection,
  Viewport,
  GridConfig,
  WallDraft,
  ZoneDraft,
  Draft,
  MeasureSession,
  MoveDrag,
  MarqueeSession,
  MarqueeRect,
  MessageLevel,
  EditorMessage,
  EditorDocument,
  EditorState,
  HistoryEntry,
} from './types'

// Documento y geometría
export {
  createEmptyDocument,
  emptyScenario,
  withScenario,
  isScenarioValid,
  DEFAULT_WORLD_SIZE,
  lengthUnitOf,
} from './document'
export {
  add,
  sub,
  scale,
  rotatePoint,
  rotateAround,
  distance,
  angleOf,
  projectOnSegment,
  closestPointOnSegment,
  obbCorners,
  obbIntersects,
  rotatedRectAabb,
  aabbIntersects,
  subtractSpans,
} from './geometry'
export type { Aabb } from './geometry'

// Transformaciones mundo ↔ pantalla
export {
  worldToScreen,
  screenToWorld,
  worldLengthToPx,
  pxToWorldLength,
  clampZoom,
  zoomAt,
  initialViewport,
  fitRect,
} from './transforms'

// Ajuste (snap)
export {
  snapPoint,
  snapAngle,
  snapToWallEndpoints,
  snapWallEnd,
  ENDPOINT_MAGNET_RADIUS,
} from './snap'
export type { WallSnap } from './snap'

// IDs
export { slugify, nextObjectId, nextZoneId } from './ids'

// Instanciación de presets
export {
  instantiateObject,
  instantiateZone,
  PRESET_ORIGIN_KEY,
  HINGE_KEY,
  OPENING_KEY,
  SLIDE_KEY,
} from './instantiate'
export type { InstantiateOptions, HingeSide, OpeningSide, SlideDirection } from './instantiate'

// Comandos y store
export * as commands from './commands'
export type { CommandResult } from './commands'
export { EditorStore, MIN_ZONE_SIZE } from './store'

// Hit-testing y adjuntos de muro
export {
  hitTest,
  pointInObject,
  wallEndpoints,
  findWallUnder,
  openingPlacementOnWall,
  WALL_ATTACH_RADIUS,
  HIT_TOLERANCE,
} from './hit-test'
export type { HitTarget, WallAttachment } from './hit-test'

// Modelo de render (primitivas puras para Konva)
export { buildRenderModel, OVERLAP_COLOR } from './render-model'
export type {
  RenderModel,
  WallSegmentPrimitive,
  DoorPrimitive,
  WindowPrimitive,
  ObjectPrimitive,
  ZonePrimitive,
} from './render-model'

// Validaciones de dimensión (catálogo)
export {
  originPresetOf,
  dimensionLimitsFor,
  rangeErrorMessage,
  FALLBACK_LIMITS,
} from './validation'
export type { DimensionLimits } from './validation'

// Solapamientos
export { computeOverlappingObjects } from './overlap'

// Persistencia y autosave
export {
  serializeScenario,
  parseScenarioJson,
  autosaveKey,
  writeAutosave,
  readAutosave,
  discardAutosave,
  MemoryAutosaveStorage,
} from './persist'
export type { AutosaveStorage, SaveResult } from './persist'
