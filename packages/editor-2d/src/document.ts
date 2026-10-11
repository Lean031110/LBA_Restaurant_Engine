import { ScenarioSchema } from '@lba/domain'
import type { Scenario, WorldLengthUnit } from '@lba/domain'
import { EMPTY_SELECTION } from './types'
import type { EditorDocument } from './types'

/**
 * Documento del editor: envoltorio del escenario del dominio con la
 * selección. Todas las mutaciones pasan por comandos validados
 * (commands.ts); este módulo solo crea documentos iniciales y verifica
 * invariantes.
 */

/** Dimensiones por defecto del local nuevo (m) — editable en el inspector. */
export const DEFAULT_WORLD_SIZE = { width: 12, depth: 8 } as const

/** Escenario inicial del editor: local vacío de 12 × 8 m y semilla fija. */
export function emptyScenario(): Scenario {
  return ScenarioSchema.parse({
    schemaVersion: 1,
    id: 'scn_local-nuevo',
    name: 'Nuevo restaurante',
    description: 'Plano en blanco: dibuja paredes, coloca el catálogo y guarda el escenario.',
    world: { lengthUnit: 'm', size: { ...DEFAULT_WORLD_SIZE } },
    seed: 7,
    objects: [],
    zones: [],
    agents: [],
    taskTemplates: [],
    equipment: [],
    orders: [],
    recipes: [],
    inventory: [],
    parameters: {},
  })
}

/** Documento inicial: escenario vacío sin selección. */
export function createEmptyDocument(): EditorDocument {
  return { scenario: emptyScenario(), selection: EMPTY_SELECTION }
}

/**
 * Sustituye el escenario del documento (cargar fichero / restaurar autosave)
 * y limpia la selección: los IDs de la selección anterior pueden no existir.
 */
export function withScenario(_doc: EditorDocument, scenario: Scenario): EditorDocument {
  return { scenario, selection: EMPTY_SELECTION }
}

/** Unidad de longitud activa del documento. */
export function lengthUnitOf(doc: EditorDocument): WorldLengthUnit {
  return doc.scenario.world.lengthUnit
}

/**
 * Verifica que el escenario del documento sigue siendo válido según el
 * esquema del dominio. Se usa como red de seguridad al guardar: si un
 * comando hubiera producido un estado inválido (no debería), el guardado
 * se niega y el documento NO se pierde (criterio 03.2: errores no pierden
 * datos).
 */
export function isScenarioValid(scenario: Scenario): boolean {
  return ScenarioSchema.safeParse(scenario).success
}
