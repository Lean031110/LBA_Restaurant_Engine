import { describe, expect, it } from 'vitest'
import { emptyScenario } from './document'
import {
  MemoryAutosaveStorage,
  autosaveKey,
  discardAutosave,
  formatLoadIssues,
  parseScenarioJson,
  readAutosave,
  serializeScenario,
  writeAutosave,
} from './persist'

describe('guardar escenario (serialización)', () => {
  it('serializa un escenario válido con el formato determinista de persistence', () => {
    const result = serializeScenario(emptyScenario())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const parsed = JSON.parse(result.json)
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.id).toBe('scn_local-nuevo')
    // La exportación es determinista: dos llamadas producen el mismo texto.
    const again = serializeScenario(emptyScenario())
    expect(again.ok && again.json).toBe(result.json)
  })

  it('rechaza guardar un escenario inválido (no escribe ficheros corruptos)', () => {
    const broken = { ...emptyScenario(), seed: -1 }
    const result = serializeScenario(broken as never)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toContain('no pasa la validación')
  })
})

describe('cargar escenario (canal de 6 etapas)', () => {
  it('acepta un JSON válido', () => {
    const json = serializeScenario(emptyScenario())
    expect(json.ok).toBe(true)
    if (!json.ok) return
    const result = parseScenarioJson(json.json)
    expect(result.ok).toBe(true)
  })

  it('rechaza JSON malformado con ruta exacta y sin mutar nada', () => {
    const result = parseScenarioJson('{ "id": scn_roto ')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues[0]!.path).toBe('(raíz)')
  })

  it('rechaza campos desconocidos (sin pérdida silenciosa)', () => {
    const json = JSON.stringify({ ...emptyScenario(), sorpresa: 1 })
    const result = parseScenarioJson(json)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.path === 'sorpresa')).toBe(true)
  })

  it('formatLoadIssues resume los problemas para el panel de estado', () => {
    const text = formatLoadIssues([
      { path: 'objects[0].dimensions.width', message: 'debe ser mayor que 0' },
      { path: 'seed', message: 'debe ser mayor o igual que 0' },
    ])
    expect(text).toContain('2 problemas')
    expect(text).toContain('objects[0].dimensions.width')
    expect(text).toContain('seed')
  })
})

describe('autosave local', () => {
  it('escribe y lee el autosave por id de escenario', () => {
    const storage = new MemoryAutosaveStorage()
    const scenario = emptyScenario()
    const serialized = serializeScenario(scenario)
    expect(serialized.ok).toBe(true)
    if (!serialized.ok) return

    writeAutosave(storage, scenario, serialized.json)
    expect(storage.getItem(autosaveKey('scn_local-nuevo'))).not.toBeNull()

    const restored = readAutosave(storage, 'scn_local-nuevo')
    expect(restored).not.toBeNull()
    expect(restored!.id).toBe('scn_local-nuevo')
  })

  it('descartar elimina el autosave', () => {
    const storage = new MemoryAutosaveStorage()
    const scenario = emptyScenario()
    const serialized = serializeScenario(scenario)
    expect(serialized.ok).toBe(true)
    if (!serialized.ok) return
    writeAutosave(storage, scenario, serialized.json)
    discardAutosave(storage, scenario.id)
    expect(readAutosave(storage, scenario.id)).toBeNull()
  })

  it('un autosave corrupto se ignora sin lanzar (los errores no rompen el arranque)', () => {
    const storage = new MemoryAutosaveStorage()
    storage.setItem(autosaveKey('scn_local-nuevo'), '{no es json')
    expect(readAutosave(storage, 'scn_local-nuevo')).toBeNull()
  })

  it('sin autosave previo devuelve null', () => {
    expect(readAutosave(new MemoryAutosaveStorage(), 'scn_inexistente')).toBeNull()
  })
})
