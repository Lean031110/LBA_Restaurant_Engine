/**
 * Puente React ↔ EditorStore (@lba/editor-2d) con useSyncExternalStore.
 *
 * La store es la única fuente de verdad; los componentes se suscriben a
 * sus instantáneas inmutables. Los accesos a miembros concretos usan
 * selectores para no re-renderizar de más.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { EditorStore } from '@lba/editor-2d'
import type { EditorState } from '@lba/editor-2d'

/** Instancia única de la store por pantalla de editor. */
export function createEditorStore(): EditorStore {
  return new EditorStore()
}

/** Suscripción al estado completo de la store. */
export function useEditorState(store: EditorStore): EditorState {
  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
  )
}

/** Suscripción con selector (comparación por identidad del resultado). */
export function useEditorValue<T>(store: EditorStore, selector: (state: EditorState) => T): T {
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  const getSnapshot = useCallback(() => selectorRef.current(store.getState()), [store])
  return useSyncExternalStore((listener) => store.subscribe(listener), getSnapshot, getSnapshot)
}

/**
 * Guarda un valor "en edición" local (input del inspector) y lo confirma
 * al perder el foco o pulsar Enter: así una edición de teclado es UNA sola
 * entrada del historial (undo/redo predecible).
 */
export function useCommittableValue<T>(
  value: T,
  onCommit: (next: T) => void,
  areEqual: (a: T, b: T) => boolean = Object.is,
): { draft: T; setDraft: (next: T) => void; commit: () => void; cancel: () => void } {
  const [draft, setDraft] = useState<T>(value)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const valueRef = useRef(value)
  const committed = useRef(value)

  // El draft sigue al valor externo salvo que esté en edición.
  useEffect(() => {
    if (!areEqual(committed.current, value)) {
      committed.current = value
      if (areEqual(draftRef.current, valueRef.current)) {
        setDraft(value)
      }
    }
    valueRef.current = value
  }, [value, areEqual])

  const commit = useCallback(() => {
    if (!areEqual(draftRef.current, valueRef.current)) {
      committed.current = draftRef.current
      onCommit(draftRef.current)
    }
  }, [onCommit, areEqual])

  const cancel = useCallback(() => {
    setDraft(valueRef.current)
    draftRef.current = valueRef.current
  }, [])

  const setDraftSafe = useCallback((next: T) => {
    draftRef.current = next
    setDraft(next)
  }, [])

  return { draft, setDraft: setDraftSafe, commit, cancel }
}
