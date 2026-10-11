/**
 * Lienzo 2D con Konva/React-Konva (prompt 03.1: «implementa el canvas con
 * Konva/React Konva»). Este componente SOLO proyecta el modelo de render
 * puro de @lba/editor-2d y traduce eventos de puntero a llamadas de la
 * store; la geometría y las decisiones visuales viven (y se prueban) en el
 * paquete, no aquí (regla 11).
 *
 - Rueda: zoom hacia el cursor. Botón central o Espacio+arrastrar: pan.
 - Herramienta select: clic selecciona, arrastra mueve, clic en vacío
   abre la banda de selección. Los muebles admiten el manijo de rotación
   (Transformer); muros y aperturas se editan con precisión numérica.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type Konva from 'konva'
import { Circle, Group, Layer, Line, Rect, Stage, Text, Transformer, Arc } from 'react-konva'
import type { EditorStore } from '@lba/editor-2d'
import {
  OVERLAP_COLOR,
  screenToWorld,
  worldLengthToPx,
  worldToScreen,
  zoomAt,
} from '@lba/editor-2d'
import type { ObjectPrimitive, RenderModel } from '@lba/editor-2d'
import { useEditorState } from './useEditorStore'

const ZONE_COLORS: Record<string, string> = {
  kitchen: '#e8a13c',
  dining: '#3c86e8',
  bar: '#8e44ad',
  vip: '#c9a227',
  pizzeria: '#d35400',
  dishwashing: '#16a085',
  storage: '#7f8c8d',
  restroom: '#2980b9',
  exit: '#27ae60',
  corridor: '#95a5a6',
  preparation: '#e67e22',
}

interface CanvasStageProps {
  store: EditorStore
}

export function CanvasStage({ store }: CanvasStageProps) {
  const state = useEditorState(store)
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const nodeRefs = useRef(new Map<string, Konva.Node>())
  const panRef = useRef<{
    active: boolean
    startScreen: { x: number; y: number }
    startPan: { x: number; y: number }
  } | null>(null)
  const [spaceDown, setSpaceDown] = useState(false)
  const [size, setSize] = useState({ width: 900, height: 640 })
  const lastFitSizeRef = useRef({ w: 0, h: 0 })

  // Tamaño del lienzo según su contenedor (ResponsiveObserver).
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const update = () => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setSize({ width: rect.width, height: rect.height })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Espacio = pan temporal (como en editores de planos).
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTypingTarget(e.target)) {
        setSpaceDown(true)
        e.preventDefault()
      }
    }
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // El modelo de render se recalcula por render: es una proyección pura y
  // barata del estado (decenas de objetos), y así siempre está sincronizado.
  const model = store.getRenderModel()

  const pointerWorld = useCallback((): { x: number; y: number } | null => {
    const stage = stageRef.current
    const pointer = stage?.getPointerPosition()
    if (!pointer) return null
    return screenToWorld(pointer, store.getState().view)
  }, [store])

  // Transformer: solo muebles/equipos seleccionados (los muros y aperturas
  // se editan numéricamente en el inspector — decisión documentada).
  const transformableIds = state.document.selection.objectIds.filter((id) => {
    const obj = store.getObject(id)
    return obj !== undefined && obj.kind !== 'wall' && obj.kind !== 'door' && obj.kind !== 'window'
  })
  useEffect(() => {
    const transformer = transformerRef.current
    // Salvaguarda: en pruebas el Transformer es una silueta DOM sin API de
    // Konva (la rotación real la cubren las E2E); y en producción el ref
    // puede aún no estar listo.
    if (!transformer || typeof transformer.nodes !== 'function') return
    const nodes = transformableIds
      .map((id) => nodeRefs.current.get(id))
      .filter((n): n is Konva.Node => n !== undefined)
    transformer.nodes(nodes)
    const layer = transformer.getLayer?.()
    layer?.batchDraw()
  }, [transformableIds, model])

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const world = pointerWorld()
    if (!world) return
    const isPan = e.evt.button === 1 || (spaceDown && e.evt.button === 0)
    if (isPan) {
      const stage = stageRef.current
      const pointer = stage?.getPointerPosition()
      if (pointer) {
        panRef.current = { active: true, startScreen: pointer, startPan: store.getState().view.pan }
      }
      return
    }
    // Las formas con id gestionan su propio onMouseDown (cancelBubble);
    // llegar aquí con target=stage significa clic en vacío o en forma pasiva.
    if (state.tool === 'select') {
      const shapeId = shapeIdFromEvent(e)
      if (shapeId) {
        // Forma pasiva (muro/puerta/ventana) bajo select: seleccionar.
        const obj = store.getObject(shapeId as never)
        if (obj) {
          store.selectObject(obj.id, e.evt.shiftKey)
          store.beginMoveDrag(world)
        }
        return
      }
      store.beginMarquee(world)
      return
    }
    store.pointerDown(world, { button: e.evt.button, shift: e.evt.shiftKey })
  }

  const handleStageMouseMove = () => {
    const world = pointerWorld()
    if (!world) return
    const pan = panRef.current
    if (pan?.active) {
      const stage = stageRef.current
      const pointer = stage?.getPointerPosition()
      if (pointer) {
        store.setView(
          {
            pixelsPerUnit: store.getState().view.pixelsPerUnit,
            pan: {
              x: pan.startPan.x + (pointer.x - pan.startScreen.x),
              y: pan.startPan.y + (pointer.y - pan.startScreen.y),
            },
          },
          { byUser: true },
        )
      }
      return
    }
    store.pointerMove(world)
  }

  const handleStageMouseUp = () => {
    panRef.current = null
    store.pointerUp()
  }

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    const pointer = stage?.getPointerPosition()
    if (!pointer) return
    const factor = e.evt.deltaY < 0 ? 1.12 : 1 / 1.12
    store.setView(zoomAt(store.getState().view, factor, pointer), { byUser: true })
  }

  // Ajuste de la vista: al cargar (con el tamaño REAL del contenedor, no el
  // provisional) y cuando el contenedor cambia de tamaño, salvo que el
  // usuario haya movido la vista manualmente (zoom/pan propios).
  const fitView = useCallback(() => {
    const { scenario } = store.getState().document
    const w = scenario.world.size.width
    const h = scenario.world.size.depth
    const zoom = Math.min((size.width - 80) / w, (size.height - 80) / h)
    const clamped = Math.min(600, Math.max(4, zoom))
    store.clearUserViewFlag()
    store.setView({
      pixelsPerUnit: clamped,
      pan: {
        x: (size.width - w * clamped) / 2,
        y: (size.height - h * clamped) / 2,
      },
    })
  }, [size.width, size.height, store])

  useEffect(() => {
    if (size.width < 50) return
    const changed =
      Math.abs(size.width - lastFitSizeRef.current.w) > 16 ||
      Math.abs(size.height - lastFitSizeRef.current.h) > 16
    if (!changed || store.hasUserView()) return
    lastFitSizeRef.current = { w: size.width, h: size.height }
    fitView()
  }, [size.width, size.height, fitView, store])

  // Red de seguridad: si el botón se suelta FUERA del lienzo (arrastre que
  // acaba sobre otro panel), el borrador/arrastre en curso se confirma igual.
  useEffect(() => {
    const onWindowMouseUp = () => {
      const s = store.getState()
      if (s.draft !== null || s.moveDrag !== null || s.marquee !== null) {
        panRef.current = null
        store.pointerUp()
      }
    }
    window.addEventListener('mouseup', onWindowMouseUp)
    return () => window.removeEventListener('mouseup', onWindowMouseUp)
  }, [store])

  // Expone el ajuste al resto de la UI (botón «Ajustar» de la barra superior).
  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const handler = () => fitView()
    element.addEventListener('lba:fit-view', handler)
    return () => element.removeEventListener('lba:fit-view', handler)
  }, [fitView])

  const view = state.view
  const isEmpty =
    state.document.scenario.objects.length === 0 && state.document.scenario.zones.length === 0

  return (
    <div
      className={`canvas-stage${spaceDown ? ' canvas-stage--pan' : ''}`}
      ref={containerRef}
      data-testid="editor-canvas"
      tabIndex={0}
      role="application"
      aria-label="Lienzo del editor 2D"
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onMouseLeave={() => {
          panRef.current = null
          store.setCursor(null)
        }}
        onWheel={handleWheel}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        <GridLayer
          view={view}
          grid={state.grid}
          worldSize={state.document.scenario.world.size}
          unit={state.document.scenario.world.lengthUnit}
        />
        <ZonesLayer model={model} view={view} store={store} />
        <StructureLayer model={model} view={view} store={store} />
        <ObjectsLayer
          model={model}
          view={view}
          store={store}
          transformerRef={transformerRef}
          nodeRefs={nodeRefs}
        />
        <OverlayLayer model={model} view={view} grid={state.grid} />
      </Stage>
      {isEmpty && (
        <div className="canvas-stage__empty" data-testid="canvas-empty-state">
          <p>
            Lienzo vacío: dibuja tu primera pared con la herramienta <strong>Pared (2)</strong>{' '}
            arrastrando de un punto a otro, o coloca una mesa desde el catálogo.
          </p>
          <p className="canvas-stage__empty-hint">
            Rueda del ratón para zoom · botón central o Espacio+arrastrar para mover la vista · «?»
            para ver todos los atajos.
          </p>
        </div>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ capas

function GridLayer({
  view,
  grid,
  worldSize,
  unit,
}: {
  view: { pixelsPerUnit: number; pan: { x: number; y: number } }
  grid: { visible: boolean; size: number; snapEnabled: boolean; angleSnapDeg: number }
  worldSize: { width: number; depth: number }
  unit: string
}) {
  if (!grid.visible) return null
  const lines: React.ReactNode[] = []
  const w = worldLengthToPx(worldSize.width, view)
  const h = worldLengthToPx(worldSize.depth, view)
  const step = worldLengthToPx(grid.size, view)
  if (step < 6) return null // celdas demasiado pequeñas: no dibujar
  const majorEvery = Math.max(1, Math.round(1 / grid.size))
  let index = 0
  for (let x = 0; x <= w + 0.5; x += step, index++) {
    const major = index % majorEvery === 0
    lines.push(
      <Line
        key={`v${index}`}
        points={[x, 0, x, h]}
        stroke={major ? '#c8cfd8' : '#e4e8ee'}
        strokeWidth={major ? 1 : 0.5}
        listening={false}
      />,
    )
  }
  index = 0
  for (let y = 0; y <= h + 0.5; y += step, index++) {
    const major = index % majorEvery === 0
    lines.push(
      <Line
        key={`h${index}`}
        points={[0, y, w, y]}
        stroke={major ? '#c8cfd8' : '#e4e8ee'}
        strokeWidth={major ? 1 : 0.5}
        listening={false}
      />,
    )
  }
  return (
    <Layer listening={false}>
      <Group x={view.pan.x} y={view.pan.y}>
        <Rect width={w} height={h} fill="#fdfdfc" stroke="#b7bfc9" strokeWidth={1.5} />
        {lines}
        <Text
          x={4}
          y={h - 18}
          text={`Local ${worldSize.width} × ${worldSize.depth} ${unit}`}
          fontSize={11}
          fill="#7a8592"
        />
      </Group>
    </Layer>
  )
}

function ZonesLayer({
  model,
  view,
  store,
}: {
  model: RenderModel
  view: { pixelsPerUnit: number; pan: { x: number; y: number } }
  store: EditorStore
}) {
  return (
    <Layer>
      {model.zones.map((zone) => {
        const min = worldToScreen(zone.min, view)
        const max = worldToScreen(zone.max, view)
        const width = max.x - min.x
        const height = max.y - min.y
        const color = ZONE_COLORS[zone.category] ?? '#3c86e8'
        return (
          <Group key={zone.id} data-zone-id={zone.id}>
            <Rect
              x={min.x}
              y={min.y}
              width={width}
              height={height}
              fill={`${color}22`}
              stroke={zone.selected ? color : `${color}88`}
              strokeWidth={zone.selected ? 2.5 : 1}
              dash={zone.selected ? undefined : [8, 5]}
              data-shape="zone"
              data-id={zone.id}
              onMouseDown={(e) => {
                if (store.getState().tool !== 'select') return
                e.cancelBubble = true
                store.selectZone(zone.id as never, e.evt.shiftKey)
                const world = screenToWorld({ x: e.evt.offsetX, y: e.evt.offsetY }, view)
                store.beginMoveDrag(world)
              }}
            />
            <Text
              x={min.x + 6}
              y={min.y + 6}
              text={zone.name}
              fontSize={12}
              fontStyle="bold"
              fill={color}
              listening={false}
            />
          </Group>
        )
      })}
    </Layer>
  )
}

function StructureLayer({
  model,
  view,
  store,
}: {
  model: RenderModel
  view: { pixelsPerUnit: number; pan: { x: number; y: number } }
  store: EditorStore
}) {
  return (
    <Layer>
      {model.wallSegments.map((seg, i) => {
        const center = worldToScreen(seg.center, view)
        return (
          <Rect
            key={`${seg.wallId}-${i}`}
            x={center.x}
            y={center.y}
            width={worldLengthToPx(seg.length, view)}
            height={Math.max(3, worldLengthToPx(seg.thickness, view))}
            offsetX={worldLengthToPx(seg.length, view) / 2}
            offsetY={Math.max(3, worldLengthToPx(seg.thickness, view)) / 2}
            rotation={seg.rotation}
            fill={seg.color}
            stroke="#6b7280"
            strokeWidth={0.5}
            data-shape="wall"
            data-id={seg.wallId}
            onMouseDown={(e) => {
              if (store.getState().tool !== 'select') return
              e.cancelBubble = true
              store.selectObject(seg.wallId as never, e.evt.shiftKey)
            }}
          />
        )
      })}

      {model.windows.map((win) => {
        const center = worldToScreen(win.position, view)
        const w = worldLengthToPx(win.width, view)
        const t = Math.max(4, worldLengthToPx(win.thickness, view))
        return (
          <Group
            key={win.id}
            x={center.x}
            y={center.y}
            rotation={win.rotation}
            data-shape="window"
            data-id={win.id}
            onMouseDown={(e) => {
              if (store.getState().tool !== 'select') return
              e.cancelBubble = true
              store.selectObject(win.id as never, e.evt.shiftKey)
            }}
          >
            <Rect x={-w / 2} y={-t / 2} width={w} height={t} fill="#fdfdfc" />
            <Line points={[-w / 2, -t / 2, w / 2, -t / 2]} stroke={win.color} strokeWidth={2} />
            <Line points={[-w / 2, t / 2, w / 2, t / 2]} stroke={win.color} strokeWidth={2} />
            <Line points={[-w / 2, 0, w / 2, 0]} stroke={`${win.color}88`} strokeWidth={1} />
          </Group>
        )
      })}

      {model.doors.map((door) => {
        const center = worldToScreen(door.position, view)
        const w = worldLengthToPx(door.width, view)
        const t = Math.max(4, worldLengthToPx(door.thickness, view))
        return (
          <Group
            key={door.id}
            x={center.x}
            y={center.y}
            rotation={door.rotation}
            data-shape="door"
            data-id={door.id}
            onMouseDown={(e) => {
              if (store.getState().tool !== 'select') return
              e.cancelBubble = true
              store.selectObject(door.id as never, e.evt.shiftKey)
            }}
          >
            {/* Hueco: «corta» el muro visualmente con el color del fondo. */}
            <Rect x={-w / 2} y={-t / 2} width={w} height={t} fill="#fdfdfc" />
            {door.doorType === 'swing' ? (
              <SwingDoor w={w} hinge={door.hinge} opening={door.opening} color={door.color} />
            ) : (
              <SlidingDoor w={w} t={t} slide={door.slide} color={door.color} />
            )}
          </Group>
        )
      })}
    </Layer>
  )
}

/** Puerta batiente: hoja desde la bisagra + arco de apertura. */
function SwingDoor({
  w,
  hinge,
  opening,
  color,
}: {
  w: number
  hinge: 'left' | 'right'
  opening: 'a' | 'b'
  color: string
}) {
  const hingeX = hinge === 'left' ? -w / 2 : w / 2
  const sign = hinge === 'left' ? 1 : -1
  const angle = opening === 'a' ? 0 : 180
  return (
    <>
      <Line points={[hingeX, 0, hingeX + sign * w, 0]} stroke={color} strokeWidth={3} />
      <Arc
        x={hingeX}
        y={0}
        innerRadius={0}
        outerRadius={w}
        angle={90}
        rotation={opening === 'a' ? (hinge === 'left' ? 0 : 90) : hinge === 'left' ? 270 : 180}
        fill={`${color}22`}
        stroke={`${color}66`}
        strokeWidth={1}
      />
      <Group rotation={angle} />
    </>
  )
}

/** Puerta corredera: dos hojas desplazadas según la dirección. */
function SlidingDoor({
  w,
  t,
  slide,
  color,
}: {
  w: number
  t: number
  slide: 'left' | 'right'
  color: string
}) {
  const offset = slide === 'right' ? 4 : -4
  return (
    <>
      <Rect x={-w / 2} y={-t / 2 + offset} width={w / 2 - 2} height={2.5} fill={color} />
      <Rect x={2} y={-t / 2 + offset} width={w / 2 - 2} height={2.5} fill={color} />
      <Line
        points={slide === 'right' ? [-w / 2, -t, -w / 2 + 8, -t] : [w / 2 - 8, -t, w / 2, -t]}
        stroke={color}
        strokeWidth={1.5}
      />
    </>
  )
}

function ObjectsLayer({
  model,
  view,
  store,
  transformerRef,
  nodeRefs,
}: {
  model: RenderModel
  view: { pixelsPerUnit: number; pan: { x: number; y: number } }
  store: EditorStore
  transformerRef: React.RefObject<Konva.Transformer | null>
  nodeRefs: React.RefObject<Map<string, Konva.Node>>
}) {
  return (
    <Layer>
      {model.objects.map((obj) => (
        <ObjectShape
          key={obj.id}
          obj={obj}
          view={view}
          store={store}
          registerNode={(node) => {
            if (node) nodeRefs.current.set(obj.id, node)
            else nodeRefs.current.delete(obj.id)
          }}
        />
      ))}
      <Transformer
        ref={transformerRef}
        rotateEnabled
        enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        keepRatio={false}
        anchorSize={8}
        borderStroke="#0f6f5c"
        anchorStroke="#0f6f5c"
        rotateAnchorOffset={24}
      />
    </Layer>
  )
}

function ObjectShape({
  obj,
  view,
  store,
  registerNode,
}: {
  obj: ObjectPrimitive
  view: { pixelsPerUnit: number; pan: { x: number; y: number } }
  store: EditorStore
  registerNode: (node: Konva.Group | null) => void
}) {
  const center = worldToScreen(obj.position, view)
  const w = worldLengthToPx(obj.width, view)
  const h = worldLengthToPx(obj.depth, view)

  const commitTransform = (node: Konva.Group) => {
    const world = screenToWorld({ x: node.x(), y: node.y() }, view)
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    store.commitObjectTransform(obj.id as never, {
      position: world,
      rotation: node.rotation(),
      width: obj.width * (scaleX || 1),
      depth: obj.depth * (scaleY || 1),
    })
  }

  return (
    <Group
      ref={registerNode}
      x={center.x}
      y={center.y}
      rotation={obj.rotation}
      data-shape="object"
      data-id={obj.id}
      onMouseDown={(e) => {
        if (store.getState().tool !== 'select') return
        e.cancelBubble = true
        store.selectObject(obj.id as never, e.evt.shiftKey)
        const world = screenToWorld({ x: e.evt.offsetX, y: e.evt.offsetY }, view)
        store.beginMoveDrag(world)
      }}
      onDragEnd={undefined}
      onTransformEnd={(e) => commitTransform(e.target as unknown as Konva.Group)}
    >
      <Rect
        width={w}
        height={h}
        offsetX={w / 2}
        offsetY={h / 2}
        fill={obj.color}
        opacity={0.92}
        stroke={obj.selected ? '#0f6f5c' : '#7b8794'}
        strokeWidth={obj.selected ? 2.5 : 1}
        dash={obj.overlapping ? [6, 4] : undefined}
        shadowColor={obj.overlapping ? OVERLAP_COLOR : undefined}
        shadowBlur={obj.overlapping ? 8 : 0}
        shadowOpacity={0.6}
      />
      {obj.name && w > 34 && h > 14 && (
        <Text
          text={obj.name}
          x={-w / 2}
          y={h / 2 + 3}
          width={w}
          fontSize={10}
          align="center"
          fill="#4b5563"
          listening={false}
        />
      )}
    </Group>
  )
}

function OverlayLayer({
  model,
  view,
  grid,
}: {
  model: RenderModel
  view: { pixelsPerUnit: number; pan: { x: number; y: number } }
  grid: { size: number }
}) {
  return (
    <Layer listening={false}>
      {model.wallDraft && <WallDraftPreview draft={model.wallDraft} view={view} />}
      {model.zoneDraft && (
        <Rect
          x={worldToScreen(model.zoneDraft.min, view).x}
          y={worldToScreen(model.zoneDraft.min, view).y}
          width={worldLengthToPx(model.zoneDraft.max.x - model.zoneDraft.min.x, view)}
          height={worldLengthToPx(model.zoneDraft.max.y - model.zoneDraft.min.y, view)}
          fill="#3c86e822"
          stroke="#3c86e8"
          dash={[7, 5]}
        />
      )}
      {model.marquee && (
        <Rect
          x={worldToScreen(model.marquee.min, view).x}
          y={worldToScreen(model.marquee.min, view).y}
          width={worldLengthToPx(model.marquee.max.x - model.marquee.min.x, view)}
          height={worldLengthToPx(model.marquee.max.y - model.marquee.min.y, view)}
          fill="#0f6f5c14"
          stroke="#0f6f5c"
          dash={[4, 4]}
        />
      )}
      {model.measure && <MeasurePreview model={model} view={view} grid={grid} />}
    </Layer>
  )
}

function WallDraftPreview({
  draft,
  view,
}: {
  draft: NonNullable<RenderModel['wallDraft']>
  view: { pixelsPerUnit: number; pan: { x: number; y: number } }
}) {
  const start = worldToScreen(draft.start, view)
  const end = worldToScreen(draft.end, view)
  const length = Math.hypot(end.x - start.x, end.y - start.y)
  const angle = (Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI
  const t = Math.max(3, worldLengthToPx(draft.thickness, view))
  return (
    <Group>
      <Rect
        x={start.x}
        y={start.y}
        width={length}
        height={t}
        offsetY={t / 2}
        rotation={angle}
        fill="#0f6f5c55"
        stroke="#0f6f5c"
        strokeWidth={1.5}
      />
      <Circle x={start.x} y={start.y} radius={4} fill="#0f6f5c" />
      <Circle x={end.x} y={end.y} radius={4} fill="#0f6f5c" />
    </Group>
  )
}

function MeasurePreview({
  model,
  view,
  grid,
}: {
  model: RenderModel
  view: { pixelsPerUnit: number; pan: { x: number; y: number } }
  grid: { size: number }
}) {
  if (!model.measure) return null
  const start = worldToScreen(model.measure.start, view)
  const end = worldToScreen(model.measure.end, view)
  const dist = Math.hypot(
    model.measure.end.x - model.measure.start.x,
    model.measure.end.y - model.measure.start.y,
  )
  return (
    <Group>
      <Line
        points={[start.x, start.y, end.x, end.y]}
        stroke="#b3261e"
        strokeWidth={1.5}
        dash={[5, 4]}
      />
      <Circle x={start.x} y={start.y} radius={4} fill="#b3261e" />
      <Circle x={end.x} y={end.y} radius={4} fill="#b3261e" />
      <Text
        x={(start.x + end.x) / 2 + 8}
        y={(start.y + end.y) / 2 - 8}
        text={`${Math.round(dist / grid.size) * grid.size} u`}
        fontSize={12}
        fontStyle="bold"
        fill="#b3261e"
      />
    </Group>
  )
}

// ------------------------------------------------------------------ utils

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  )
}

/** ID de la forma bajo el evento (data-id en nodos Konva), si lo hay. */
function shapeIdFromEvent(e: Konva.KonvaEventObject<MouseEvent>): string | null {
  const node = e.target as Konva.Node
  const id = node.getAttr('data-id') as unknown
  if (typeof id === 'string' && id.length > 0) return id
  const parent = node.getParent()
  const parentId = parent?.getAttr('data-id') as unknown
  if (typeof parentId === 'string' && parentId.length > 0) return parentId
  return null
}
