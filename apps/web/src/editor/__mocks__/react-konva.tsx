/**
 * Mock de react-konva para las pruebas de componentes en jsdom.
 *
 * Konva necesita un contexto 2D de canvas real que jsdom no proporciona;
 * los tests unitarios de componentes verifican NUESTRA lógica (handlers,
 * props, estados) con estas siluetas DOM (data-konva) y la interacción
 * real del lienzo la cubren las pruebas E2E de Playwright en un navegador
 * de verdad (tests/e2e). Declarado como alias de test en vite.config.ts.
 *
 * Fidelidad del mock: los atributos data-* pasan al DOM (contrato de
 * inspección), el prop `text` se renderiza como contenido (etiquetas) y
 * los handlers onXxx se invocan con un envoltorio mínimo {evt, target,
 * cancelBubble} para poder probar el cableado de eventos de forma.
 */
import type { ReactNode } from 'react'

interface KonvaProps {
  children?: ReactNode
  [key: string]: unknown
}

/** Nodo Konva mínimo para los handlers (getAttr lee los data-* del DOM). */
function makeNode(element: HTMLElement) {
  return {
    getAttr(name: string): unknown {
      const value = element.getAttribute(`data-${name}`) ?? element.getAttribute(name)
      return value
    },
    getParent(): unknown {
      return null
    },
  }
}

function konvaStub(tag: string) {
  return function Stub({ children, ...rest }: KonvaProps) {
    const attrs: Record<string, string> = { 'data-konva': tag }
    const handlers: Record<string, unknown> = {}
    let textContent: string | null = null

    for (const [key, value] of Object.entries(rest)) {
      if (value === undefined) continue
      if (key.startsWith('data-')) {
        attrs[key] = String(value)
      } else if (key === 'text' && typeof value === 'string') {
        textContent = value
      } else if (key.startsWith('on') && typeof value === 'function') {
        handlers[key] = (event: MouseEvent | WheelEvent) => {
          const wrapper = {
            evt: event,
            target: makeNode(event.target as HTMLElement),
            cancelBubble: false,
          }
          ;(value as (e: unknown) => void)(wrapper)
          if (wrapper.cancelBubble) event.stopPropagation()
        }
      } else if (
        [
          'id',
          'name',
          'x',
          'y',
          'width',
          'height',
          'rotation',
          'fill',
          'stroke',
          'listening',
        ].includes(key)
      ) {
        attrs[`data-${key}`] = String(value)
      }
    }

    // Ref: se adjunta al div y se dota de getPointerPosition() determinista
    // para que los handlers de la store funcionen bajo jsdom.
    const ref = rest.ref as React.Ref<HTMLDivElement> | undefined
    const setRef = (node: HTMLDivElement | null) => {
      if (node) {
        ;(
          node as unknown as { getPointerPosition: () => { x: number; y: number } }
        ).getPointerPosition = () => ({ x: 200, y: 150 })
      }
      if (typeof ref === 'function') ref(node)
      else if (ref && typeof ref === 'object')
        (ref as { current: HTMLDivElement | null }).current = node
    }

    return (
      <div ref={setRef} {...attrs} {...handlers}>
        {textContent ?? children}
      </div>
    )
  }
}

export const Stage = konvaStub('Stage')
export const Layer = konvaStub('Layer')
export const Group = konvaStub('Group')
export const Rect = konvaStub('Rect')
export const Line = konvaStub('Line')
export const Circle = konvaStub('Circle')
export const Arc = konvaStub('Arc')
export const Text = konvaStub('Text')
export const Label = konvaStub('Label')
export const Transformer = konvaStub('Transformer')
