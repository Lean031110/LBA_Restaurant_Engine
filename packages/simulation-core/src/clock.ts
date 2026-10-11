/**
 * Reloj simulado (FASE 04, prompt 04.1).
 *
 * Invariante del contrato (docs/guia/04, sección 1): el tiempo simulado
 * JAMÁS retrocede. El reloj es un valor puro que solo avanza cuando el
 * motor procesa eventos o completa un `runUntil`; no usa `Date.now`,
 * `setInterval` ni temporizadores reales. La velocidad visual (1x/10x)
 * es cosa de la UI: el motor solo conoce tiempo simulado.
 */

/** Reloj simulado: envuelve `simulationTimeSeconds` con la invariante. */
export class SimulationClock {
  private tiempo: number

  constructor(inicio = 0) {
    if (!Number.isFinite(inicio) || inicio < 0) {
      throw new Error(`el tiempo inicial debe ser finito y >= 0 (recibido ${inicio})`)
    }
    this.tiempo = inicio
  }

  /** Tiempo simulado actual en segundos. */
  get seconds(): number {
    return this.tiempo
  }

  /**
   * Avanza el reloj a `destino`. Lanza si `destino` es anterior al tiempo
   * actual (la invariante se protege en el único punto de mutación).
   */
  advanceTo(destino: number): void {
    if (!Number.isFinite(destino) || destino < 0) {
      throw new Error(`el tiempo destino debe ser finito y >= 0 (recibido ${destino})`)
    }
    if (destino < this.tiempo) {
      throw new Error(`el reloj no retrocede: actual=${this.tiempo}s, destino=${destino}s`)
    }
    this.tiempo = destino
  }

  /** Reinicia el reloj al valor inicial (usado por `engine.reset()`). */
  reset(inicio = 0): void {
    if (!Number.isFinite(inicio) || inicio < 0) {
      throw new Error(`el tiempo inicial debe ser finito y >= 0 (recibido ${inicio})`)
    }
    this.tiempo = inicio
  }
}
