/**
 * Mock de react-konva para las pruebas de componentes en jsdom.
 *
 * Konva necesita un contexto 2D de canvas real que jsdom no proporciona;
 * los tests unitarios de componentes verifican NUESTRA lógica (handlers,
 * props, estados) con estas siluetas DOM (data-konva) y la interacción
 * real del lienzo la cubren las pruebas E2E de Playwright en un navegador
 * de verdad (tests/e2e). Declarado como alias de test en vite.config.ts.
 */
import type { ReactNode } from 'react'

interface KonvaProps {
  children?: ReactNode
  [key: string]: unknown
}

function konvaStub(tag: string) {
  return function Stub({ children, ...rest }: KonvaProps) {
    const attrs: Record<string, string> = { 'data-konva': tag }
    for (const key of ['id', 'name', 'x', 'y', 'width', 'height', 'rotation', 'fill', 'stroke']) {
      if (rest[key] !== undefined) attrs[`data-${key}`] = String(rest[key])
    }
    // Los atributos data-* del modelo de render pasan tal cual (data-id,
    // data-shape…): son el contrato de inspección de las pruebas.
    for (const [key, value] of Object.entries(rest)) {
      if (key.startsWith('data-') && value !== undefined) attrs[key] = String(value)
    }
    if (rest.listening !== undefined) attrs['data-listening'] = String(rest.listening)
    return <div {...attrs}>{children}</div>
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
