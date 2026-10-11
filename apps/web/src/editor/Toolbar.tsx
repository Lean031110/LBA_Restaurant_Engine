/**
 * Barra de herramientas izquierda (prompt 03.1): las 8 herramientas del
 * contrato con icono del catálogo, etiqueta, atajo y estado activo.
 */
import { ICONS, type IconId } from '@lba/asset-catalog'
import { TOOL_HINTS, TOOL_IDS, TOOL_LABELS } from '@lba/editor-2d'
import type { ToolId } from '@lba/editor-2d'

/** Atajos de teclado por herramienta (1..8, orden del contrato). */
export const TOOL_SHORTCUTS: Readonly<Record<ToolId, string>> = {
  select: '1',
  wall: '2',
  door: '3',
  window: '4',
  object: '5',
  zone: '6',
  measure: '7',
  delete: '8',
}

const TOOL_ICONS: Readonly<Record<ToolId, IconId>> = {
  select: 'station',
  wall: 'wall',
  door: 'door',
  window: 'window',
  object: 'table',
  zone: 'zone',
  measure: 'tray',
  delete: 'pos',
}

interface ToolbarProps {
  activeTool: ToolId
  onToolChange: (tool: ToolId) => void
}

/** Icono SVG en línea desde el registro original del catálogo. */
export function ToolIcon({ iconId }: { iconId: IconId }) {
  const spec = ICONS[iconId]
  return (
    <svg viewBox={spec.viewBox} width="20" height="20" aria-hidden="true" focusable="false">
      <path d={spec.path} fill="currentColor" />
    </svg>
  )
}

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div className="toolbar" role="toolbar" aria-label="Herramientas del editor">
      {TOOL_IDS.map((tool) => {
        const active = tool === activeTool
        return (
          <button
            key={tool}
            type="button"
            className={`toolbar__tool${active ? ' toolbar__tool--active' : ''}`}
            aria-pressed={active}
            title={`${TOOL_LABELS[tool]} (${TOOL_SHORTCUTS[tool]}) — ${TOOL_HINTS[tool]}`}
            data-tool={tool}
            onClick={() => onToolChange(tool)}
          >
            <ToolIcon iconId={TOOL_ICONS[tool]} />
            <span className="toolbar__tool-label">{TOOL_LABELS[tool]}</span>
            <kbd className="toolbar__shortcut">{TOOL_SHORTCUTS[tool]}</kbd>
          </button>
        )
      })}
    </div>
  )
}
