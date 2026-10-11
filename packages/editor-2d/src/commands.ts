import type { Position, Scenario, WorldObject, WorldObjectId, Zone, ZoneId } from '@lba/domain'
import { WorldObjectSchema, ZoneSchema, ScenarioSchema } from '@lba/domain'
import type { EditorDocument } from './types'
import { EMPTY_SELECTION } from './types'
import { add, rotateAround, sub } from './geometry'

/**
 * Comandos del editor: transformaciones PURAS de documento con validación.
 * Cada comando devuelve el documento siguiente o un error legible; la store
 * (store.ts) registra las versiones antes/después en el historial.
 *
 * Invariante: todo documento devuelto pasa el esquema del dominio. Si un
 * parche produce un objeto/escenario inválido, el comando falla con mensaje
 * y el documento NO cambia (criterio 03.2: los errores no pierden datos).
 */

export type CommandResult =
  | { readonly ok: true; readonly document: EditorDocument; readonly label: string }
  | { readonly ok: false; readonly error: string }

function ok(doc: EditorDocument, label: string): CommandResult {
  return { ok: true, document: doc, label }
}

function fail(error: string): CommandResult {
  return { ok: false, error }
}

/** Reemplaza un objeto aplicando un parche parcial validado. */
function withObject(
  doc: EditorDocument,
  id: WorldObjectId,
  patch: (obj: WorldObject) => WorldObject,
): { document: EditorDocument; object: WorldObject; index: number } | null {
  const index = doc.scenario.objects.findIndex((o) => o.id === id)
  if (index === -1) return null
  const prev = doc.scenario.objects[index]!
  const next = patch(prev)
  const objects = [...doc.scenario.objects]
  objects[index] = next
  return {
    document: {
      ...doc,
      scenario: { ...doc.scenario, objects },
    },
    object: next,
    index,
  }
}

/** Añade un objeto validado (el ID debe ser único; lo garantiza ids.ts). */
export function addObject(doc: EditorDocument, obj: WorldObject): CommandResult {
  const parsed = WorldObjectSchema.safeParse(obj)
  if (!parsed.success) {
    return fail(`Objeto inválido: ${parsed.error.issues[0]?.message ?? 'error de validación'}`)
  }
  if (doc.scenario.objects.some((o) => o.id === obj.id)) {
    return fail(`ID duplicado en "objects": "${obj.id}" ya existe`)
  }
  return ok(
    {
      ...doc,
      scenario: { ...doc.scenario, objects: [...doc.scenario.objects, parsed.data] },
      selection: { objectIds: [obj.id], zoneIds: [] },
    },
    `Añadir ${obj.name ?? obj.kind}`,
  )
}

/** Añade una zona validada. */
export function addZone(doc: EditorDocument, zone: Zone): CommandResult {
  const parsed = ZoneSchema.safeParse(zone)
  if (!parsed.success) {
    return fail(`Zona inválida: ${parsed.error.issues[0]?.message ?? 'error de validación'}`)
  }
  if (doc.scenario.zones.some((z) => z.id === zone.id)) {
    return fail(`ID duplicado en "zones": "${zone.id}" ya existe`)
  }
  return ok(
    {
      ...doc,
      scenario: { ...doc.scenario, zones: [...doc.scenario.zones, parsed.data] },
      selection: { objectIds: [], zoneIds: [zone.id] },
    },
    `Añadir zona ${zone.name}`,
  )
}

/**
 * Aplica un parche parcial a un objeto. El objeto resultante se revalida
 * con el esquema del dominio: un parche inválido (dimensión 0, rotación
 * fuera de rango, nombre vacío…) se rechaza sin tocar el documento.
 */
export function updateObject(
  doc: EditorDocument,
  id: WorldObjectId,
  patch: Partial<WorldObject>,
): CommandResult {
  const result = withObject(doc, id, (obj) => ({ ...obj, ...patch }))
  if (!result) return fail(`No existe el objeto "${id}"`)
  const parsed = WorldObjectSchema.safeParse(result.object)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const path = issue?.path.join('.')
    return fail(
      `No se aplicó el cambio: ${issue?.message ?? 'validación fallida'}${path ? ` (${path})` : ''}`,
    )
  }
  const document = {
    ...result.document,
    scenario: {
      ...result.document.scenario,
      objects: result.document.scenario.objects.map((o, i) =>
        i === result.index ? parsed.data : o,
      ),
    },
  }
  return ok(document, `Editar ${parsed.data.name ?? parsed.data.kind}`)
}

/**
 * Cambia la longitud de un muro. Por contrato del catálogo (02.2), la
 * longitud del tramo SIEMPRE coincide con `dimensions.width`, así que el
 * parche actualiza ese campo. El punto de interacción de un muro es su
 * centro (pasivo), así que se mantiene en `position`.
 */
export function updateWallLength(
  doc: EditorDocument,
  id: WorldObjectId,
  length: number,
): CommandResult {
  const target = doc.scenario.objects.find((o) => o.id === id)
  if (!target) return fail(`No existe el objeto "${id}"`)
  if (target.kind !== 'wall') return fail('La longitud solo aplica a muros')
  return updateObject(doc, id, { dimensions: { ...target.dimensions, width: length } })
}

/**
 * Aplica un parche parcial a una zona, revalidando el resultado.
 */
export function updateZone(doc: EditorDocument, id: ZoneId, patch: Partial<Zone>): CommandResult {
  const index = doc.scenario.zones.findIndex((z) => z.id === id)
  if (index === -1) return fail(`No existe la zona "${id}"`)
  const merged: Zone = { ...doc.scenario.zones[index]!, ...patch }
  const parsed = ZoneSchema.safeParse(merged)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return fail(`No se aplicó el cambio de zona: ${issue?.message ?? 'validación fallida'}`)
  }
  const zones = [...doc.scenario.zones]
  zones[index] = parsed.data
  return ok({ ...doc, scenario: { ...doc.scenario, zones } }, `Editar zona ${parsed.data.name}`)
}

/** Traslada una lista de objetos (posición y punto de interacción). */
export function moveObjects(
  doc: EditorDocument,
  ids: readonly WorldObjectId[],
  delta: Position,
): CommandResult {
  if (ids.length === 0) return fail('No hay objetos seleccionados')
  if (delta.x === 0 && delta.y === 0) return fail('Desplazamiento nulo')
  const idSet = new Set<string>(ids)
  const objects = doc.scenario.objects.map((o) => {
    if (!idSet.has(o.id)) return o
    return {
      ...o,
      position: add(o.position, delta),
      interactionPoint: add(o.interactionPoint, delta),
    }
  })
  return ok({ ...doc, scenario: { ...doc.scenario, objects } }, `Mover ${ids.length} objeto(s)`)
}

/**
 * Traslada objetos Y zonas en un solo comando (un gesto de arrastre =
 * una entrada de historial). Es la operación que usa el arrastre del lienzo.
 */
export function moveElements(
  doc: EditorDocument,
  objectIds: readonly WorldObjectId[],
  zoneIds: readonly ZoneId[],
  delta: Position,
): CommandResult {
  if (objectIds.length === 0 && zoneIds.length === 0) return fail('No hay elementos seleccionados')
  if (delta.x === 0 && delta.y === 0) return fail('Desplazamiento nulo')
  const objSet = new Set<string>(objectIds)
  const zoneSet = new Set<string>(zoneIds)
  const objects = doc.scenario.objects.map((o) =>
    objSet.has(o.id)
      ? { ...o, position: add(o.position, delta), interactionPoint: add(o.interactionPoint, delta) }
      : o,
  )
  const zones = doc.scenario.zones.map((z) =>
    zoneSet.has(z.id)
      ? {
          ...z,
          bounds: {
            min: add(z.bounds.min, delta),
            max: add(z.bounds.max, delta),
          },
        }
      : z,
  )
  const total = objectIds.length + zoneIds.length
  return ok({ ...doc, scenario: { ...doc.scenario, objects, zones } }, `Mover ${total} elemento(s)`)
}

/**
 * Rota objetos en torno a su propio centro (rotación en el sitio): la
 * rotación aumenta y el punto de interacción gira con el objeto.
 */
export function rotateObjects(
  doc: EditorDocument,
  ids: readonly WorldObjectId[],
  degrees: number,
): CommandResult {
  if (ids.length === 0) return fail('No hay objetos seleccionados')
  const idSet = new Set<string>(ids)
  const objects = doc.scenario.objects.map((o) => {
    if (!idSet.has(o.id)) return o
    const rotation = (((o.rotation + degrees) % 360) + 360) % 360
    return {
      ...o,
      rotation,
      interactionPoint: rotateAround(o.interactionPoint, o.position, degrees),
    }
  })
  return ok({ ...doc, scenario: { ...doc.scenario, objects } }, `Rotar ${ids.length} objeto(s)`)
}

/**
 * Redimensiona un objeto manteniendo la rotación (el ancho/fondo son la
 * huella local). El punto de interacción se conserva salvo en muros, cuyo
 * punto pasivo es su propio centro.
 */
export function resizeObject(
  doc: EditorDocument,
  id: WorldObjectId,
  dimensions: { width: number; depth: number },
): CommandResult {
  const target = doc.scenario.objects.find((o) => o.id === id)
  if (!target) return fail(`No existe el objeto "${id}"`)
  return updateObject(doc, id, { dimensions: { ...dimensions } })
}

/** Borra los objetos y zonas indicados (seleccionados). */
export function deleteElements(
  doc: EditorDocument,
  objectIds: readonly WorldObjectId[],
  zoneIds: readonly ZoneId[],
): CommandResult {
  const objSet = new Set<string>(objectIds)
  const zoneSet = new Set<string>(zoneIds)
  const objects = doc.scenario.objects.filter((o) => !objSet.has(o.id))
  const zones = doc.scenario.zones.filter((z) => !zoneSet.has(z.id))
  const removed = doc.scenario.objects.length - objects.length
  const removedZones = doc.scenario.zones.length - zones.length
  if (removed + removedZones === 0) return fail('No hay elementos seleccionados que borrar')
  return ok(
    {
      scenario: { ...doc.scenario, objects, zones },
      selection: EMPTY_SELECTION,
    },
    `Borrar ${removed} objeto(s) y ${removedZones} zona(s)`,
  )
}

/** Duplica los objetos seleccionados con IDs nuevos y un desplazamiento. */
export function duplicateObjects(
  doc: EditorDocument,
  ids: readonly WorldObjectId[],
  offset: Position,
  newIds: readonly WorldObjectId[],
): CommandResult {
  if (ids.length === 0) return fail('No hay objetos seleccionados que duplicar')
  if (ids.length !== newIds.length) return fail('Inconsistencia interna al duplicar')
  const byId = new Map(doc.scenario.objects.map((o) => [o.id as string, o]))
  const clones: WorldObject[] = []
  for (let i = 0; i < ids.length; i++) {
    const source = byId.get(ids[i]!)
    if (!source) return fail(`No existe el objeto "${ids[i]}"`)
    const id = newIds[i]!
    const parsed = WorldObjectSchema.safeParse({
      ...source,
      id,
      position: add(source.position, offset),
      interactionPoint: add(source.interactionPoint, offset),
    })
    if (!parsed.success) {
      return fail(`No se pudo duplicar: ${parsed.error.issues[0]?.message}`)
    }
    clones.push(parsed.data)
  }
  return ok(
    {
      ...doc,
      scenario: { ...doc.scenario, objects: [...doc.scenario.objects, ...clones] },
      selection: { objectIds: newIds, zoneIds: [] },
    },
    `Duplicar ${clones.length} objeto(s)`,
  )
}

/** Asigna (o desasigna con null) la zona funcional de varios objetos. */
export function assignZone(
  doc: EditorDocument,
  ids: readonly WorldObjectId[],
  zoneId: ZoneId | null,
): CommandResult {
  if (ids.length === 0) return fail('No hay objetos seleccionados')
  if (zoneId !== null && !doc.scenario.zones.some((z) => z.id === zoneId)) {
    return fail(`No existe la zona "${zoneId}"`)
  }
  const idSet = new Set<string>(ids)
  const objects = doc.scenario.objects.map((o) => {
    if (!idSet.has(o.id)) return o
    if (zoneId === null) {
      // El dominio declara zoneId como opcional (no nullable): se omite la clave.
      const { zoneId: _removed, ...rest } = o
      return rest as WorldObject
    }
    return { ...o, zoneId }
  })
  return ok({ ...doc, scenario: { ...doc.scenario, objects } }, 'Asignar zona')
}

/**
 * Actualiza propiedades del escenario (nombre, descripción, semilla,
 * tamaño del local). Se revalida el escenario completo.
 */
export function updateScenario(
  doc: EditorDocument,
  patch: Partial<Pick<Scenario, 'name' | 'description' | 'seed'>> & {
    worldSize?: { width: number; depth: number }
    lengthUnit?: 'm' | 'cm'
  },
): CommandResult {
  const current = doc.scenario
  const candidate: Scenario = {
    ...current,
    name: patch.name ?? current.name,
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.seed !== undefined ? { seed: patch.seed } : {}),
    world: {
      lengthUnit: patch.lengthUnit ?? current.world.lengthUnit,
      size: patch.worldSize ?? current.world.size,
    },
  }
  const parsed = ScenarioSchema.safeParse(candidate)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return fail(`Escenario inválido: ${issue?.message ?? 'validación fallida'}`)
  }
  return ok({ ...doc, scenario: parsed.data }, 'Editar escenario')
}

/** Vector entre dos puntos (para duplicar con desplazamiento relativo). */
export function deltaBetween(from: Position, to: Position): Position {
  return sub(to, from)
}
