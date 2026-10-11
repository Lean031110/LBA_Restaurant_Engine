import type { Scenario } from '@lba/domain'
import { exportScenario, loadScenarioJson } from '@lba/persistence'
import type { ScenarioLoadResult } from '@lba/persistence'
import { isScenarioValid } from './document'

/**
 * Persistencia del editor (prompts 03.2 y 03.3).
 *
 - Guardar: exporta con @lba/persistence (formato determinista versionado)
 * tras verificar el invariante del esquema; un documento inválido NO se
 * guarda y el error se reporta (los datos no se pierden).
 - Cargar: usa el canal de 6 etapas de @lba/persistence; ante cualquier
 * fallo el documento actual permanece intacto.
 - Autosave: puerto de almacenamiento inyectable (localStorage en la web,
 * memoria en pruebas) para no acoplar este paquete al DOM.
 */

/** Resultado de guardar: ruta/éxito o error legible. */
export type SaveResult =
  { readonly ok: true; readonly json: string } | { readonly ok: false; readonly error: string }

/**
 * Serializa el escenario para guardar. Verifica el invariante ANTES de
 * exportar: si el documento no pasa el esquema del dominio (no debería),
 * se rechaza el guardado en lugar de escribir un fichero corrupto.
 */
export function serializeScenario(scenario: Scenario): SaveResult {
  if (!isScenarioValid(scenario)) {
    return {
      ok: false,
      error:
        'El escenario no pasa la validación del dominio; guardado cancelado para no perder datos (revisa los cambios recientes).',
    }
  }
  return { ok: true, json: exportScenario(scenario) }
}

/** Carga y valida un JSON de escenario (canal de 6 etapas). */
export function parseScenarioJson(text: string): ScenarioLoadResult {
  return loadScenarioJson(text)
}

/** Formatea los problemas de una carga fallida para el panel de estado. */
export function formatLoadIssues(issues: readonly { path: string; message: string }[]): string {
  const shown = issues.slice(0, 3).map((i) => `${i.path}: ${i.message}`)
  const rest = issues.length - shown.length
  return `Escenario rechazado (${issues.length} problema${issues.length === 1 ? '' : 's'}): ${shown.join(' · ')}${rest > 0 ? ` · …y ${rest} más` : ''}`
}

/**
 * Puerto de almacenamiento clave-valor para el autosave local (03.3).
 * apps/web lo implementa con localStorage; las pruebas con un Map.
 */
export interface AutosaveStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Clave de autosave por escenario. */
export function autosaveKey(scenarioId: string): string {
  return `lba:autosave:${scenarioId}`
}

/** Escribe el autosave de un escenario. */
export function writeAutosave(
  storage: AutosaveStorage,
  scenario: Scenario,
  serialized: string,
): void {
  storage.setItem(autosaveKey(scenario.id), serialized)
}

/** Lee el autosave de un escenario, si existe y es válido. */
export function readAutosave(storage: AutosaveStorage, scenarioId: string): Scenario | null {
  const raw = storage.getItem(autosaveKey(scenarioId))
  if (raw === null) return null
  const result = parseScenarioJson(raw)
  return result.ok ? result.data : null
}

/** Elimina el autosave de un escenario (p. ej. al descartarlo). */
export function discardAutosave(storage: AutosaveStorage, scenarioId: string): void {
  storage.removeItem(autosaveKey(scenarioId))
}

/** Almacén en memoria para pruebas (nunca se usa en producción). */
export class MemoryAutosaveStorage implements AutosaveStorage {
  private readonly map = new Map<string, string>()
  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }
  removeItem(key: string): void {
    this.map.delete(key)
  }
}
