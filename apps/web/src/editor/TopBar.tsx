/**
 * Barra superior del editor (prompt 03.1 «toolbar superior»): nombre del
 * escenario, undo/redo, guardar/cargar JSON, zoom/pan, cuadrícula y snap.
 * Todos los botones están conectados a la store real (regla 16).
 */
import { useRef } from 'react'
import type { EditorStore } from '@lba/editor-2d'
import { GRID_SIZE_OPTIONS, formatLength } from '@lba/editor-2d'
import type { GridConfig } from '@lba/editor-2d'
import { loadScenarioFile, saveScenarioFile } from './fileIO'
import { useEditorValue } from './useEditorStore'

interface TopBarProps {
  store: EditorStore
  /** Ajusta la vista al tamaño del local (lo calcula el lienzo con su tamaño). */
  onFitView: () => void
}

export function TopBar({ store, onFitView }: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scenarioName = useEditorValue(store, (s) => s.document.scenario.name)
  const unit = useEditorValue(store, (s) => s.document.scenario.world.lengthUnit)
  // Selectores de primitivas: los objetos nuevos en cada llamada romperían
  // la caché de getSnapshot de useSyncExternalStore (bucle infinito).
  const objectCount = useEditorValue(store, (s) => s.document.scenario.objects.length)
  const zoneCount = useEditorValue(store, (s) => s.document.scenario.zones.length)
  const canUndo = useEditorValue(store, (s) => s.canUndo)
  const undoLabel = useEditorValue(store, (s) => s.undoLabel)
  const canRedo = useEditorValue(store, (s) => s.canRedo)
  const redoLabel = useEditorValue(store, (s) => s.redoLabel)
  const zoom = useEditorValue(store, (s) => Math.round(s.view.pixelsPerUnit))
  const grid = useEditorValue(store, (s) => s.grid)

  // Guardar/cargar usan las operaciones compartidas de fichero (fileIO.ts),
  // las mismas que los atajos Ctrl+S / Ctrl+O (una sola implementación).
  const handleLoadFile = (file: File) => void loadScenarioFile(store, file)

  const setGrid = (patch: Partial<GridConfig>) => store.setGrid(patch)

  return (
    <div className="topbar" role="toolbar" aria-label="Barra superior del editor">
      <span
        className="topbar__title"
        data-testid="scenario-name"
        title="Nombre del escenario (editable en el inspector)"
      >
        {scenarioName}
      </span>
      <span className="topbar__counts" data-testid="scenario-counts">
        {objectCount} objeto{objectCount === 1 ? '' : 's'} · {zoneCount} zona
        {zoneCount === 1 ? '' : 's'}
      </span>

      <div className="topbar__group" role="group" aria-label="Historial">
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => store.undo()}
          title={undoLabel ? `Deshacer: ${undoLabel} (Ctrl+Z)` : 'Nada que deshacer'}
          data-testid="undo-button"
        >
          ↶ Deshacer
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => store.redo()}
          title={redoLabel ? `Rehacer: ${redoLabel} (Ctrl+Shift+Z)` : 'Nada que rehacer'}
          data-testid="redo-button"
        >
          ↷ Rehacer
        </button>
      </div>

      <div className="topbar__group" role="group" aria-label="Archivo">
        <button
          type="button"
          onClick={() => saveScenarioFile(store)}
          title="Guardar escenario como JSON (Ctrl+S)"
          data-testid="save-button"
        >
          💾 Guardar
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Cargar escenario desde JSON (Ctrl+O)"
          data-testid="load-button"
        >
          📂 Cargar
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="topbar__file-input"
          aria-label="Fichero de escenario JSON"
          data-testid="load-input"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleLoadFile(file)
            e.target.value = ''
          }}
        />
      </div>

      <div className="topbar__group" role="group" aria-label="Zoom">
        <button
          type="button"
          onClick={() =>
            store.setView({ ...store.getState().view, pixelsPerUnit: Math.max(4, zoom / 1.25) })
          }
          title="Reducir zoom (tecla −)"
        >
          −
        </button>
        <span className="topbar__zoom" data-testid="zoom-label">
          {zoom} px/{unit}
        </span>
        <button
          type="button"
          onClick={() =>
            store.setView({ ...store.getState().view, pixelsPerUnit: Math.min(600, zoom * 1.25) })
          }
          title="Aumentar zoom (tecla +)"
        >
          +
        </button>
        <button type="button" onClick={onFitView} title="Ajustar el plano a la ventana (tecla 0)">
          Ajustar
        </button>
      </div>

      <div className="topbar__group" role="group" aria-label="Cuadrícula">
        <button
          type="button"
          className={grid.visible ? 'topbar__toggle--on' : ''}
          aria-pressed={grid.visible}
          onClick={() => setGrid({ visible: !grid.visible })}
          title="Mostrar u ocultar la cuadrícula (tecla G)"
          data-testid="grid-toggle"
        >
          # Cuadrícula
        </button>
        <label className="topbar__select-label">
          Celda
          <select
            value={grid.size}
            onChange={(e) => setGrid({ size: Number(e.target.value) })}
            aria-label="Tamaño de celda"
            data-testid="grid-size"
          >
            {GRID_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {formatLength(size, unit)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={grid.snapEnabled ? 'topbar__toggle--on' : ''}
          aria-pressed={grid.snapEnabled}
          onClick={() => setGrid({ snapEnabled: !grid.snapEnabled })}
          title="Activar o desactivar el ajuste a la cuadrícula (tecla X)"
          data-testid="snap-toggle"
        >
          🧲 Snap
        </button>
      </div>
    </div>
  )
}
