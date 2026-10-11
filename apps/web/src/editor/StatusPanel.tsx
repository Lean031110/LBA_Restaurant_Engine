/**
 * Panel de mensajes/estado discreto (prompt 03.1): pista de la herramienta
 * activa, coordenadas del cursor en unidades del mundo, medición en curso
 * y últimos mensajes (info/aviso/error) con cierre individual.
 */
import { TOOL_HINTS, TOOL_LABELS, formatLength } from '@lba/editor-2d'
import type { EditorStore } from '@lba/editor-2d'
import { useEditorValue } from './useEditorStore'

export function StatusPanel({ store }: { store: EditorStore }) {
  const tool = useEditorValue(store, (s) => s.tool)
  const cursor = useEditorValue(store, (s) => s.cursor)
  const unit = useEditorValue(store, (s) => s.document.scenario.world.lengthUnit)
  const messages = useEditorValue(store, (s) => s.messages)
  const measure = useEditorValue(store, (s) => s.measure)
  const overlapping = useEditorValue(store, (s) => s.overlappingObjectIds.length)

  const last = messages.at(-1)

  return (
    <div className="status" role="status" aria-live="polite" data-testid="status-panel">
      <span className="status__tool" data-testid="status-tool">
        {TOOL_LABELS[tool]}: {TOOL_HINTS[tool]}
      </span>
      <span className="status__cursor" data-testid="status-cursor">
        {cursor
          ? `Cursor: ${formatLength(cursor.x, unit)}, ${formatLength(cursor.y, unit)}`
          : 'Cursor fuera del lienzo'}
      </span>
      {measure && (
        <span className="status__measure" data-testid="status-measure">
          Medición en curso:{' '}
          {formatLength(
            Math.hypot(measure.current.x - measure.start.x, measure.current.y - measure.start.y),
            unit,
          )}
        </span>
      )}
      {overlapping > 0 && (
        <span className="status__overlap" data-testid="status-overlap">
          {overlapping} objeto(s) con solapamiento (aviso geométrico)
        </span>
      )}
      {last && (
        <button
          type="button"
          className={`status__message status__message--${last.level}`}
          data-testid={`status-message-${last.level}`}
          title="Clic para descartar el mensaje"
          onClick={() => store.dismissMessage(last.id)}
        >
          {last.text}
        </button>
      )}
    </div>
  )
}
