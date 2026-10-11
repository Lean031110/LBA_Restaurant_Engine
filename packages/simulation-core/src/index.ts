/**
 * @lba/simulation-core — núcleo del motor de simulación (FASE 04).
 *
 * Barrel de re-exportaciones. El paquete es puro (regla 11): sin React,
 * sin DOM, sin temporizadores reales. La UI consume este núcleo para
 * ejecutar/pausar/avanzar la simulación sin alterar las reglas matemáticas.
 */

export { SimulationClock } from './clock'
export { EventQueue, compareEvents, type ScheduledEvent } from './queue'
export { EventLog, type LogEntry } from './log'
export {
  ENGINE_VERSION,
  SimulationEngine,
  createEngine,
  type EngineOptions,
  type EngineState,
  type EventHandler,
  type RunResult,
  type ScheduleInput,
} from './engine'
export {
  EngineError,
  EngineErrorCodes,
  type EngineErrorContext,
  type EngineErrorCode,
} from './errors'
