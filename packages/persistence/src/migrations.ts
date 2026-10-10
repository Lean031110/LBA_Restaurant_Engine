import { CURRENT_SCENARIO_SCHEMA_VERSION } from '@lba/domain'
import type { ValidationIssue } from '@lba/domain'

/**
 * POLÍTICA DE MIGRACIONES (prompt 02.3) — sin pérdida silenciosa.
 *
 * 1. Solo migraciones hacia adelante: v(n) → v(n+1) → … → v(CURRENT). Nunca
 *    se reescribe un archivo hacia atrás ni se "corrige" en el sitio.
 * 2. Cada paso es una función PURA: recibe `unknown`, devuelve el objeto
 *    migrado o issues con rutas exactas. Jamás muta la entrada.
 * 3. Un paso que no pueda preservar un dato debe FALLAR con issues; jamás
 *    descarta, rellena con valores por defecto inventados ni degrada en
 *    silencio. Los campos desconocidos de la versión de origen se validan
 *    después de migrar (misma regla de no pérdida que en la versión actual).
 * 4. `schemaVersion > CURRENT` se rechaza con error explícito: este lector no
 *    puede garantizar fidelidad hacia atrás con una versión futura.
 * 5. La cadena (`MIGRATION_CHAIN`) se declara completa y por adelantado: si
 *    falta CUALQUIER paso entre la versión del archivo y CURRENT, la carga
 *    falla con la lista de huecos. No se inventan pasos vacíos.
 * 6. Cada paso se prueba con ida y vuelta y casos negativos antes de
 *    publicarse; el primer paso real (1→2) se define cuando exista
 *    schemaVersion 2. Hoy la cadena está VACÍA porque la versión 1 es la
 *    primera del formato: no existen archivos legítimos más antiguos.
 */

/** Resultado de un paso de migración: datos migrados o issues con rutas. */
export type MigrationStepResult =
  { ok: true; data: unknown } | { ok: false; issues: ValidationIssue[] }

/** Paso de migración documentado y probado. */
export interface MigrationStep {
  /** Versión de origen del paso. */
  readonly from: number
  /** Versión de destino del paso. */
  readonly to: number
  /** Qué transforma y por qué (referencia al ADR correspondiente). */
  readonly description: string
  /** Función pura de migración. */
  readonly migrate: (input: unknown) => MigrationStepResult
}

/**
 * Cadena de migraciones declarada. Estado inicial (FASE 02): VACÍA.
 * La versión 1 es la primera del formato; cuando exista la 2, el paso
 * 1→2 se añade aquí con su ADR, pruebas de ida y vuelta y casos negativos.
 */
export const MIGRATION_CHAIN: readonly MigrationStep[] = []

/** Resultado del análisis del camino de migración. */
export interface MigrationPath {
  ok: boolean
  /** Pasos a aplicar en orden (vacío si la versión ya es la actual). */
  steps?: readonly MigrationStep[]
  /** Motivo del fallo cuando ok es false. */
  reason?: string
}

/**
 * Calcula si la cadena cubre el camino from → CURRENT. Puro: no toca la
 * entrada, solo planifica. `from === CURRENT` devuelve ok con pasos vacíos.
 */
export function describeMigrationPath(from: number): MigrationPath {
  if (from === CURRENT_SCENARIO_SCHEMA_VERSION) {
    return { ok: true, steps: [] }
  }
  if (from > CURRENT_SCENARIO_SCHEMA_VERSION) {
    return {
      ok: false,
      reason: `schemaVersion ${from} es posterior a la soportada (${CURRENT_SCENARIO_SCHEMA_VERSION}); este lector no puede garantizar fidelidad hacia atrás`,
    }
  }
  if (MIGRATION_CHAIN.length === 0) {
    return {
      ok: false,
      reason: `la cadena de migraciones está vacía: la versión ${CURRENT_SCENARIO_SCHEMA_VERSION} es la primera del formato y no existen versiones anteriores legítimas`,
    }
  }
  // Caminar desde `from` hasta CURRENT buscando cada paso consecutivo.
  const steps: MigrationStep[] = []
  let cursor = from
  const missing: string[] = []
  while (cursor < CURRENT_SCENARIO_SCHEMA_VERSION) {
    const step = MIGRATION_CHAIN.find((s) => s.from === cursor)
    if (step === undefined) {
      missing.push(`${cursor} → ${cursor + 1}`)
      cursor += 1
      continue
    }
    steps.push(step)
    cursor = step.to
  }
  if (missing.length > 0) {
    return {
      ok: false,
      reason: `faltan pasos de migración: ${missing.join(', ')} (la cadena debe estar completa y probada antes de aceptar el archivo; política de no pérdida silenciosa)`,
    }
  }
  return { ok: true, steps }
}
