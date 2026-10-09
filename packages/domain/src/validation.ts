import { z } from 'zod'
import { ScenarioSchema, type Scenario } from './scenario'

/**
 * Validación con mensajes de error que incluyen la ruta exacta del campo
 * (requisito de FASE 02): "objects[2].position.x: debe ser un número finito".
 */

/** Un problema de validación con la ruta del campo ya formateada. */
export interface ValidationIssue {
  /** Ruta del campo, p. ej. "zones[1].bounds.min.x". */
  path: string
  /** Código del problema (zod). */
  code: string
  /** Mensaje legible en español. */
  message: string
}

/** Resultado de una validación: éxito con datos o fracaso con issues. */
export type ValidationResult<T> = { ok: true; data: T } | { ok: false; issues: ValidationIssue[] }

/** Formatea los segmentos de ruta de zod a notación de campo con índices. */
export function formatPath(segments: readonly (string | number | symbol)[]): string {
  if (segments.length === 0) {
    return '(raíz)'
  }
  let out = ''
  for (const segment of segments) {
    if (typeof segment === 'number') {
      out += `[${segment}]`
    } else {
      out += out === '' ? String(segment) : `.${String(segment)}`
    }
  }
  return out
}

/** Convierte un error de zod en issues con rutas formateadas. */
export function toValidationIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: formatPath(issue.path),
    code: issue.code,
    message: issue.message,
  }))
}

/** Valida cualquier esquema y devuelve ok/data u ok/issues con rutas. */
export function validate<S extends z.ZodType>(
  schema: S,
  input: unknown,
): ValidationResult<z.output<S>> {
  const result = schema.safeParse(input)
  if (result.success) {
    return { ok: true, data: result.data }
  }
  return { ok: false, issues: toValidationIssues(result.error) }
}

/** Valida un escenario completo (entrada típica: JSON ya parseado). */
export function validateScenario(input: unknown): ValidationResult<Scenario> {
  return validate(ScenarioSchema, input)
}

/** Error de validación con la lista de issues; el mensaje incluye las rutas. */
export class ScenarioValidationError extends Error {
  readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[]) {
    super(
      `Escenario inválido (${issues.length} problema${issues.length === 1 ? '' : 's'}):\n` +
        issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n'),
    )
    this.name = 'ScenarioValidationError'
    this.issues = issues
  }
}

/**
 * Valida un escenario o lanza `ScenarioValidationError` con todas las rutas
 * de campo en el mensaje.
 */
export function validateScenarioOrThrow(input: unknown): Scenario {
  const result = validateScenario(input)
  if (result.ok) {
    return result.data
  }
  throw new ScenarioValidationError(result.issues)
}
