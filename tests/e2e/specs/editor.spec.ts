import { expect, test, type Page } from '@playwright/test'

/**
 * E2E del editor 2D (prompt 03.4): crea una pared por arrastre, coloca una
 * puerta sobre el muro, mueve una mesa, cambia una propiedad, guarda y
 * recarga el escenario, y revisa la consola del navegador.
 *
 * Las coordenadas se calculan desde la VISTA REAL del editor (expuesta por
 * el hook de depuración window.__lbaEditor, solo lectura) para no depender
 * del tamaño de la ventana: pantalla = mundo × zoom + pan.
 */

interface EditorSnapshotView {
  pixelsPerUnit: number
  pan: { x: number; y: number }
}

interface ScenarioSnapshot {
  id: string
  name: string
  objects: Array<{
    id: string
    kind: string
    position: { x: number; y: number }
    rotation: number
    dimensions: { width: number; depth: number }
    doorType?: string
  }>
  zones: Array<{ id: string; name: string }>
}

async function view(page: Page): Promise<EditorSnapshotView> {
  return page.evaluate(() => {
    const state = (
      window as unknown as { __lbaEditor: { getState: () => unknown } }
    ).__lbaEditor.getState() as {
      view: EditorSnapshotView
    }
    return state.view
  })
}

async function scenario(page: Page): Promise<ScenarioSnapshot> {
  return page.evaluate(() => {
    const state = (
      window as unknown as { __lbaEditor: { getState: () => unknown } }
    ).__lbaEditor.getState() as {
      document: { scenario: ScenarioSnapshot }
    }
    return JSON.parse(JSON.stringify(state.document.scenario)) as ScenarioSnapshot
  })
}

/** Coordenadas de pantalla dentro del lienzo para un punto del mundo. */
function screenFor(
  world: { x: number; y: number },
  v: EditorSnapshotView,
  canvasBox: { x: number; y: number },
) {
  return {
    x: canvasBox.x + world.x * v.pixelsPerUnit + v.pan.x,
    y: canvasBox.y + world.y * v.pixelsPerUnit + v.pan.y,
  }
}

test.describe('Editor 2D — flujo completo del prompt 03.4', () => {
  let consoleErrors: string[] = []

  test.beforeEach(async ({ page }) => {
    consoleErrors = []
    page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console.error: ${msg.text()}`)
    })
    await page.goto('/')
  })

  test('arranca con estado vacío explicado y controles reales', async ({ page }) => {
    await expect(page).toHaveTitle('LBA_Restaurant_Engine')
    await expect(page.getByTestId('canvas-empty-state')).toBeVisible()
    await expect(page.getByTestId('scenario-counts')).toContainText('0 objetos')
    // Las 8 herramientas y el catálogo están presentes y conectados.
    await expect(page.getByRole('toolbar', { name: 'Herramientas del editor' })).toBeVisible()
    await expect(page.getByTestId('undo-button')).toBeDisabled()
    await expect(page.getByTestId('catalog-search')).toBeVisible()
  })

  test('crea una pared arrastrando de inicio a fin', async ({ page }) => {
    const canvas = page.getByTestId('editor-canvas')
    await canvas.click({ position: { x: 10, y: 10 } }) // enfoca el lienzo
    const box = await canvas.boundingBox()
    const v = await view(page)
    expect(box).not.toBeNull()

    await page.keyboard.press('2') // herramienta Pared
    const from = screenFor({ x: 1, y: 1 }, v, box!)
    const to = screenFor({ x: 4, y: 1 }, v, box!)
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 8 })
    await page.mouse.up()

    const s = await scenario(page)
    expect(s.objects).toHaveLength(1)
    expect(s.objects[0]!.kind).toBe('wall')
    expect(s.objects[0]!.dimensions.width).toBeCloseTo(3, 6)
    expect(s.objects[0]!.rotation).toBe(0)
    expect(s.objects[0]!.position.x).toBeCloseTo(2.5, 6)

    await expect(page.getByTestId('scenario-counts')).toContainText('1 objeto')
    await expect(page.getByTestId('undo-button')).toBeEnabled()
    expect(consoleErrors).toEqual([])
  })

  test('coloca una puerta sobre el muro (hereda rotación y queda en el tramo)', async ({
    page,
  }) => {
    const canvas = page.getByTestId('editor-canvas')
    await canvas.click({ position: { x: 10, y: 10 } })
    const box = (await canvas.boundingBox())!
    const v = await view(page)

    // Pared (1,1) → (5,1).
    await page.keyboard.press('2')
    const from = screenFor({ x: 1, y: 1 }, v, box)
    const to = screenFor({ x: 5, y: 1 }, v, box)
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 8 })
    await page.mouse.up()

    // Puerta: clic cerca del muro (a 0.1 m sobre la línea).
    await page.keyboard.press('3')
    const at = screenFor({ x: 2.5, y: 1.1 }, v, box)
    await page.mouse.click(at.x, at.y)

    const s = await scenario(page)
    expect(s.objects).toHaveLength(2)
    const door = s.objects[1]!
    expect(door.kind).toBe('door')
    expect(door.doorType).toBe('swing')
    expect(door.rotation).toBe(0) // hereda la rotación del muro
    expect(door.position.y).toBeCloseTo(1, 6)
    expect(door.position.x).toBeGreaterThan(1)
    expect(door.position.x).toBeLessThan(5)
    expect(consoleErrors).toEqual([])
  })

  test('mueve una mesa por arrastre y cambia su propiedad desde el inspector', async ({ page }) => {
    const canvas = page.getByTestId('editor-canvas')
    await canvas.click({ position: { x: 10, y: 10 } })
    const box = (await canvas.boundingBox())!
    const v = await view(page)

    // Mesa del catálogo colocada en (2, 3).
    await page
      .getByRole('button', { name: /Mesa redonda 4 plazas/ })
      .first()
      .click()
    const at = screenFor({ x: 2, y: 3 }, v, box)
    await page.mouse.click(at.x, at.y)
    let s = await scenario(page)
    expect(s.objects).toHaveLength(1)
    const table = s.objects[0]!
    expect(table.position).toEqual({ x: 2, y: 3 })

    // Herramienta Seleccionar y arrastre de la mesa a (3.5, 3).
    await page.keyboard.press('1')
    const v2 = await view(page)
    const from = screenFor({ x: 2, y: 3 }, v2, box)
    const to = screenFor({ x: 3.5, y: 3 }, v2, box)
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 6 })
    await page.mouse.up()
    s = await scenario(page)
    expect(s.objects[0]!.position.x).toBeCloseTo(3.5, 6)
    expect(s.objects[0]!.position.y).toBeCloseTo(3, 6)

    // Inspector: cambia la rotación a 90°.
    const rotation = page.getByTestId('field-object-rotation')
    await expect(rotation).toBeVisible()
    await rotation.fill('90')
    await rotation.press('Enter')
    s = await scenario(page)
    expect(s.objects[0]!.rotation).toBe(90)

    // El título del inspector muestra el nombre del preset.
    await expect(page.getByTestId('inspector-object')).toContainText('Mesa redonda 4 plazas')

    // Deshacer revierte la rotación; rehacer la restaura.
    await page.getByTestId('undo-button').click()
    s = await scenario(page)
    expect(s.objects[0]!.rotation).toBe(0)
    await page.getByTestId('redo-button').click()
    s = await scenario(page)
    expect(s.objects[0]!.rotation).toBe(90)
    expect(consoleErrors).toEqual([])
  })

  test('guardar y recargar produce exactamente el mismo escenario', async ({ page }) => {
    const canvas = page.getByTestId('editor-canvas')
    await canvas.click({ position: { x: 10, y: 10 } })
    const box = (await canvas.boundingBox())!
    const v = await view(page)

    // Contenido: pared + puerta + mesa + zona.
    await page.keyboard.press('2')
    const from = screenFor({ x: 1, y: 1 }, v, box)
    const to = screenFor({ x: 5, y: 1 }, v, box)
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 8 })
    await page.mouse.up()
    await page.keyboard.press('3')
    const at = screenFor({ x: 2.5, y: 1.1 }, v, box)
    await page.mouse.click(at.x, at.y)
    await page
      .getByRole('button', { name: /Mesa redonda 4 plazas/ })
      .first()
      .click()
    const tableAt = screenFor({ x: 2, y: 3 }, v, box)
    await page.mouse.click(tableAt.x, tableAt.y)
    await page.keyboard.press('6') // herramienta Zona
    const zFrom = screenFor({ x: 5, y: 2 }, v, box)
    const zTo = screenFor({ x: 9, y: 6 }, v, box)
    await page.mouse.move(zFrom.x, zFrom.y)
    await page.mouse.down()
    await page.mouse.move(zTo.x, zTo.y, { steps: 6 })
    await page.mouse.up()

    const before = await scenario(page)
    expect(before.objects).toHaveLength(3)
    expect(before.zones).toHaveLength(1)

    // Captura ANTES de guardar/recargar (evidencia de CI).
    await page.screenshot({ path: 'test-results/escenario-antes.png', fullPage: false })

    // Guardar: descarga un JSON determinista.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('save-button').click(),
    ])
    const path = await download.path()
    expect(path).not.toBeNull()
    const fs = await import('node:fs')
    const savedJson = fs.readFileSync(path!, 'utf-8')
    const saved = JSON.parse(savedJson) as ScenarioSnapshot
    expect(deepEqualIgnoringKeyOrder(saved, before)).toBe(true)

    // Recargar el fichero descargado: el escenario resultante es idéntico.
    await page.getByTestId('load-input').setInputFiles(path!)
    await expect(page.getByTestId('scenario-name')).toContainText(before.name)
    const after = await scenario(page)
    expect(deepEqualIgnoringKeyOrder(after, before)).toBe(true)

    // Captura DESPUÉS de recargar (evidencia de CI).
    await page.screenshot({ path: 'test-results/escenario-despues.png', fullPage: false })
    expect(consoleErrors).toEqual([])
  })

  test('zoom con rueda y mover con teclado; los errores no destruyen el escenario', async ({
    page,
  }) => {
    const canvas = page.getByTestId('editor-canvas')
    await canvas.click({ position: { x: 10, y: 10 } })
    const box = (await canvas.boundingBox())!
    const v = await view(page)

    await page
      .getByRole('button', { name: /Mesa redonda 4 plazas/ })
      .first()
      .click()
    const at = screenFor({ x: 2, y: 3 }, v, box)
    await page.mouse.click(at.x, at.y)
    let s = await scenario(page)
    expect(s.objects).toHaveLength(1)

    // Zoom con rueda: cambia el factor px/unidad sin tocar el mundo.
    await page.mouse.wheel(0, -240)
    const zoomed = await view(page)
    expect(zoomed.pixelsPerUnit).toBeGreaterThan(v.pixelsPerUnit)
    s = await scenario(page)
    expect(s.objects[0]!.position).toEqual({ x: 2, y: 3 })

    // Mover con teclado: flecha derecha = un paso de rejilla.
    await page.keyboard.press('ArrowRight')
    s = await scenario(page)
    expect(s.objects[0]!.position.x).toBeCloseTo(2.5, 6)

    // Un valor inválido en el inspector se rechaza y el objeto no cambia.
    const width = page.getByTestId('field-object-width')
    await width.fill('-5')
    await width.press('Enter')
    await expect(page.getByTestId('status-message-error')).toBeVisible()
    s = await scenario(page)
    expect(s.objects[0]!.dimensions.width).toBeGreaterThan(0)
    expect(s.objects).toHaveLength(1) // el escenario sigue intacto
    expect(consoleErrors).toEqual([])
  })

  test('la consola del navegador no registra errores durante toda la sesión', async ({ page }) => {
    const canvas = page.getByTestId('editor-canvas')
    await canvas.click({ position: { x: 10, y: 10 } })
    const box = (await canvas.boundingBox())!
    const v = await view(page)
    // Sesión variada: dibujar, medir, borrar, deshacer, ayuda.
    await page.keyboard.press('2')
    const from = screenFor({ x: 0, y: 0 }, v, box)
    const to = screenFor({ x: 3, y: 0 }, v, box)
    await page.mouse.move(from.x, from.y)
    await page.mouse.down()
    await page.mouse.move(to.x, to.y, { steps: 6 })
    await page.mouse.up()
    await page.keyboard.press('8')
    const mid = screenFor({ x: 1.5, y: 0 }, v, box)
    await page.mouse.click(mid.x, mid.y)
    await page.getByTestId('undo-button').click()
    await page.keyboard.press('?')
    await expect(page.getByTestId('help-modal')).toBeVisible()
    await page.keyboard.press('Escape')
    expect(consoleErrors).toEqual([])
  })
})

/** Igualdad profunda ignorando el orden de claves (para JSON equivalente). */
function deepEqualIgnoringKeyOrder(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b || a === null || b === null) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqualIgnoringKeyOrder(item, b[i]))
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a as Record<string, unknown>).sort()
    const kb = Object.keys(b as Record<string, unknown>).sort()
    if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) return false
    return ka.every((k) =>
      deepEqualIgnoringKeyOrder(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      ),
    )
  }
  return false
}
