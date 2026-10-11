import type {
  Position,
  Rotation,
  Scenario,
  WorldObject,
  WorldObjectId,
  Zone,
  ZoneId,
} from '@lba/domain'
import {
  getObjectPreset,
  getZonePreset,
  listObjectPresetsByGroup,
  CATALOG,
} from '@lba/asset-catalog'
import type { CatalogObjectPreset } from '@lba/asset-catalog'
import { angleOf, distance, rotateAround, sub } from './geometry'
import { findWallUnder, hitTest, openingPlacementOnWall } from './hit-test'
import { instantiateObject, instantiateZone } from './instantiate'
import { nextObjectId } from './ids'
import { computeOverlappingObjects } from './overlap'
import { buildRenderModel } from './render-model'
import { initialViewport } from './transforms'
import { snapPoint, snapToWallEndpoints, snapWallEnd } from './snap'
import * as cmd from './commands'
import type { CommandResult } from './commands'
import { createEmptyDocument, withScenario } from './document'
import type {
  Draft,
  EditorDocument,
  EditorMessage,
  EditorState,
  GridConfig,
  HistoryEntry,
  MessageLevel,
  Selection,
  ToolId,
  Viewport,
} from './types'
import {
  DEFAULT_GRID,
  EMPTY_SELECTION,
  HISTORY_LIMIT,
  MESSAGE_LIMIT,
  formatLength,
  marqueeRect,
  normalizeRotation,
} from './types'

/**
 * Store del editor 2D (FASE 03): única fuente de verdad para la UI.
 *
 * La UI (apps/web) traduce eventos de React/Konva en llamadas semánticas a
 * esta store; cada cambio de documento pasa por un COMANDO validado
 * (commands.ts) y queda registrado en el historial como instantáneas
 * antes/después (undo/redo exacto, sin lógica de inversión que mantener).
 *
 * El paquete es puro: sin React, sin DOM, sin Konva (regla 11).
 */

/** Preset por defecto de cada herramienta de dibujo. */
const TOOL_DEFAULT_PRESET: Record<string, string> = {
  wall: 'cat_wall-interior-100',
  door: 'cat_door-swing-wood-90',
  window: 'cat_window-fixed-120',
  zone: 'cat_zone-dining',
}

/** Tamaño mínimo de una zona nueva (unidades del mundo). */
export const MIN_ZONE_SIZE = 0.5

export class EditorStore {
  private state: EditorState
  private undoStack: HistoryEntry[] = []
  private redoStack: HistoryEntry[] = []
  private readonly listeners = new Set<() => void>()
  private messageSeq = 0
  private clockSeq = 0

  constructor(initial?: EditorDocument) {
    this.state = this.baseState(initial ?? createEmptyDocument())
  }

  // ---------------------------------------------------------------- lectura

  getState(): EditorState {
    return this.state
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** Modelo de render derivado (primitivas puras para Konva). */
  getRenderModel() {
    return buildRenderModel(this.state)
  }

  /** Objeto por id (comodidad para el inspector). */
  getObject(id: WorldObjectId): WorldObject | undefined {
    return this.state.document.scenario.objects.find((o) => o.id === id)
  }

  /** Zona por id. */
  getZone(id: ZoneId): Zone | undefined {
    return this.state.document.scenario.zones.find((z) => z.id === id)
  }

  /** Etiquetas del historial (para pruebas y depuración). */
  historyLabels(): { undo: readonly string[]; redo: readonly string[] } {
    return { undo: this.undoStack.map((e) => e.label), redo: this.redoStack.map((e) => e.label) }
  }

  // ------------------------------------------------------------ herramientas

  selectTool(tool: ToolId): void {
    this.update({ tool, draft: null, measure: null, moveDrag: null, marquee: null })
  }

  /**
   * Fija el preset activo. Si el preset pertenece a un grupo con herramienta
   * propia (pared/puerta/ventana/zona), cambia a esa herramienta para que el
   * clic siguiente coloque lo elegido (elegir en catálogo → dibujar).
   */
  pickPreset(presetId: string | null): void {
    if (presetId === null) {
      this.update({ activePresetId: null })
      return
    }
    const objectPreset = getObjectPreset(presetId)
    if (objectPreset) {
      const tool: ToolId =
        objectPreset.group === 'wall'
          ? 'wall'
          : objectPreset.group === 'door'
            ? 'door'
            : objectPreset.group === 'window'
              ? 'window'
              : 'object'
      this.update({ activePresetId: presetId, tool, draft: null })
      return
    }
    if (getZonePreset(presetId)) {
      this.update({ activePresetId: presetId, tool: 'zone', draft: null })
      return
    }
    this.pushMessage('error', `Preset desconocido: "${presetId}"`)
  }

  setGrid(patch: Partial<GridConfig>): void {
    this.update({ grid: { ...this.state.grid, ...patch } })
  }

  setView(view: Viewport): void {
    this.update({ view })
  }

  setCursor(world: Position | null): void {
    const prev = this.state.cursor
    const changed =
      (world === null) !== (prev === null) ||
      (world !== null && prev !== null && (world.x !== prev.x || world.y !== prev.y))
    if (changed) this.update({ cursor: world })
  }

  // --------------------------------------------------------------- puntero

  /**
   * Pulsación principal según la herramienta activa. `select` no dibuja
   * aquí: la UI de canvas gestiona selección/arrastre/banda con eventos de
   * forma y llama a los métodos semánticos correspondientes.
   */
  pointerDown(world: Position, options: { button: number; shift: boolean }): void {
    const { tool } = this.state
    if (tool === 'select' || options.button !== 0) return
    switch (tool) {
      case 'wall':
        this.beginWallDraft(world)
        break
      case 'door':
      case 'window':
        this.placeOpening(world, tool)
        break
      case 'object':
        this.placeObject(world)
        break
      case 'zone':
        this.beginZoneDraft(world)
        break
      case 'measure':
        this.measureClick(world)
        break
      case 'delete':
        this.deleteAt(world)
        break
    }
  }

  pointerMove(world: Position): void {
    this.setCursor(world)
    const { draft, measure, moveDrag, marquee } = this.state
    if (draft?.kind === 'wall') {
      const snapped = snapWallEnd(
        draft.start,
        world,
        this.state.document.scenario.objects.filter((o) => o.kind === 'wall'),
        this.state.grid,
      )
      this.update({ draft: { ...draft, current: snapped.end } })
      return
    }
    if (draft?.kind === 'zone') {
      this.update({ draft: { ...draft, current: snapPoint(world, this.state.grid) } })
      return
    }
    if (measure) {
      this.update({ measure: { ...measure, current: snapPoint(world, this.state.grid) } })
      return
    }
    if (moveDrag) {
      this.update({ moveDrag: { ...moveDrag, current: world } })
      return
    }
    if (marquee) {
      this.update({ marquee: { ...marquee, current: world } })
    }
  }

  pointerUp(): void {
    const { draft } = this.state
    if (draft?.kind === 'wall') {
      this.commitWallDraft()
      return
    }
    if (draft?.kind === 'zone') {
      this.commitZoneDraft()
      return
    }
    if (this.state.measure) return // la medición se cierra con clic, no al soltar
    if (this.state.moveDrag) {
      this.commitMoveDrag()
      return
    }
    if (this.state.marquee) {
      this.commitMarquee()
    }
  }

  // -------------------------------------------------------------- selección

  selectObject(id: WorldObjectId, additive: boolean): void {
    const current = this.state.document.selection
    const objectIds = additive
      ? current.objectIds.includes(id)
        ? current.objectIds.filter((x) => x !== id)
        : [...current.objectIds, id]
      : [id]
    const zoneIds = additive ? current.zoneIds : []
    this.setSelection({ objectIds, zoneIds })
  }

  selectZone(id: ZoneId, additive: boolean): void {
    const current = this.state.document.selection
    const zoneIds = additive
      ? current.zoneIds.includes(id)
        ? current.zoneIds.filter((x) => x !== id)
        : [...current.zoneIds, id]
      : [id]
    const objectIds = additive ? current.objectIds : []
    this.setSelection({ objectIds, zoneIds })
  }

  /** Sustituye la selección (banda/marquee o programática). */
  setSelection(selection: Selection): void {
    this.update({ document: { ...this.state.document, selection } })
  }

  clearSelection(): void {
    this.setSelection(EMPTY_SELECTION)
  }

  /** Comienza una banda de selección desde un punto (clic en vacío). */
  beginMarquee(world: Position): void {
    this.update({
      marquee: { start: world, current: world },
      document: { ...this.state.document, selection: EMPTY_SELECTION },
    })
  }

  /** Cicla la selección por teclado (Tab / Shift+Tab). */
  cycleSelection(direction: 1 | -1): void {
    const { objects, zones } = this.state.document.scenario
    const ids: string[] = [...objects.map((o) => o.id), ...zones.map((z) => z.id)]
    if (ids.length === 0) return
    const current = this.state.document.selection
    const currentId = current.objectIds[0] ?? current.zoneIds[0] ?? null
    let index = currentId === null ? -1 : ids.indexOf(currentId)
    index = (index + direction + ids.length) % ids.length
    const next = ids[index]!
    const isZone = zones.some((z) => z.id === next)
    this.setSelection(
      isZone
        ? { objectIds: [], zoneIds: [next as ZoneId] }
        : { objectIds: [next as WorldObjectId], zoneIds: [] },
    )
  }

  // ------------------------------------------------------------- arrastres

  /** Comienza el arrastre de los elementos seleccionados (herramienta select). */
  beginMoveDrag(world: Position): void {
    this.update({ moveDrag: { start: world, current: world } })
  }

  /** Confirma el arrastre en curso con ajuste de rejilla del desplazamiento. */
  commitMoveDrag(): void {
    const drag = this.state.moveDrag
    if (!drag) return
    let delta = sub(drag.current, drag.start)
    if (this.state.grid.snapEnabled && this.state.grid.size > 0) {
      const step = this.state.grid.size
      delta = { x: Math.round(delta.x / step) * step, y: Math.round(delta.y / step) * step }
    }
    this.update({ moveDrag: null })
    if (delta.x === 0 && delta.y === 0) return
    const { objectIds, zoneIds } = this.state.document.selection
    this.run(cmd.moveElements(this.state.document, objectIds, zoneIds, delta))
  }

  cancelMoveDrag(): void {
    this.update({ moveDrag: null })
  }

  /**
   * Confirmación de la transformación visual de Konva (rotación con el
   * Transformer): normaliza la rotación y rota el punto de interacción con
   * el objeto. La redimensión se confirma con resizeObjectFromInspector.
   */
  commitObjectTransform(
    id: WorldObjectId,
    next: { position: Position; rotation: number; width: number; depth: number },
  ): void {
    const obj = this.getObject(id)
    if (!obj) return
    const rotation = normalizeRotation(next.rotation)
    const sameGeometry =
      obj.position.x === next.position.x &&
      obj.position.y === next.position.y &&
      obj.dimensions.width === next.width &&
      obj.dimensions.depth === next.depth
    if (sameGeometry && obj.rotation === rotation) return
    const delta = normalizeRotation(rotation - obj.rotation)
    const interactionPoint =
      delta === 0 ? obj.interactionPoint : rotateAround(obj.interactionPoint, obj.position, delta)
    this.run(
      cmd.updateObject(this.state.document, id, {
        position: next.position,
        rotation,
        dimensions: { width: next.width, depth: next.depth },
        interactionPoint,
      }),
    )
  }

  // ------------------------------------------------------- ediciones inspector

  patchObject(id: WorldObjectId, patch: Partial<WorldObject>): void {
    this.run(cmd.updateObject(this.state.document, id, patch))
  }

  updateWallLength(id: WorldObjectId, length: number): void {
    this.run(cmd.updateWallLength(this.state.document, id, length))
  }

  patchZone(id: ZoneId, patch: Partial<Zone>): void {
    this.run(cmd.updateZone(this.state.document, id, patch))
  }

  patchScenario(
    patch: Partial<Pick<Scenario, 'name' | 'description' | 'seed'>> & {
      worldSize?: { width: number; depth: number }
      lengthUnit?: 'm' | 'cm'
    },
  ): void {
    this.run(cmd.updateScenario(this.state.document, patch))
  }

  duplicateSelection(): void {
    const ids = this.state.document.selection.objectIds
    if (ids.length === 0) {
      this.pushMessage('info', 'No hay objetos seleccionados que duplicar.')
      return
    }
    const offset = { x: this.state.grid.size, y: this.state.grid.size }
    const newIds = ids.map((id) => {
      const src = this.getObject(id)
      return nextObjectId(
        this.state.document.scenario,
        `${(src?.id ?? 'obj_x').replace(/^obj_/, '')}-copia`,
      )
    })
    this.run(cmd.duplicateObjects(this.state.document, ids, offset, newIds))
  }

  /** Borra la selección completa (la UI pide confirmación si es masiva). */
  deleteSelection(): void {
    const { selection } = this.state.document
    this.run(cmd.deleteElements(this.state.document, selection.objectIds, selection.zoneIds))
  }

  /** Mueve la selección con teclado: paso de rejilla × multiplicador. */
  moveSelection(delta: Position, multiply = 1): void {
    const { selection } = this.state.document
    if (selection.objectIds.length === 0 && selection.zoneIds.length === 0) return
    const scaled = {
      x: delta.x * this.state.grid.size * multiply,
      y: delta.y * this.state.grid.size * multiply,
    }
    if (scaled.x === 0 && scaled.y === 0) return
    this.run(cmd.moveElements(this.state.document, selection.objectIds, selection.zoneIds, scaled))
  }

  rotateSelection(degrees: number): void {
    const ids = this.state.document.selection.objectIds
    if (ids.length === 0) return
    this.run(cmd.rotateObjects(this.state.document, ids, degrees))
  }

  // --------------------------------------------------------------- historial

  undo(): void {
    const entry = this.undoStack.pop()
    if (!entry) return
    this.redoStack.push(entry)
    this.applyDocument(entry.before)
    this.pushMessage('info', `Deshecho: ${entry.label}`)
  }

  redo(): void {
    const entry = this.redoStack.pop()
    if (!entry) return
    this.undoStack.push(entry)
    this.applyDocument(entry.after)
    this.pushMessage('info', `Rehecho: ${entry.label}`)
  }

  // -------------------------------------------------------------- escenario

  /**
   * Sustituye el escenario (cargar fichero / restaurar autosave). Se registra
   * como una operación de historial: deshacer recupera el documento previo.
   */
  loadScenario(scenario: Scenario, label: string): void {
    const before = this.state.document
    const after = withScenario(before, scenario)
    this.commitHistory({ label, before, after })
    this.applyDocument(after)
    this.pushMessage(
      'info',
      `${label}: «${scenario.name}» (${scenario.objects.length} objetos, ${scenario.zones.length} zonas)`,
    )
  }

  // ---------------------------------------------------------------- mensajes

  dismissMessage(id: number): void {
    this.update({ messages: this.state.messages.filter((m) => m.id !== id) })
  }

  clearMessages(): void {
    this.update({ messages: [] })
  }

  pushMessage(level: MessageLevel, text: string): void {
    const message: EditorMessage = { id: ++this.messageSeq, level, text, at: ++this.clockSeq }
    const messages = [...this.state.messages, message].slice(-MESSAGE_LIMIT)
    this.update({ messages })
  }

  // ------------------------------------------------------------ internos

  private baseState(document: EditorDocument): EditorState {
    return {
      document,
      tool: 'select',
      activePresetId: null,
      view: initialViewport(),
      grid: DEFAULT_GRID,
      draft: null,
      measure: null,
      moveDrag: null,
      marquee: null,
      cursor: null,
      messages: [],
      canUndo: false,
      undoLabel: null,
      canRedo: false,
      redoLabel: null,
      overlappingObjectIds: computeOverlappingObjects(document.scenario.objects),
    }
  }

  private update(patch: Partial<EditorState>): void {
    this.state = { ...this.state, ...patch }
    this.emit()
  }

  private emit(): void {
    for (const listener of this.listeners) listener()
  }

  /** Ejecuta un comando y registra el historial si cambia el documento. */
  private run(result: CommandResult): void {
    if (!result.ok) {
      this.pushMessage('error', result.error)
      return
    }
    const before = this.state.document
    const after = result.document
    if (before === after) return
    this.commitHistory({ label: result.label, before, after })
    this.applyDocument(after)
  }

  private commitHistory(entry: HistoryEntry): void {
    this.undoStack.push(entry)
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift()
    this.redoStack = []
    this.update({
      canUndo: true,
      undoLabel: entry.label,
      canRedo: false,
      redoLabel: null,
    })
  }

  /** Aplica un documento nuevo: recalcula solapes y refleja el historial. */
  private applyDocument(document: EditorDocument): void {
    const previousOverlaps = new Set(this.state.overlappingObjectIds)
    const overlappingObjectIds = computeOverlappingObjects(document.scenario.objects)
    if (overlappingObjectIds.length > 0) {
      const fresh = overlappingObjectIds.filter((id) => !previousOverlaps.has(id))
      if (fresh.length > 0) {
        this.pushMessage(
          'warn',
          `Advertencia de solapamiento: ${fresh.length} objeto(s) se superponen (aviso geométrico, no una comprobación arquitectónica).`,
        )
      }
    }
    this.update({
      document,
      overlappingObjectIds,
      canUndo: this.undoStack.length > 0,
      undoLabel: this.undoStack[this.undoStack.length - 1]?.label ?? null,
      canRedo: this.redoStack.length > 0,
      redoLabel: this.redoStack[this.redoStack.length - 1]?.label ?? null,
      draft: null,
      moveDrag: null,
      marquee: null,
    })
  }

  // --------------------------------------------------- herramientas (privadas)

  /** Preset de objeto activo para la herramienta (activo si coincide, si no, el por defecto). */
  private objectPresetFor(tool: 'wall' | 'door' | 'window'): CatalogObjectPreset | null {
    const activeId = this.state.activePresetId
    if (activeId) {
      const preset = getObjectPreset(activeId)
      if (preset && preset.group === tool) return preset
    }
    const fallback = getObjectPreset(TOOL_DEFAULT_PRESET[tool]!)
    if (fallback) return fallback
    return listObjectPresetsByGroup(tool)[0] ?? null
  }

  private beginWallDraft(world: Position): void {
    const preset = this.objectPresetFor('wall')
    if (!preset) {
      this.pushMessage('error', 'No hay un preset de pared disponible en el catálogo.')
      return
    }
    const walls = this.state.document.scenario.objects.filter((o) => o.kind === 'wall')
    const onGrid = snapPoint(world, this.state.grid)
    const start = snapToWallEndpoints(onGrid, walls) ?? onGrid
    const draft: Draft = {
      kind: 'wall',
      start,
      current: start,
      presetId: preset.id,
      thickness: preset.dimensions.depth,
    }
    this.update({ draft })
  }

  private commitWallDraft(): void {
    const draft = this.state.draft
    if (draft?.kind !== 'wall') return
    const preset = getObjectPreset(draft.presetId)
    if (!preset) {
      this.update({ draft: null })
      return
    }
    const v = sub(draft.current, draft.start)
    const length = Math.hypot(v.x, v.y)
    const minLength = preset.parameters['length']?.record.minValue ?? 0.1
    if (length < minLength) {
      this.update({ draft: null })
      this.pushMessage(
        'error',
        `La pared debe medir al menos ${formatLength(minLength, this.unit())}.`,
      )
      return
    }
    const position = {
      x: (draft.start.x + draft.current.x) / 2,
      y: (draft.start.y + draft.current.y) / 2,
    }
    const rotation = normalizeRotation(angleOf(v)) as Rotation
    const wall = instantiateObject(preset, this.state.document.scenario, {
      position,
      rotation,
      wallLength: length,
    })
    this.update({ draft: null })
    this.run(cmd.addObject(this.state.document, wall))
    this.pushMessage('info', `Pared añadida (${formatLength(length, this.unit())}).`)
  }

  private placeOpening(world: Position, tool: 'door' | 'window'): void {
    const preset = this.objectPresetFor(tool)
    if (!preset) {
      this.pushMessage('error', 'No hay un preset disponible; elige uno del catálogo.')
      return
    }
    const attachment = findWallUnder(this.state.document.scenario.objects, world)
    if (!attachment) {
      this.pushMessage(
        'error',
        tool === 'door'
          ? 'Coloca la puerta sobre un muro cercano (a menos de 0.6 m).'
          : 'Coloca la ventana sobre un muro cercano (a menos de 0.6 m).',
      )
      return
    }
    const placement = openingPlacementOnWall(
      attachment.wall,
      attachment.point,
      preset.dimensions.width,
    )
    if (!placement) {
      this.pushMessage(
        'error',
        `El muro es demasiado corto para ese hueco (necesita ${formatLength(preset.dimensions.width, this.unit())}).`,
      )
      return
    }
    const obj = instantiateObject(preset, this.state.document.scenario, {
      position: placement.position,
      rotation: normalizeRotation(placement.rotation) as Rotation,
    })
    this.run(cmd.addObject(this.state.document, obj))
  }

  private placeObject(world: Position): void {
    const activeId = this.state.activePresetId
    const preset = activeId ? getObjectPreset(activeId) : undefined
    if (
      !preset ||
      preset.group === 'wall' ||
      preset.group === 'door' ||
      preset.group === 'window'
    ) {
      this.pushMessage('error', 'Elige un objeto del catálogo antes de colocar (panel izquierdo).')
      return
    }
    const position = snapPoint(world, this.state.grid)
    const obj = instantiateObject(preset, this.state.document.scenario, {
      position,
      rotation: 0,
    })
    this.run(cmd.addObject(this.state.document, obj))
  }

  private beginZoneDraft(world: Position): void {
    const preset = this.activeZonePreset()
    if (!preset) {
      this.pushMessage('error', 'No hay un preset de zona disponible en el catálogo.')
      return
    }
    const start = snapPoint(world, this.state.grid)
    this.update({ draft: { kind: 'zone', start, current: start, presetId: preset.id } })
  }

  private commitZoneDraft(): void {
    const draft = this.state.draft
    if (draft?.kind !== 'zone') return
    const preset = getZonePreset(draft.presetId)
    if (!preset) {
      this.update({ draft: null })
      return
    }
    const min = {
      x: Math.min(draft.start.x, draft.current.x),
      y: Math.min(draft.start.y, draft.current.y),
    }
    const max = {
      x: Math.max(draft.start.x, draft.current.x),
      y: Math.max(draft.start.y, draft.current.y),
    }
    if (max.x - min.x < MIN_ZONE_SIZE || max.y - min.y < MIN_ZONE_SIZE) {
      this.update({ draft: null })
      this.pushMessage(
        'error',
        `La zona es demasiado pequeña: dibuja al menos ${formatLength(MIN_ZONE_SIZE, this.unit())} por lado.`,
      )
      return
    }
    const zone = instantiateZone(preset, this.state.document.scenario, { min, max })
    this.update({ draft: null })
    this.run(cmd.addZone(this.state.document, zone))
    this.pushMessage('info', `Zona «${zone.name}» añadida; renómbrala en el inspector.`)
  }

  private activeZonePreset() {
    const activeId = this.state.activePresetId
    if (activeId) {
      const zonePreset = getZonePreset(activeId)
      if (zonePreset) return zonePreset
    }
    return (
      getZonePreset(TOOL_DEFAULT_PRESET['zone']!) ?? CATALOG.zones.values().next().value ?? null
    )
  }

  private measureClick(world: Position): void {
    const p = snapPoint(world, this.state.grid)
    if (!this.state.measure) {
      this.update({ measure: { start: p, current: p } })
      return
    }
    const d = distance(this.state.measure.start, p)
    this.update({ measure: null })
    this.pushMessage('info', `Distancia medida: ${formatLength(d, this.unit())}.`)
  }

  private deleteAt(world: Position): void {
    const hit = hitTest(this.state.document, world)
    if (!hit) {
      this.pushMessage('info', 'Nada que borrar bajo el cursor.')
      return
    }
    if (hit.kind === 'object') {
      const obj = this.getObject(hit.id)
      this.run(cmd.deleteElements(this.state.document, [hit.id], []))
      this.pushMessage('info', `Borrado: ${obj?.name ?? hit.id} (Ctrl+Z para deshacer).`)
      return
    }
    const zone = this.getZone(hit.id)
    this.run(cmd.deleteElements(this.state.document, [], [hit.id]))
    this.pushMessage('info', `Zona borrada: ${zone?.name ?? hit.id} (Ctrl+Z para deshacer).`)
  }

  private commitMarquee(): void {
    const marquee = this.state.marquee
    this.update({ marquee: null })
    if (!marquee) return
    const rect = marqueeRect(marquee)
    const objects = this.state.document.scenario.objects.filter((o) => {
      const halfW = o.dimensions.width / 2
      const halfD = o.dimensions.depth / 2
      const rad = (o.rotation * Math.PI) / 180
      const cos = Math.abs(Math.cos(rad))
      const sin = Math.abs(Math.sin(rad))
      const ex = halfW * cos + halfD * sin
      const ey = halfW * sin + halfD * cos
      return (
        o.position.x + ex > rect.min.x &&
        o.position.x - ex < rect.max.x &&
        o.position.y + ey > rect.min.y &&
        o.position.y - ey < rect.max.y
      )
    })
    const zones = this.state.document.scenario.zones.filter(
      (z) =>
        z.bounds.max.x > rect.min.x &&
        z.bounds.min.x < rect.max.x &&
        z.bounds.max.y > rect.min.y &&
        z.bounds.min.y < rect.max.y,
    )
    this.setSelection({
      objectIds: objects.map((o) => o.id),
      zoneIds: zones.map((z) => z.id),
    })
    if (objects.length + zones.length > 0) {
      this.pushMessage(
        'info',
        `Seleccionados ${objects.length} objeto(s) y ${zones.length} zona(s).`,
      )
    }
  }

  private unit(): 'm' | 'cm' {
    return this.state.document.scenario.world.lengthUnit
  }
}
