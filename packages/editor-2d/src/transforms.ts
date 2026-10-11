import type { Position } from '@lba/domain'
import type { Viewport } from './types'
import { ZOOM_MAX, ZOOM_MIN } from './types'

/**
 * Transformaciones mundo ↔ pantalla (prompt 03.1; pruebas mínimas 03.4:
 * «unitarios de transformaciones y conversiones mundo-píxel»).
 *
 * La pantalla usa píxeles CSS con Y hacia abajo; el mundo usa unidades
 * reales (m/cm) con Y hacia abajo en planta (convención de plano). El zoom
 * (`pixelsPerUnit`) y el pan (px) son la ÚNICA representación de píxeles
 * del editor: todo el resto del estado vive en unidades del mundo.
 */

/** Convierte un punto del mundo a coordenadas de pantalla (px). */
export function worldToScreen(world: Position, view: Viewport): Position {
  return {
    x: world.x * view.pixelsPerUnit + view.pan.x,
    y: world.y * view.pixelsPerUnit + view.pan.y,
  }
}

/** Convierte un punto de pantalla (px) a unidades del mundo. */
export function screenToWorld(screen: Position, view: Viewport): Position {
  return {
    x: (screen.x - view.pan.x) / view.pixelsPerUnit,
    y: (screen.y - view.pan.y) / view.pixelsPerUnit,
  }
}

/** Convierte una longitud del mundo a píxeles (tamaños de forma). */
export function worldLengthToPx(length: number, view: Viewport): number {
  return length * view.pixelsPerUnit
}

/** Convierte píxeles a longitud del mundo. */
export function pxToWorldLength(px: number, view: Viewport): number {
  return px / view.pixelsPerUnit
}

/** Acota el zoom a los límites válidos. */
export function clampZoom(pixelsPerUnit: number): number {
  if (!Number.isFinite(pixelsPerUnit)) return ZOOM_MIN
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pixelsPerUnit))
}

/**
 * Zoom centrado en un punto de pantalla: el punto del mundo que hay bajo
 * `anchor` antes del zoom sigue bajo el mismo ancla después. Devuelve la
 * nueva vista (sin mutar la actual).
 */
export function zoomAt(view: Viewport, factor: number, anchor: Position): Viewport {
  const nextZoom = clampZoom(view.pixelsPerUnit * factor)
  if (nextZoom === view.pixelsPerUnit) return view
  const world = screenToWorld(anchor, view)
  return {
    pixelsPerUnit: nextZoom,
    pan: {
      x: anchor.x - world.x * nextZoom,
      y: anchor.y - world.y * nextZoom,
    },
  }
}

/** Vista inicial: 60 px por unidad con el origen del mundo en 40,40 px. */
export function initialViewport(): Viewport {
  return { pixelsPerUnit: 60, pan: { x: 40, y: 40 } }
}

/**
 * Vista que encaja un rectángulo del mundo (p. ej. el tamaño del local) en
 * un área de pantalla con margen. Si el rectángulo es degenerado devuelve
 * la vista inicial. `marginPx` debe ser > 0.
 */
export function fitRect(
  rect: { width: number; depth: number },
  screen: { width: number; height: number },
  marginPx = 40,
): Viewport {
  if (
    rect.width <= 0 ||
    rect.depth <= 0 ||
    screen.width <= marginPx * 2 ||
    screen.height <= marginPx * 2
  ) {
    return initialViewport()
  }
  const usableW = screen.width - marginPx * 2
  const usableH = screen.height - marginPx * 2
  const zoom = clampZoom(Math.min(usableW / rect.width, usableH / rect.depth))
  return {
    pixelsPerUnit: zoom,
    pan: {
      x: (screen.width - rect.width * zoom) / 2,
      y: (screen.height - rect.depth * zoom) / 2,
    },
  }
}
