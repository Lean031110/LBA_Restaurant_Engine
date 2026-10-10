import { describe, expect, it } from 'vitest'
import { CatalogObjectPresetSchema, CatalogZonePresetSchema } from './preset'
import badId from './fixtures/invalid-preset-bad-id.json'
import badRange from './fixtures/invalid-preset-bad-range.json'
import futureVerifiedAt from './fixtures/invalid-preset-future-verified-at.json'
import interactionPointOut from './fixtures/invalid-preset-interaction-point-out.json'
import missingEquipmentKind from './fixtures/invalid-preset-missing-equipment-kind.json'
import negativeDimension from './fixtures/invalid-preset-negative-dimension.json'
import nonFiniteDimension from './fixtures/invalid-preset-nonfinite-dimension.json'
import unknownGroup from './fixtures/invalid-preset-unknown-group.json'
import zoneMissingAccessRule from './fixtures/invalid-zone-preset-missing-access-rule.json'

/**
 * Fixtures inválidos del catálogo: cada archivo contiene exactamente UNA
 * violación y las pruebas exigen la ruta de campo exacta del error, igual
 * que hace @lba/domain con scenarios/fixtures (mismo patrón de imports).
 */

function firstIssuePath(result: {
  success: boolean
  error?: { issues: { path: (string | number | symbol)[] }[] }
}): string {
  if (result.success || !result.error) {
    return '(sin error)'
  }
  return (result.error.issues[0]?.path ?? []).join('.')
}

describe('fixtures inválidos del catálogo', () => {
  it('invalid-preset-bad-id: ID sin prefijo cat_ con ruta id', () => {
    const result = CatalogObjectPresetSchema.safeParse(badId)
    expect(result.success).toBe(false)
    expect(firstIssuePath(result)).toBe('id')
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('cat_<kebab-case>')
    }
  })

  it('invalid-preset-bad-range: rango de % que contradice a la unidad, con rutas value y maxValue', () => {
    const result = CatalogObjectPresetSchema.safeParse(badRange)
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('parameters.occupancy.record.maxValue')
      expect(paths).toContain('parameters.occupancy.record.value')
    }
  })

  it('invalid-preset-future-verified-at: verifiedAt 2999-12-31 con ruta exacta', () => {
    const result = CatalogObjectPresetSchema.safeParse(futureVerifiedAt)
    expect(result.success).toBe(false)
    expect(firstIssuePath(result)).toBe('parameters.seats.record.verifiedAt')
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('futura')
    }
  })

  it('invalid-preset-interaction-point-out: punto a 5 m con ruta interactionPoint', () => {
    const result = CatalogObjectPresetSchema.safeParse(interactionPointOut)
    expect(result.success).toBe(false)
    expect(firstIssuePath(result)).toBe('interactionPoint')
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('m de la huella')
    }
  })

  it('invalid-preset-missing-equipment-kind: family equipment sin kind', () => {
    const result = CatalogObjectPresetSchema.safeParse(missingEquipmentKind)
    expect(result.success).toBe(false)
    expect(firstIssuePath(result)).toBe('equipmentKind')
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('family "equipment"')
    }
  })

  it('invalid-preset-negative-dimension: width -1 con ruta dimensions.width', () => {
    const result = CatalogObjectPresetSchema.safeParse(negativeDimension)
    expect(result.success).toBe(false)
    expect(firstIssuePath(result)).toBe('dimensions.width')
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('mayor que 0')
    }
  })

  it('invalid-preset-nonfinite-dimension: width 1e999 (Infinity) con ruta dimensions.width', () => {
    // zod 4 rechaza Infinity a nivel de tipo en z.number(): el mensaje es el
    // del chequeo de tipo ("received Infinity"), como en el dominio
    // (fixture invalid-nonfinite-position.json, fragmento "infinity").
    expect(nonFiniteDimension.dimensions.width).toBe(Number.POSITIVE_INFINITY)
    const result = CatalogObjectPresetSchema.safeParse(nonFiniteDimension)
    expect(result.success).toBe(false)
    expect(firstIssuePath(result)).toBe('dimensions.width')
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('Infinity')
    }
  })

  it('invalid-preset-unknown-group: grupo elevator con ruta group', () => {
    const result = CatalogObjectPresetSchema.safeParse(unknownGroup)
    expect(result.success).toBe(false)
    expect(firstIssuePath(result)).toBe('group')
  })

  it('invalid-zone-preset-missing-access-rule: accessRules vacío con ruta exacta', () => {
    const result = CatalogZonePresetSchema.safeParse(zoneMissingAccessRule)
    expect(result.success).toBe(false)
    expect(firstIssuePath(result)).toBe('accessRules')
  })
})
