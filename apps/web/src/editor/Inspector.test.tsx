/**
 * Inspector contextual conectado a la store real: modos escenario/objeto/
 * zona/multi, edición con confirmación y rechazo de valores inválidos
 * (regla 16: cada propiedad y botón probados).
 */
import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EditorStore } from '@lba/editor-2d'
import { Inspector } from './Inspector'

function placeTable(store: EditorStore, x = 1, y = 1) {
  store.pickPreset('cat_table-round-4')
  store.pointerDown({ x, y }, { button: 0, shift: false })
  return store.getState().document.scenario.objects.at(-1)!.id
}

function placeWall(store: EditorStore) {
  store.selectTool('wall')
  store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
  store.pointerMove({ x: 4, y: 0 })
  store.pointerUp()
  return store.getState().document.scenario.objects[0]!.id
}

function placeDoor(store: EditorStore) {
  const wallId = placeWall(store)
  store.selectTool('door')
  store.pointerDown({ x: 2, y: 0.1 }, { button: 0, shift: false })
  return { wallId, doorId: store.getState().document.scenario.objects[1]!.id }
}

function montar(store = new EditorStore()) {
  render(<Inspector store={store} />)
  return store
}

describe('Inspector — modo escenario (sin selección)', () => {
  it('edita el nombre con confirmación al perder el foco (una entrada de historial)', async () => {
    const store = montar()
    const field = screen.getByTestId('field-scenario-name') as HTMLInputElement
    fireEvent.change(field, { target: { value: 'Mi pizzería' } })
    fireEvent.blur(field)
    await waitFor(() => expect(store.getState().document.scenario.name).toBe('Mi pizzería'))
    expect(store.historyLabels().undo).toHaveLength(1)
  })

  it('rechaza un nombre vacío sin tocar el documento', async () => {
    const store = montar()
    const field = screen.getByTestId('field-scenario-name') as HTMLInputElement
    fireEvent.change(field, { target: { value: '' } })
    fireEvent.blur(field)
    await waitFor(() => expect(store.getState().messages.at(-1)?.level).toBe('error'))
    expect(store.getState().document.scenario.name).toBe('Nuevo restaurante')
  })

  it('edita la semilla y el tamaño del local', async () => {
    const store = montar()
    const seed = screen.getByTestId('field-scenario-seed') as HTMLInputElement
    fireEvent.change(seed, { target: { value: '42' } })
    fireEvent.blur(seed)
    await waitFor(() => expect(store.getState().document.scenario.seed).toBe(42))

    const width = screen.getByTestId('field-world-width') as HTMLInputElement
    fireEvent.change(width, { target: { value: '15' } })
    fireEvent.blur(width)
    await waitFor(() => expect(store.getState().document.scenario.world.size.width).toBe(15))
  })

  it('muestra la lista de zonas y permite seleccionar una', async () => {
    const store = montar()
    expect(screen.getByTestId('inspector-zones-empty')).toBeInTheDocument()
    act(() => {
      store.selectTool('zone')
      store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
      store.pointerMove({ x: 4, y: 4 })
      store.pointerUp()
    })
    // Crear la zona la deja seleccionada; volvemos al modo escenario para
    // comprobar que la lista de zonas aparece (y permite seleccionarla).
    act(() => store.clearSelection())
    await waitFor(() => expect(screen.getByTestId('inspector-zone-list')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('inspector-zone-list').querySelector('button')!)
    expect(store.getState().document.selection.zoneIds).toHaveLength(1)
  })
})

describe('Inspector — modo objeto', () => {
  it('muestra las propiedades básicas y las avanzadas van plegadas', () => {
    const store = new EditorStore()
    const id = placeTable(store)
    store.selectObject(id, false)
    montar(store)

    expect(screen.getByTestId('inspector-object')).toBeInTheDocument()
    expect(screen.getByTestId('field-object-name')).toBeInTheDocument()
    expect(screen.getByTestId('field-object-rotation')).toBeInTheDocument()
    expect(screen.getByTestId('field-object-width')).toBeInTheDocument()
    expect(screen.queryByTestId('advanced-panel')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('fold-advanced'))
    expect(screen.getByTestId('advanced-panel')).toBeInTheDocument()
    expect(screen.getByTestId('field-object-zone')).toBeInTheDocument()
  })

  it('edita posición, rotación y dimensiones con confirmación', async () => {
    const store = new EditorStore()
    const id = placeTable(store)
    store.selectObject(id, false)
    montar(store)

    const x = screen.getByTestId('field-object-x') as HTMLInputElement
    fireEvent.change(x, { target: { value: '3.5' } })
    fireEvent.blur(x)
    await waitFor(() => expect(store.getObject(id)!.position.x).toBe(3.5))

    const rot = screen.getByTestId('field-object-rotation') as HTMLInputElement
    fireEvent.change(rot, { target: { value: '90' } })
    fireEvent.blur(rot)
    await waitFor(() => expect(store.getObject(id)!.rotation).toBe(90))

    const width = screen.getByTestId('field-object-width') as HTMLInputElement
    fireEvent.change(width, { target: { value: '2' } })
    fireEvent.blur(width)
    await waitFor(() => expect(store.getObject(id)!.dimensions.width).toBe(2))
  })

  it('rechaza dimensiones fuera del rango declarado por el catálogo con mensaje claro', async () => {
    const store = new EditorStore()
    const id = placeWall(store)
    store.selectObject(id, false)
    montar(store)

    const length = screen.getByTestId('field-wall-length') as HTMLInputElement
    fireEvent.change(length, { target: { value: '80' } }) // rango declarado: 0.1–50
    fireEvent.blur(length)
    await waitFor(() => expect(store.getState().messages.at(-1)?.level).toBe('error'))
    expect(store.getState().messages.at(-1)?.text).toContain('entre 0.1 y 50')
    expect(store.getObject(id)!.dimensions.width).toBe(4) // sin cambios
  })

  it('el selector de material cambia material y color sugerido', async () => {
    const store = new EditorStore()
    const id = placeWall(store)
    store.selectObject(id, false)
    montar(store)

    const material = screen.getByTestId('field-object-material') as HTMLSelectElement
    const options = Array.from(material.options).map((o) => o.value)
    expect(options.length).toBeGreaterThanOrEqual(2)

    const target = options.find((o) => o !== material.value)!
    fireEvent.change(material, { target: { value: target } })
    await waitFor(() => {
      const obj = store.getObject(id)!
      expect(obj.material).not.toBe('Placa de yeso')
    })
    expect(store.getObject(id)!.color).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('la puerta expone mecanismo, bisagra y lado de apertura', async () => {
    const store = new EditorStore()
    const { doorId } = placeDoor(store)
    store.selectObject(doorId, false)
    montar(store)

    fireEvent.click(screen.getByTestId('fold-advanced'))
    expect(screen.getByTestId('field-door-type')).toBeInTheDocument()
    expect(screen.getByTestId('field-door-hinge')).toBeInTheDocument()
    expect(screen.getByTestId('field-door-opening')).toBeInTheDocument()

    fireEvent.change(screen.getByTestId('field-door-hinge') as HTMLSelectElement, {
      target: { value: 'right' },
    })
    await waitFor(() => expect(String(store.getObject(doorId)!.properties['hinge'])).toBe('right'))
  })

  it('los botones de borrar y duplicar actúan sobre la selección', async () => {
    const store = new EditorStore()
    const id = placeTable(store)
    store.selectObject(id, false)
    montar(store)

    fireEvent.click(screen.getByTestId('inspector-duplicate'))
    await waitFor(() => expect(store.getState().document.scenario.objects).toHaveLength(2))

    fireEvent.click(screen.getByTestId('inspector-delete'))
    await waitFor(() => expect(store.getState().document.scenario.objects).toHaveLength(1))
  })
})

describe('Inspector — modo zona y selección múltiple', () => {
  it('edita el nombre y los límites de la zona', async () => {
    const store = new EditorStore()
    store.selectTool('zone')
    store.pointerDown({ x: 0, y: 0 }, { button: 0, shift: false })
    store.pointerMove({ x: 4, y: 4 })
    store.pointerUp()
    const zoneId = store.getState().document.scenario.zones[0]!.id
    montar(store)

    expect(screen.getByTestId('inspector-zone')).toBeInTheDocument()
    const name = screen.getByTestId('field-zone-name') as HTMLInputElement
    fireEvent.change(name, { target: { value: 'Salón principal' } })
    fireEvent.blur(name)
    await waitFor(() =>
      expect(store.getState().document.scenario.zones[0]!.name).toBe('Salón principal'),
    )

    const maxX = screen.getByTestId('field-zone-maxx') as HTMLInputElement
    fireEvent.change(maxX, { target: { value: '6' } })
    fireEvent.blur(maxX)
    await waitFor(() => expect(store.getState().document.scenario.zones[0]!.bounds.max.x).toBe(6))
    expect(zoneId).toBeTruthy()
  })

  it('la selección múltiple muestra recuento y acciones masivas', async () => {
    const store = new EditorStore()
    const a = placeTable(store, 1, 1)
    const b = placeTable(store, 3, 1)
    store.selectObject(a, false)
    store.selectObject(b, true)
    montar(store)

    expect(screen.getByTestId('inspector-multi')).toBeInTheDocument()
    expect(screen.getByTestId('inspector-multi').textContent).toContain('2 objetos')

    fireEvent.click(screen.getByTestId('multi-delete'))
    await waitFor(() => expect(store.getState().document.scenario.objects).toHaveLength(0))
  })
})
