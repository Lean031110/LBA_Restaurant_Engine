import { describe, expect, it } from 'vitest'
import { emptyScenario } from './document'
import { nextObjectId, nextZoneId, slugify } from './ids'
import { WorldObjectIdSchema, ZoneIdSchema } from '@lba/domain'

describe('slugify a kebab-case ASCII', () => {
  it('normaliza diacríticos y separadores', () => {
    expect(slugify('Cocina Principal')).toBe('cocina-principal')
    expect(slugify('Zona VIP 2')).toBe('zona-vip-2')
    expect(slugify('Cafetería — Bar/Café')).toBe('cafeteria-bar-cafe')
  })

  it('textos vacíos o sin caracteres útiles caen a "x" (cuerpo mínimo 2)', () => {
    expect(slugify('')).toBe('x')
    expect(slugify('---')).toBe('x')
    expect(slugify('***')).toBe('x')
  })

  it('respeta la longitud máxima del cuerpo (64)', () => {
    expect(slugify('a'.repeat(200)).length).toBeLessThanOrEqual(64)
  })
})

describe('generación de IDs únicos', () => {
  it('produce IDs válidos según el esquema del dominio', () => {
    const scenario = emptyScenario()
    const id = nextObjectId(scenario, 'mesa-redonda-110')
    expect(() => WorldObjectIdSchema.parse(id)).not.toThrow()
    expect(id).toBe('obj_mesa-redonda-110')
  })

  it('deduplica con sufijo numérico ante colisiones', () => {
    const scenario = emptyScenario()
    const first = nextObjectId(scenario, 'mesa')
    const doc2 = {
      ...scenario,
      objects: [
        ...scenario.objects,
        {
          ...emptyScenario().objects[0]!,
          id: first,
        },
      ],
    }
    const second = nextObjectId(doc2, 'mesa')
    expect(second).toBe('obj_mesa-2')
  })

  it('IDs de zona siguen el mismo contrato', () => {
    const scenario = emptyScenario()
    const id = nextZoneId(scenario, 'cocina')
    expect(() => ZoneIdSchema.parse(id)).not.toThrow()
    expect(id).toBe('zone_cocina')
  })
})
