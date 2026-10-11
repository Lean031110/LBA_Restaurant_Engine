/**
 * Recursos de capacidad limitada (FASE 04, prompt 04.2).
 *
 * Contrato (docs/guia/04, sección 1): «recurso con capacidad 1 no puede
 * estar asignado a dos tareas incompatibles al mismo tiempo» y «una tarea
 * fallida, cancelada o interrumpida libera recursos correctamente».
 *
 * Reglas documentadas:
 *
 * - **Reserva atómica todo-o-nada**: `tryReserveAll` o consigue TODAS las
 *   cantidades pedidas o no reserva NADA (nunca un inicio parcial).
 * - **Liberación**: `releaseAll(holder)` libera las reservas del titular en
 *   orden INVERSO de adquisición (como un stack de locks); cada liberación
 *   la registra quien la llama (el planificador de tareas).
 * - **Invariante**: `used <= capacity` en todo recurso, siempre; el pool la
 *   verifica en cada mutación y expone `checkInvariant()` para barridos.
 */

import { EngineError, EngineErrorCodes } from './errors'

/** Definición de un recurso. */
export interface ResourceDefinition {
  /** Identificador estable (p. ej. id de equipo o zona del dominio). */
  resourceId: string
  /** Capacidad total: entero >= 1 (capacidad 1 = exclusivo). */
  capacity: number
  /** Nombre visible (opcional). */
  name?: string
}

/** Una reserva concreta: titular + cantidad + instante simulado + orden global. */
export interface Reservation {
  readonly resourceId: string
  readonly holder: string
  readonly amount: number
  readonly at: number
  /** Orden global de adquisición (monótono del pool; para liberar LIFO). */
  readonly seq: number
}

/** Petición de reserva (cantidad por defecto 1). */
export interface ResourceRequest {
  resourceId: string
  amount?: number
}

/** Resultado de una reserva atómica. */
export type ReserveResult =
  | { ok: true; reservations: Reservation[] }
  | {
      ok: false
      code: 'resource_unavailable'
      resourceId: string
      needed: number
      available: number
      holders: string[]
    }

/** Estado observable de un recurso. */
export interface ResourceInfo {
  resourceId: string
  name?: string
  capacity: number
  used: number
  peakUsed: number
  totalReservations: number
  totalReleases: number
  holders: string[]
}

/** Pool de recursos con reserva/liberación atómicas y estadísticas. */
export class ResourcePool {
  private readonly recursos = new Map<
    string,
    {
      def: ResourceDefinition
      reservas: Reservation[]
      peakUsed: number
      totalReservations: number
      totalReleases: number
    }
  >()

  /** Registra un recurso (capacidad validada; id no duplicado). */
  register(def: ResourceDefinition): void {
    if (typeof def.resourceId !== 'string' || def.resourceId.length === 0) {
      throw new EngineError(
        EngineErrorCodes.resource_unknown,
        'resourceId inválido (cadena no vacía)',
      )
    }
    if (!Number.isInteger(def.capacity) || def.capacity < 1) {
      throw new EngineError(
        EngineErrorCodes.resource_capacity_invalid,
        'capacidad inválida: entero >= 1',
        {
          resourceId: def.resourceId,
          capacity: def.capacity,
        },
      )
    }
    if (this.recursos.has(def.resourceId)) {
      throw new EngineError(EngineErrorCodes.resource_unknown, 'recurso ya registrado', {
        resourceId: def.resourceId,
      })
    }
    this.recursos.set(def.resourceId, {
      def,
      reservas: [],
      peakUsed: 0,
      totalReservations: 0,
      totalReleases: 0,
    })
  }

  /** ¿Existe el recurso? */
  has(resourceId: string): boolean {
    return this.recursos.has(resourceId)
  }

  /** Cantidad actualmente reservada del recurso (0 si no existe). */
  used(resourceId: string): number {
    return this.recursos.get(resourceId)?.reservas.reduce((s, r) => s + r.amount, 0) ?? 0
  }

  /** Capacidad del recurso (0 si no existe). */
  capacity(resourceId: string): number {
    return this.recursos.get(resourceId)?.def.capacity ?? 0
  }

  /** Titulares actuales del recurso (ids de tarea). */
  holders(resourceId: string): string[] {
    return [...new Set(this.recursos.get(resourceId)?.reservas.map((r) => r.holder) ?? [])]
  }

  /** Estado observable completo de un recurso (undefined si no existe). */
  info(resourceId: string): ResourceInfo | undefined {
    const r = this.recursos.get(resourceId)
    if (!r) return undefined
    return {
      resourceId,
      name: r.def.name,
      capacity: r.def.capacity,
      used: this.used(resourceId),
      peakUsed: r.peakUsed,
      totalReservations: r.totalReservations,
      totalReleases: r.totalReleases,
      holders: this.holders(resourceId),
    }
  }

  /** Todos los recursos registrados con su estado. */
  snapshot(): ResourceInfo[] {
    return [...this.recursos.keys()].map((id) => this.info(id) as ResourceInfo)
  }

  private secuenciaReserva = 0

  /**
   * Reserva atómica de varias peticiones para un titular. Todo-o-nada:
   * si alguna petición no cabe, no se reserva nada y se devuelve el primer
   * recurso conflictivo con lo disponible y sus titulares actuales.
   */
  tryReserveAll(requests: ResourceRequest[], holder: string, at: number): ReserveResult {
    const reservas: Reservation[] = []
    for (const req of requests) {
      const info = this.recursos.get(req.resourceId)
      const amount = req.amount ?? 1
      if (!info) {
        this.deshacer(reservas)
        throw new EngineError(
          EngineErrorCodes.resource_unknown,
          'recurso desconocido al reservar',
          {
            resourceId: req.resourceId,
          },
        )
      }
      if (!Number.isInteger(amount) || amount < 1) {
        this.deshacer(reservas)
        throw new EngineError(
          EngineErrorCodes.reservation_amount_invalid,
          'cantidad a reservar inválida: entero >= 1',
          {
            resourceId: req.resourceId,
            amount,
          },
        )
      }
      const usado = info.reservas.reduce((s, r) => s + r.amount, 0)
      if (usado + amount > info.def.capacity) {
        this.deshacer(reservas)
        return {
          ok: false,
          code: 'resource_unavailable',
          resourceId: req.resourceId,
          needed: amount,
          available: info.def.capacity - usado,
          holders: [...new Set(info.reservas.map((r) => r.holder))],
        }
      }
      const reserva: Reservation = {
        resourceId: req.resourceId,
        holder,
        amount,
        at,
        seq: this.secuenciaReserva++,
      }
      info.reservas.push(reserva)
      reservas.push(reserva)
    }
    for (const r of reservas) {
      const info = this.recursos.get(r.resourceId)
      if (info) {
        info.totalReservations++
        const usado = info.reservas.reduce((s, x) => s + x.amount, 0)
        if (usado > info.peakUsed) info.peakUsed = usado
      }
    }
    return { ok: true, reservations: reservas }
  }

  /**
   * Libera TODAS las reservas del titular, en orden INVERSO de adquisición
   * (regla documentada de liberación de locks: LIFO por secuencia global).
   * Devuelve lo liberado en ese orden.
   */
  releaseAll(holder: string): Reservation[] {
    const propias: Reservation[] = []
    for (const info of this.recursos.values()) {
      const delTitular = info.reservas.filter((r) => r.holder === holder)
      info.reservas = info.reservas.filter((r) => r.holder !== holder)
      info.totalReleases += delTitular.length
      propias.push(...delTitular)
    }
    return propias.sort((a, b) => b.seq - a.seq)
  }

  /** Reservas vivas de un titular (en orden de adquisición). */
  reservationsOf(holder: string): Reservation[] {
    const propias: Reservation[] = []
    for (const info of this.recursos.values()) {
      for (const r of info.reservas) if (r.holder === holder) propias.push(r)
    }
    return propias.sort((a, b) => a.seq - b.seq)
  }

  /**
   * Barrido de la invariante `used <= capacity` en todos los recursos.
   * Lanza `EngineError` con código `reservation_exceeded` si algo viola.
   */
  checkInvariant(): void {
    for (const info of this.recursos.values()) {
      const usado = info.reservas.reduce((s, r) => s + r.amount, 0)
      if (usado > info.def.capacity) {
        throw new EngineError(
          EngineErrorCodes.reservation_exceeded,
          'invariante violada: uso supera la capacidad',
          { resourceId: info.def.resourceId, capacity: info.def.capacity, used: usado },
        )
      }
      for (const r of info.reservas) {
        if (!Number.isInteger(r.amount) || r.amount < 1) {
          throw new EngineError(
            EngineErrorCodes.reservation_amount_invalid,
            'reserva corrupta detectada',
            {
              resourceId: r.resourceId,
              holder: r.holder,
            },
          )
        }
      }
    }
  }

  /** Elimina todos los recursos y sus reservas (reset). */
  clear(): void {
    this.recursos.clear()
    this.secuenciaReserva = 0
  }

  private deshacer(reservas: Reservation[]): void {
    for (const r of reservas) {
      const info = this.recursos.get(r.resourceId)
      if (!info) continue
      const idx = info.reservas.indexOf(r)
      if (idx !== -1) info.reservas.splice(idx, 1)
    }
  }
}
