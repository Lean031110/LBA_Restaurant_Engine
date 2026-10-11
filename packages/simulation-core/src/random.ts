/**
 * Generador pseudoaleatorio reproducible (FASE 04, prompt 04.2).
 *
 * Contrato (docs/guia/04, sección 1): «una misma semilla + escenario +
 * configuración debe producir la misma salida lógica». Cualquier
 * aleatoriedad del motor sale de AQUÍ: aritmética entera pura (mulberry32),
 * sin `Math.random` (no determinista) ni dependencias del entorno. Misma
 * semilla ⇒ misma secuencia, en cualquier plataforma.
 */

/** mulberry32: PRNG pequeño, rápido y perfectamente determinista. */
export class Rng {
  private estado = 0

  constructor(seed: number) {
    this.reseed(seed)
  }

  /** Reinicia la secuencia a la semilla dada (lo usa `engine.reset()`). */
  reseed(seed: number): void {
    if (!Number.isInteger(seed) || seed < 0) {
      throw new Error(`la semilla debe ser un entero >= 0 (recibida ${seed})`)
    }
    // Mezcla inicial para que semillas pequeñas no produzcan patrones pobres.
    this.estado = (seed + 0x6d2b79f5) | 0
  }

  /** Siguiente uniforme en [0, 1). */
  next(): number {
    this.estado = (this.estado + 0x6d2b79f5) | 0
    let t = this.estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Entero uniforme en [0, maximoExclusive). */
  int(maximoExclusive: number): number {
    if (!Number.isInteger(maximoExclusive) || maximoExclusive <= 0) {
      throw new Error(`el máximo exclusivo debe ser entero > 0 (recibido ${maximoExclusive})`)
    }
    return Math.floor(this.next() * maximoExclusive)
  }
}

/** Crea un generador con la semilla dada. */
export function createRng(seed: number): Rng {
  return new Rng(seed)
}
