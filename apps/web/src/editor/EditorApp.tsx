/**
 * Pantalla del editor 2D (FASE 03): barra superior, herramientas y catálogo
 * a la izquierda, lienzo central, inspector contextual a la derecha y panel
 * de estado discreto (regla 15 del prompt maestro).
 *
 - Teclado completo (03.3): 1–8 herramientas, flechas mueven, R rota,
   Supr borra (con confirmación si es masivo), Ctrl+Z/Y deshace/rehace,
   Ctrl+S/O guarda/carga, Tab cicla la selección, ? abre la ayuda.
 - Autosave local (03.3): cada cambio se guarda con retardo en
   localStorage (puerto inyectable); al arrancar se ofrece restaurarlo.
 - Confirmación de borrado masivo en la propia UI (nada de window.confirm).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorStore } from '@lba/editor-2d'
import type { Scenario } from '@lba/domain'
import { discardAutosave, readAutosave, writeAutosave } from '@lba/editor-2d'
import type { AutosaveStorage } from '@lba/editor-2d'
import { CanvasStage } from './CanvasStage'
import { CatalogPanel } from './CatalogPanel'
import { Inspector } from './Inspector'
import { StatusPanel } from './StatusPanel'
import { Toolbar } from './Toolbar'
import { TOOL_SHORTCUTS } from './Toolbar'
import { TopBar } from './TopBar'
import { saveScenarioFile } from './fileIO'
import { useEditorState } from './useEditorStore'
import type { ToolId } from '@lba/editor-2d'

/** Puerto de almacenamiento local para el autosave (localStorage real). */
const localStorageAutosave: AutosaveStorage = {
  getItem(key) {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      /* cuota agotada o modo privado: el autosave se desactiva en silencio */
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* sin almacenamiento: nada que eliminar */
    }
  },
}

const AUTOSAVE_DEBOUNCE_MS = 800

interface EditorAppProps {
  store: EditorStore
}

export function EditorApp({ store }: EditorAppProps) {
  const state = useEditorState(store)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [autosaveOffer, setAutosaveOffer] = useState<Scenario | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)

  const selectionCount =
    state.document.selection.objectIds.length + state.document.selection.zoneIds.length

  // --- Hook de depuración/pruebas (solo lectura; documentado en PHASE-03).
  useEffect(() => {
    const w = window as unknown as { __lbaEditor?: { getState: () => unknown } }
    w.__lbaEditor = { getState: () => store.getState() }
    return () => {
      delete w.__lbaEditor
    }
  }, [store])

  // --- Autosave: escritura con retardo tras cada cambio del escenario
  // (el documento incluye la selección; el autosave solo serializa el
  // escenario para no ensuciar el historial de escrituras).
  const scenario = state.document.scenario
  useEffect(() => {
    const timer = window.setTimeout(() => {
      writeAutosave(localStorageAutosave, scenario, JSON.stringify(scenario))
    }, AUTOSAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [scenario])

  // --- Oferta de restauración del autosave inicial (una sola vez).
  useEffect(() => {
    const initial = store.getState().document.scenario
    const saved = readAutosave(localStorageAutosave, initial.id)
    if (saved && saved.objects.length + saved.zones.length > 0) {
      setAutosaveOffer(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const restoreAutosave = useCallback(() => {
    if (!autosaveOffer) return
    store.loadScenario(autosaveOffer, 'Autosave restaurado')
    setAutosaveOffer(null)
  }, [autosaveOffer, store])

  const discardAutosaveOffer = useCallback(() => {
    discardAutosave(localStorageAutosave, store.getState().document.scenario.id)
    setAutosaveOffer(null)
  }, [store])

  // --- Borrado con confirmación cuando la selección es múltiple.
  const requestDelete = useCallback(() => {
    if (selectionCount === 0) return
    if (selectionCount === 1) {
      store.deleteSelection()
      return
    }
    setPendingDelete(true)
  }, [selectionCount, store])

  // --- Atajos de teclado globales (03.3: accesibilidad).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return
      const toolByShortcut = Object.entries(TOOL_SHORTCUTS).find(([, key]) => key === e.key)
      const mod = e.ctrlKey || e.metaKey

      if (e.key === 'Escape') {
        if (helpOpen) setHelpOpen(false)
        else if (pendingDelete) setPendingDelete(false)
        else if (state.draft || state.measure) store.selectTool(state.tool)
        else store.clearSelection()
        return
      }
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) store.redo()
        else store.undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        store.redo()
        return
      }
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        store.duplicateSelection()
        return
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveScenarioFile(store)
        return
      }
      if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        triggerLoad()
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        store.cycleSelection(e.shiftKey ? -1 : 1)
        return
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setHelpOpen((v) => !v)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        requestDelete()
        return
      }
      if (e.key.toLowerCase() === 'r') {
        store.rotateSelection(90)
        return
      }
      if (e.key.toLowerCase() === 'g') {
        store.setGrid({ visible: !store.getState().grid.visible })
        return
      }
      if (e.key.toLowerCase() === 'x') {
        store.setGrid({ snapEnabled: !store.getState().grid.snapEnabled })
        return
      }
      if (e.key === '+' || e.key === '=') {
        store.zoomBy(1.25)
        return
      }
      if (e.key === '-') {
        store.zoomBy(1 / 1.25)
        return
      }
      if (e.key === '0') {
        canvasRef.current?.dispatchEvent(new CustomEvent('lba:fit-view', { bubbles: true }))
        return
      }
      const arrow = arrowDelta(e.key)
      if (arrow) {
        e.preventDefault()
        store.moveSelection(arrow, e.shiftKey ? 5 : 1)
        return
      }
      if (toolByShortcut && !mod) {
        store.selectTool(toolByShortcut[0] as ToolId)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [store, helpOpen, pendingDelete, requestDelete, state.draft, state.measure, state.tool])

  const triggerLoad = () => {
    const input = document.querySelector<HTMLInputElement>('input[data-testid="load-input"]')
    input?.click()
  }

  const fitView = useCallback(() => {
    canvasRef.current?.dispatchEvent(new CustomEvent('lba:fit-view', { bubbles: true }))
  }, [])

  const tool = state.tool

  return (
    <div className="editor" data-testid="editor-app">
      <TopBar store={store} onFitView={fitView} />
      <div className="editor__main">
        <aside className="editor__left" aria-label="Herramientas y catálogo">
          <Toolbar activeTool={tool} onToolChange={(t) => store.selectTool(t)} />
          <CatalogPanel
            activePresetId={state.activePresetId}
            onPresetPick={(id) => store.pickPreset(id)}
          />
        </aside>

        <main className="editor__canvas-wrap" ref={canvasRef}>
          <CanvasStage store={store} />
          {pendingDelete && (
            <div
              className="editor__confirm"
              role="alertdialog"
              aria-label="Confirmar borrado"
              data-testid="delete-confirm"
            >
              <span>
                ¿Borrar {selectionCount} elemento{selectionCount === 1 ? '' : 's'}? La acción se
                puede deshacer con Ctrl+Z.
              </span>
              <button
                type="button"
                className="editor__confirm-yes"
                data-testid="delete-confirm-yes"
                onClick={() => {
                  store.deleteSelection()
                  setPendingDelete(false)
                }}
              >
                Borrar
              </button>
              <button
                type="button"
                data-testid="delete-confirm-no"
                onClick={() => setPendingDelete(false)}
              >
                Cancelar
              </button>
            </div>
          )}
          {autosaveOffer && (
            <div
              className="editor__confirm editor__confirm--info"
              role="dialog"
              aria-label="Restaurar autosave"
              data-testid="autosave-banner"
            >
              <span>
                Hay un autosave del escenario «{autosaveOffer.name}» ({autosaveOffer.objects.length}{' '}
                objetos). ¿Restaurarlo?
              </span>
              <button type="button" data-testid="autosave-restore" onClick={restoreAutosave}>
                Restaurar
              </button>
              <button type="button" data-testid="autosave-discard" onClick={discardAutosaveOffer}>
                Descartar
              </button>
            </div>
          )}
        </main>

        <aside className="editor__inspector" aria-label="Inspector de propiedades">
          <Inspector store={store} />
        </aside>
      </div>
      <StatusPanel store={store} />
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  )
}

/** Diálogo de atajos (03.3: instrucciones de uso accesibles). */
function HelpModal({ onClose }: { onClose: () => void }) {
  const rows: Array<[string, string]> = [
    [
      '1 – 8',
      'Cambiar de herramienta (Seleccionar, Pared, Puerta, Ventana, Objeto, Zona, Medir, Borrar)',
    ],
    ['Arrastrar', 'Dibujar pared o zona · mover la selección · banda de selección en vacío'],
    ['Rueda', 'Zoom hacia el cursor · botón central o Espacio+arrastrar: mover la vista'],
    ['Flechas', 'Mover la selección un paso de rejilla (Shift: ×5)'],
    ['R', 'Rotar la selección 90°'],
    ['Supr', 'Borrar la selección (con confirmación si es múltiple)'],
    ['Ctrl+D', 'Duplicar la selección'],
    ['Ctrl+Z / Ctrl+Shift+Z', 'Deshacer / rehacer'],
    ['Ctrl+S / Ctrl+O', 'Guardar / cargar escenario JSON'],
    ['Tab / Shift+Tab', 'Ciclar la selección entre elementos'],
    ['G / X', 'Mostrar cuadrícula / activar snap'],
    ['+ / − / 0', 'Zoom in / out / ajustar a la ventana'],
    ['Escape', 'Cancelar borrador, cerrar diálogos o deseleccionar'],
  ]
  return (
    <div
      className="help"
      role="dialog"
      aria-modal="true"
      aria-label="Atajos de teclado"
      data-testid="help-modal"
    >
      <div className="help__panel">
        <h2>Atajos del editor</h2>
        <table className="help__table">
          <tbody>
            {rows.map(([keys, description]) => (
              <tr key={keys}>
                <th scope="row">
                  <kbd>{keys}</kbd>
                </th>
                <td>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="help__note">
          El editor representa geometría: las advertencias de solapamiento son avisos informativos,
          no comprobaciones arquitectónicas. Todas las medidas están en unidades reales del mundo (m
          o cm), nunca en píxeles.
        </p>
        <button type="button" data-testid="help-close" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  )
}

function arrowDelta(key: string): { x: number; y: number } | null {
  switch (key) {
    case 'ArrowUp':
      return { x: 0, y: -1 }
    case 'ArrowDown':
      return { x: 0, y: 1 }
    case 'ArrowLeft':
      return { x: -1, y: 0 }
    case 'ArrowRight':
      return { x: 1, y: 0 }
    default:
      return null
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  )
}
