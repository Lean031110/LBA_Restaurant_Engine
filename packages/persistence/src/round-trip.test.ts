import { describe, expect, it } from 'vitest'
import { exportScenario, loadScenarioJson } from './json'
import validMinimalText from '../../../scenarios/fixtures/valid-minimal.json?raw'
import validCompleteText from '../../../scenarios/fixtures/valid-complete.json?raw'

/**
 * Auditoría de salida de FASE 02 (prompt 02.4): serialización/deserialización
 * con ida y vuelta preservando TODAS las propiedades del contrato, incluido
 * el canal de extensión sancionado en v1: WorldObject.properties (pliegue
 * avanzado de la UI) y Scenario.parameters (parámetros globales con override).
 */

function roundTrip(text: string): ReturnType<typeof loadScenarioJson> {
  const first = loadScenarioJson(text)
  if (!first.ok) {
    return first
  }
  return loadScenarioJson(exportScenario(first.data))
}

describe('ida y vuelta — fixtures válidos del repositorio', () => {
  const fixtures: { name: string; text: string }[] = [
    { name: 'valid-minimal.json', text: validMinimalText },
    { name: 'valid-complete.json', text: validCompleteText },
  ]

  for (const fixture of fixtures) {
    it(`${fixture.name}: cargar → exportar → cargar devuelve un escenario profundo-igual`, () => {
      const first = loadScenarioJson(fixture.text)
      expect(first.ok, `${fixture.name} debería cargar`).toBe(true)
      const second = roundTrip(fixture.text)
      expect(second.ok, 'la exportación debería recargar').toBe(true)
      if (first.ok && second.ok) {
        expect(second.data).toEqual(first.data)
      }
    })
  }
})

describe('ida y vuelta — preservación de propiedades por contrato', () => {
  it('WorldObject.properties (pliegue avanzado) sobrevive intacto', () => {
    const result = roundTrip(validCompleteText)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // obj_mesa-01 (índice 3) declara properties { sillas: 4 }.
    const mesa = result.data.objects.find((o) => o.id === 'obj_mesa-01')
    expect(mesa?.properties).toEqual({ sillas: 4 })
    // obj_puerta-cocina declara { sentido: 'doble' }.
    const puerta = result.data.objects.find((o) => o.id === 'obj_puerta-cocina')
    expect(puerta?.properties).toEqual({ sentido: 'doble' })
  })

  it('Scenario.parameters con override sobrevive exactamente', () => {
    const result = roundTrip(validCompleteText)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.parameters['demanda-por-hora']).toEqual({
      value: 18,
      unit: 'persons',
      sourceType: 'estimated',
      confidence: 'low',
      assumptions: 'hora punta estimada por el usuario',
      scenarioOverrideValue: 22,
    })
  })

  it('los campos opcionales declarados se preservan (description, name, material)', () => {
    const result = roundTrip(validCompleteText)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.description).toBe(
      'Pizzería-bar pequeña con cocina, salón, puerta, paredes y pedidos',
    )
    const mesa = result.data.objects.find((o) => o.id === 'obj_mesa-01')
    expect(mesa?.name).toBe('Mesa 01')
    expect(mesa?.material).toBe('madera')
    expect(mesa?.color).toBe('#8B5A2B')
    expect(mesa?.capacity).toBe(4)
  })

  it('las huellas poligonales (footprint) se preservan punto a punto', () => {
    const result = roundTrip(validCompleteText)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const mesa = result.data.objects.find((o) => o.id === 'obj_mesa-01')
    expect(mesa?.footprint).toEqual([
      { x: 1.4, y: 2.6 },
      { x: 2.6, y: 2.6 },
      { x: 2.6, y: 3.4 },
      { x: 1.4, y: 3.4 },
    ])
  })

  it('la semilla y la geometría del mundo se preservan', () => {
    const result = roundTrip(validCompleteText)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.seed).toBe(7)
    expect(result.data.world).toEqual({
      lengthUnit: 'm',
      size: { width: 14, depth: 10 },
    })
  })
})

describe('extensibilidad — el contrato explícito de v1', () => {
  it('el canal sancionado son WorldObject.properties: acepta primitivos validados', () => {
    // El contrato permite propiedades editables adicionales (número, cadena
    // no vacía, booleano) dentro de objects[*].properties: llegan al
    // escenario validado y sobreviven a la exportación.
    const base = JSON.parse(validCompleteText) as {
      objects: Record<string, unknown>[]
    }
    const objects = [...base.objects]
    objects[0] = { ...objects[0], properties: { avanzada: 42, texto: 'ok', flag: true } }
    const result = loadScenarioJson(JSON.stringify({ ...base, objects }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const pared = result.data.objects.find((o) => o.id === 'obj_pared-norte')
    expect(pared?.properties).toEqual({ avanzada: 42, texto: 'ok', flag: true })
    const again = loadScenarioJson(exportScenario(result.data))
    expect(again.ok).toBe(true)
    if (again.ok) {
      const paredOtraVez = again.data.objects.find((o) => o.id === 'obj_pared-norte')
      expect(paredOtraVez?.properties).toEqual({ avanzada: 42, texto: 'ok', flag: true })
    }
  })

  it('los campos desconocidos FUERA del canal sancionado se rechazan (nunca se descartan)', () => {
    const base = JSON.parse(validCompleteText) as Record<string, unknown>
    const result = loadScenarioJson(JSON.stringify({ ...base, experimental: 1 }))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.map((i) => i.path)).toEqual(['experimental'])
      expect(result.issues[0]?.message).toContain('no se descarta en silencio')
    }
  })
})
