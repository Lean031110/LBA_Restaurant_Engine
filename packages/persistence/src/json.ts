import { CURRENT_SCENARIO_SCHEMA_VERSION, isPlainObject, validateScenario } from '@lba/domain'
import type { Scenario, ValidationIssue } from '@lba/domain'
import { collectUnknownFields, unknownFieldIssues } from './loss-check'
import { validateReferences } from './references'
import { describeMigrationPath } from './migrations'

/**
 * Carga y exportación de escenarios JSON (prompt 02.3).
 *
 * Canal de importación (etapas en orden; cada una corta y reporta rutas
 * exactas; el escenario ACTUAL del llamador jamás se toca — funciones puras):
 *
 *  1. Sintaxis: JSON.parse; un texto mal formado falla en "(raíz)".
 *  2. Estructura: debe ser un objeto JSON (no array ni escalar).
 *  3. Versión: puerta de migraciones (política en migrations.ts).
 *  4. Tipos/rangos/unidades/IDs: validación Zod del dominio.
 *  5. No pérdida silenciosa: las claves de la entrada ausentes en la salida
 *     validada se rechazan con su ruta (nunca se descartan sin decirlo).
 *  6. Referencias cruzadas: enlaces entre colecciones y ciclos de
 *     dependencias.
 */

/** Resultado de cargar un escenario: datos nuevos o issues con rutas. */
export type ScenarioLoadResult =
  { ok: true; data: Scenario } | { ok: false; issues: ValidationIssue[] }

function failure(issues: readonly ValidationIssue[]): ScenarioLoadResult {
  return { ok: false, issues: [...issues] }
}

/** Mensaje de error de sintaxis de JSON.parse, acotado y sin rutas locales. */
function jsonSyntaxReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return message.length > 160 ? `${message.slice(0, 160)}…` : message
}

/**
 * Carga un escenario desde su texto JSON. Nunca muta la entrada ni el
 * escenario actual de la aplicación: devuelve un objeto NUEVO validado o
 * la lista completa de problemas con rutas de campo exactas.
 */
export function loadScenarioJson(text: string): ScenarioLoadResult {
  // 1. Sintaxis.
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return failure([
      {
        path: '(raíz)',
        code: 'json_syntax',
        message: `JSON mal formado: ${jsonSyntaxReason(error)}`,
      },
    ])
  }

  // 2. Estructura.
  if (!isPlainObject(parsed)) {
    return failure([
      {
        path: '(raíz)',
        code: 'custom',
        message: 'el archivo de escenario debe ser un objeto JSON (no array ni valor escalar)',
      },
    ])
  }

  // 3. Versión (puerta de migraciones; solo entra por aquí un número entero
  //    distinto de CURRENT: los no numéricos/ausentes los reporta el paso 4
  //    con la ruta exacta de schemaVersion).
  const rawVersion: unknown = parsed.schemaVersion
  if (
    typeof rawVersion === 'number' &&
    Number.isInteger(rawVersion) &&
    rawVersion !== CURRENT_SCENARIO_SCHEMA_VERSION
  ) {
    const migrationPath = describeMigrationPath(rawVersion)
    if (!migrationPath.ok) {
      return failure([
        {
          path: 'schemaVersion',
          code: 'unsupported_version',
          message: `schemaVersion ${rawVersion} no se puede cargar: ${migrationPath.reason}`,
        },
      ])
    }
    for (const step of migrationPath.steps ?? []) {
      const migrated = step.migrate(parsed)
      if (!migrated.ok) {
        return failure(migrated.issues)
      }
      parsed = migrated.data
    }
  }

  // 4. Tipos/rangos/unidades/IDs duplicados (dominio).
  const validated = validateScenario(parsed)
  if (!validated.ok) {
    return failure(validated.issues)
  }

  // 5. No pérdida silenciosa: claves de la entrada que la salida validada
  //    no conserva (zod strip) se rechazan con ruta exacta.
  const unknownPaths = collectUnknownFields(parsed, validated.data)
  if (unknownPaths.length > 0) {
    return failure(unknownFieldIssues(unknownPaths))
  }

  // 6. Referencias cruzadas y ciclos.
  const referenceIssues = validateReferences(validated.data)
  if (referenceIssues.length > 0) {
    return failure(referenceIssues)
  }

  return { ok: true, data: validated.data }
}

/**
 * Exporta un escenario al formato portátil del proyecto: el JSON del
 * escenario con schemaVersion, indentación de 2 espacios y salto de línea
 * final. Determinista: dos exportaciones del mismo escenario producen
 * exactamente el mismo texto (orden de claves estable).
 */
export function exportScenario(scenario: Scenario): string {
  return `${JSON.stringify(scenario, null, 2)}\n`
}
