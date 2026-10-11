/**
 * Registro (historial) de eventos ejecutados (FASE 04, prompts 04.2/04.3).
 *
 * Contrato (docs/guia/04, sección 2): `SimulationEvent` con timestamp
 * simulado, secuencia, eventCode, actor/target, cambios y ruleId. El
 * registro es la fuente de verdad explicativa de la ejecución: misma
 * semilla + escenario ⇒ mismo historial lógico (reproducibilidad).
 */

/** Entrada del registro de ejecución. Estructura plana y serializable. */
export interface LogEntry {
  /** Tiempo simulado del evento (segundos). */
  readonly time: number
  /** Secuencia del registro: monótona, independiente de la cola. */
  readonly sequence: number
  /** Código semántico estable (p. ej. `task.started`, `resource.released`). */
  readonly code: string
  /** Actor involucrado (opcional). */
  readonly actor?: string
  /** Objetivo involucrado (opcional). */
  readonly target?: string
  /** Tarea relacionada (opcional). */
  readonly taskId?: string
  /** Recurso relacionado (opcional). */
  readonly resourceId?: string
  /** Id del evento de cola despachado (si aplica). */
  readonly eventId?: number
  /** Código del evento de cola relacionado (si aplica; p. ej. en errores). */
  readonly eventCode?: string
  /** Regla que motivó el evento (FASE 06; opcional). */
  readonly ruleId?: string
  /** Detalle legible adicional (cambios, motivos, cantidades). */
  readonly detail?: string
}

/** Historial de ejecución: solo adición, con exportación y resumen. */
export class EventLog {
  private entradas: LogEntry[] = []
  private secuencia = 0

  /** Cantidad de entradas registradas. */
  get size(): number {
    return this.entradas.length
  }

  /** Registra una entrada asignándole la siguiente secuencia del registro. */
  push(entry: Omit<LogEntry, 'sequence'>): LogEntry {
    const completa: LogEntry = { ...entry, sequence: this.secuencia++ }
    this.entradas.push(completa)
    return completa
  }

  /** Todas las entradas en orden de ejecución (copia). */
  entries(): LogEntry[] {
    return [...this.entradas]
  }

  /** Entradas cuyo código coincide (copia). */
  byCode(code: string): LogEntry[] {
    return this.entradas.filter((e) => e.code === code)
  }

  /** Resumen de conteos por eventCode (para métricas y auditoría). */
  counts(): Record<string, number> {
    const conteo: Record<string, number> = {}
    for (const e of this.entradas) {
      conteo[e.code] = (conteo[e.code] ?? 0) + 1
    }
    return conteo
  }

  /** Vacía el registro (reset del motor). */
  clear(): void {
    this.entradas = []
    this.secuencia = 0
  }

  /**
   * Exportación serializable de la ejecución (contrato sección 8: semilla,
   * versión del motor e historial para comparaciones A/B y reproducibilidad).
   */
  export(options: { seed: number; engineVersion: string }): {
    engineVersion: string
    seed: number
    totalEvents: number
    events: LogEntry[]
  } {
    return {
      engineVersion: options.engineVersion,
      seed: options.seed,
      totalEvents: this.entradas.length,
      events: this.entradas.map((e) => ({ ...e })),
    }
  }
}
