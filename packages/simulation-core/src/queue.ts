/**
 * Cola de eventos del motor (FASE 04, prompt 04.1).
 *
 * Orden estable y determinista por la tupla `(time, priority, sequence)`:
 *
 * 1. `time` ascendente: los eventos ocurren en su instante exacto.
 * 2. `priority` DESCENDENTE en el empate: 100 (máxima urgencia) se despacha
 *    antes que 0, la misma escala que `TaskTemplate.priority` del dominio
 *    (0 = baja, 100 = alta), de modo que una tarea puede mapear su prioridad
 *    a la de sus eventos sin conversión. La prioridad por defecto es 50.
 * 3. `sequence` ascendente como desempate final: quien se programó antes,
 *    se ejecuta antes. `sequence` es un contador monótono del motor.
 *
 * La cancelación usa marcaje (tombstone): cancelar es O(1) y el evento se
 * descarta al extraerlo. Un heap binario mínimo mantiene la inserción y la
 * extracción en O(log n).
 */

/** Evento programado en la cola del motor. */
export interface ScheduledEvent<P = unknown> {
  /** Identificador estable asignado por el motor (no depende de la posición). */
  readonly id: number
  /** Tiempo simulado de ejecución (segundos, >= 0, finito). */
  readonly time: number
  /** Urgencia 0 (baja) .. 100 (alta); en empate de tiempo gana la mayor. */
  readonly priority: number
  /** Orden de programación: desempate final, menor = antes. */
  readonly sequence: number
  /** Código semántico del evento (p. ej. `task.start`, `order.created`). */
  readonly code: string
  /** Actor que lo dispara (opcional). */
  readonly actor?: string
  /** Objetivo del evento (opcional). */
  readonly target?: string
  /** Datos asociados al evento (opcional). */
  readonly payload?: P
}

/** Comparador estable de la tupla (time, priority, sequence). */
export function compareEvents<P>(a: ScheduledEvent<P>, b: ScheduledEvent<P>): number {
  if (a.time !== b.time) return a.time - b.time
  if (a.priority !== b.priority) return b.priority - a.priority
  return a.sequence - b.sequence
}

/**
 * Cola de prioridad de eventos con cancelación por marcaje.
 * No usa temporizadores: solo ordena y entrega; el reloj vive en `SimulationClock`.
 */
export class EventQueue<P = unknown> {
  private heap: Array<ScheduledEvent<P> | null> = []
  private cancelados = new Set<number>()
  private _size = 0
  private nextId = 1

  /** Cantidad de eventos vivos (no cancelados ni extraídos). */
  get size(): number {
    return this._size
  }

  /**
   * Programa un evento. El `id` y el `sequence` los asigna la cola:
   * `sequence` crece monótonamente en cada programación.
   */
  push(event: Omit<ScheduledEvent<P>, 'id' | 'sequence'>): ScheduledEvent<P> {
    const completo: ScheduledEvent<P> = {
      ...event,
      id: this.nextId++,
      sequence: this.nextSequence++,
    }
    this.heap.push(completo)
    this.siftUp(this.heap.length - 1)
    this._size++
    return completo
  }

  private nextSequence = 0

  /** Siguiente evento sin extraerlo (el menor por la tupla), o `null`. */
  peek(): ScheduledEvent<P> | null {
    this.podar()
    return this.heap[0] ?? null
  }

  /** Extrae y devuelve el siguiente evento, o `null` si no queda ninguno. */
  pop(): ScheduledEvent<P> | null {
    this.podar()
    if (this.heap.length === 0) return null
    const tope = this.heap[0]
    const ultimo = this.heap.pop() as ScheduledEvent<P> | null
    if (this.heap.length > 0 && ultimo !== null) {
      this.heap[0] = ultimo
      this.siftDown(0)
    }
    this._size--
    return tope
  }

  /**
   * Cancela un evento por id. Devuelve el resultado explícito: nunca ignora
   * silenciosamente (un id inexistente o ya procesado se reporta).
   */
  cancel(id: number): { cancelled: boolean; reason?: 'not_found' | 'already_cancelled' } {
    for (const e of this.heap) {
      if (e && e.id === id) {
        if (this.cancelados.has(id)) {
          return { cancelled: false, reason: 'already_cancelled' }
        }
        this.cancelados.add(id)
        this._size--
        return { cancelled: true }
      }
    }
    return { cancelled: false, reason: 'not_found' }
  }

  /** Elimina las entradas canceladas de la cabeza del heap. */
  private podar(): void {
    while (this.heap.length > 0) {
      const tope = this.heap[0]
      if (tope === null || this.cancelados.has(tope.id)) {
        // Descartar la cabeza nula/cancelada y reacomodar.
        const ultimo = this.heap.pop() as ScheduledEvent<P> | null
        if (this.heap.length > 0 && ultimo !== null) {
          this.heap[0] = ultimo
          this.siftDown(0)
        }
      } else {
        break
      }
    }
  }

  /** Vacía la cola por completo (reset del motor). */
  clear(): void {
    this.heap = []
    this.cancelados.clear()
    this._size = 0
  }

  /** Eventos vivos ordenados (para inspección/diagnóstico; no muta). */
  snapshot(): ScheduledEvent<P>[] {
    const vivos = this.heap.filter(
      (e): e is ScheduledEvent<P> => e !== null && !this.cancelados.has(e.id),
    )
    return vivos.sort(compareEvents)
  }

  private siftUp(i: number): void {
    while (i > 0) {
      const padre = (i - 1) >> 1
      const nodo = this.heap[i]
      const p = this.heap[padre]
      if (nodo && p && compareEvents(nodo, p) < 0) {
        this.heap[i] = p
        this.heap[padre] = nodo
        i = padre
      } else {
        break
      }
    }
  }

  private siftDown(i: number): void {
    const n = this.heap.length
    for (;;) {
      const izq = 2 * i + 1
      const der = 2 * i + 2
      let menor = i
      if (izq < n) {
        const a = this.heap[menor]
        const b = this.heap[izq]
        if (a && b && compareEvents(b, a) < 0) menor = izq
      }
      if (der < n) {
        const a = this.heap[menor]
        const b = this.heap[der]
        if (a && b && compareEvents(b, a) < 0) menor = der
      }
      if (menor === i) break
      const tmp = this.heap[i]
      this.heap[i] = this.heap[menor]
      this.heap[menor] = tmp
      i = menor
    }
  }
}
