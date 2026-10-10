/**
 * @lba/persistence — Importación, exportación y migración de escenarios
 * (FASE 02, prompt 02.3). Paquete puro (regla 11): sin DOM ni frameworks;
 * solo depende de @lba/domain.
 */

// Carga y exportación JSON
export { loadScenarioJson, exportScenario } from './json'
export type { ScenarioLoadResult } from './json'

// No pérdida silenciosa
export { collectUnknownFields, unknownFieldIssues } from './loss-check'

// Referencias cruzadas
export { validateReferences } from './references'

// Migraciones
export { MIGRATION_CHAIN, describeMigrationPath } from './migrations'
export type { MigrationStep, MigrationStepResult, MigrationPath } from './migrations'
