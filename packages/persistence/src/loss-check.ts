import type { ValidationIssue } from '@lba/domain'

/**
 * Comprobación de pérdida silenciosa (prompts 02.3/02.4): nada se descarta
 * sin decirlo. Zod "strip" elimina las claves que no están en el esquema; el
 * contrato exige que un campo desconocido se trate de forma EXPLÍCITA.
 *
 * Estrategia: comparar la ENTRADA sin tocar contra la SALIDA validada. Toda
 * clave de la entrada que no exista en la salida (a la misma ruta) es un
 * campo desconocido que zod habría descartado en silencio: se reporta como
 * error con su ruta exacta y la carga se rechaza.
 *
 * Las claves de la salida que no están en la entrada (campos opcionales
 * ausentes) son legítimas y no se reportan: la dirección de la comparación
 * es entrada → salida, nunca al revés.
 */

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatSegment(segment: string | number, prefix: string): string {
  if (prefix === '') {
    return typeof segment === 'number' ? `[${segment}]` : String(segment)
  }
  return typeof segment === 'number' ? `${prefix}[${segment}]` : `${prefix}.${segment}`
}

/**
 * Recorre la entrada junto a la salida validada y acumula las rutas de las
 * claves presentes en la entrada y ausentes en la salida (campos que se
 * habrían descartado en silencio). Devuelve las rutas formateadas, p. ej.
 * "world.extra" u "objects[2].customField".
 */
export function collectUnknownFields(input: unknown, parsed: unknown): string[] {
  const paths: string[] = []

  function walk(inputValue: unknown, parsedValue: unknown, prefix: string): void {
    if (Array.isArray(inputValue)) {
      const parsedArray = Array.isArray(parsedValue) ? parsedValue : []
      inputValue.forEach((item, index) => {
        walk(item, parsedArray[index] ?? null, formatSegment(index, prefix))
      })
      return
    }
    if (isPlainObject(inputValue)) {
      const parsedObject = isPlainObject(parsedValue) ? parsedValue : {}
      for (const key of Object.keys(inputValue)) {
        const nextPrefix = formatSegment(key, prefix)
        if (!(key in parsedObject)) {
          paths.push(nextPrefix)
          continue
        }
        walk(inputValue[key], parsedObject[key], nextPrefix)
      }
    }
    // Los primitivos no tienen claves: nada que comprobar.
  }

  walk(input, parsed, '')
  return paths
}

/** Convierte las rutas de campos desconocidos en issues de validación. */
export function unknownFieldIssues(paths: readonly string[]): ValidationIssue[] {
  return paths.map((path) => ({
    path,
    code: 'unknown_field',
    message: `campo desconocido en "${path}": el contrato de schemaVersion 1 no lo define y no se descarta en silencio (regla de no pérdida). Si necesitas ese dato, propónlo para una versión futura del esquema`,
  }))
}
