import { describe, expect, it } from 'vitest'
import { exportScenario, loadScenarioJson } from '@lba/persistence'
import type { ScenarioLoadResult } from '@lba/persistence'
import { buildIntegrationScenario } from './helpers'
import type { Scenario } from '@lba/domain'

/**
 * Rutas de FALLO del flujo integrado (mandato del cierre de FASE 02):
 * escenarios inválidos y migraciones fallidas, cada uno con la ruta de campo
 * exacta que exige el contrato. Todas las mutaciones parten del escenario
 * válido construido desde el catálogo, exactamente como haría el editor
 * con datos corruptos: el canal de importación debe rechazarlos sin dañar
 * el escenario actual.
 */

const scenario: Scenario = buildIntegrationScenario()
const goodExport: string = exportScenario(scenario)

type Plain = Record<string, unknown>

function textMutating(mutate: (plain: Plain) => void): string {
  const plain = JSON.parse(JSON.stringify(scenario)) as Plain
  mutate(plain)
  return JSON.stringify(plain)
}

function objectsOf(plain: Plain): Plain[] {
  return plain.objects as Plain[]
}

function templatesOf(plain: Plain): Plain[] {
  return plain.taskTemplates as Plain[]
}

// --- Mutadores: cada uno produce el texto JSON de un escenario inválido ---

function textWithDuplicateIds(): string {
  return textMutating((plain) => {
    const objects = objectsOf(plain)
    const first = objects[0] as Plain
    // Misma ID, contenido distinto: la unicidad es por ID, no por identidad.
    objects.push({ ...first, position: { x: 9.9, y: 9.9 } })
  })
}

function textWithBrokenZoneReference(): string {
  return textMutating((plain) => {
    const first = objectsOf(plain)[0] as Plain
    first.zoneId = 'zone_fantasma'
  })
}

function textWithDependencyCycle(): string {
  return textMutating((plain) => {
    const templates = templatesOf(plain)
    const second: Plain = {
      id: 'task_limpieza-post-cierre',
      name: 'Limpieza post cierre',
      preconditions: [],
      steps: [{ name: 'Recoger y lavar', parallelizable: true }],
      dependencies: ['task_cocinar-plancha'],
      requiredResourceIds: [],
      effects: [],
      priority: 10,
    }
    templates.push(second)
    ;(templates[0] as Plain).dependencies = ['task_limpieza-post-cierre']
  })
}

function textWithInvalidOverride(): string {
  return textMutating((plain) => {
    const parameters = plain.parameters as Plain
    const cleaning = parameters.cleaningSeconds as Plain
    cleaning.scenarioOverrideValue = 9999
  })
}

function textWithVersion(version: number): string {
  return textMutating((plain) => {
    plain.schemaVersion = version
  })
}

function textWithUnknownField(): string {
  return textMutating((plain) => {
    const first = objectsOf(plain)[0] as Plain
    first.custom = 'dato que el contrato v1 no define'
  })
}

function expectFailure(
  result: ScenarioLoadResult,
): asserts result is { ok: false; issues: import('@lba/domain').ValidationIssue[] } {
  if (result.ok) {
    throw new Error('la carga debía fallar y tuvo éxito')
  }
}

describe('escenarios inválidos — el canal de importación los rechaza con rutas exactas', () => {
  it('IDs duplicados: la ruta apunta al duplicado (segunda aparición)', () => {
    const result = loadScenarioJson(textWithDuplicateIds())
    expectFailure(result)
    const duplicateIndex = scenario.objects.length
    const issue = result.issues.find((i) => i.path === `objects[${duplicateIndex}].id`)
    expect(issue, JSON.stringify(result.issues.map((i) => i.path))).toBeDefined()
    expect(issue?.message).toContain('ID duplicado')
    expect(issue?.message).toContain('obj_table-round-4-a')
  })

  it('referencia rota de zona: código broken_reference y mensaje con la zona inexistente', () => {
    const result = loadScenarioJson(textWithBrokenZoneReference())
    expectFailure(result)
    const issue = result.issues.find((i) => i.path === 'objects[0].zoneId')
    expect(issue, JSON.stringify(result.issues.map((i) => i.path))).toBeDefined()
    expect(issue?.code).toBe('broken_reference')
    expect(issue?.message).toContain('zoneId "zone_fantasma" no existe en zones')
  })

  it('ciclo de dependencias: ruta de dependencies y ciclo completo en el mensaje', () => {
    const result = loadScenarioJson(textWithDependencyCycle())
    expectFailure(result)
    const issue = result.issues.find((i) => i.path === 'taskTemplates[0].dependencies')
    expect(issue, JSON.stringify(result.issues.map((i) => i.path))).toBeDefined()
    expect(issue?.code).toBe('broken_reference')
    expect(issue?.message).toContain('ciclo de dependencias detectado')
    expect(issue?.message).toContain('task_cocinar-plancha')
    expect(issue?.message).toContain('task_limpieza-post-cierre')
  })

  it('override de escenario fuera del rango declarado: ruta del campo exacta', () => {
    const result = loadScenarioJson(textWithInvalidOverride())
    expectFailure(result)
    const issue = result.issues.find(
      (i) => i.path === 'parameters.cleaningSeconds.scenarioOverrideValue',
    )
    expect(issue, JSON.stringify(result.issues.map((i) => i.path))).toBeDefined()
    expect(issue?.message).toBe('scenarioOverrideValue supera el maxValue declarado')
  })
})

describe('migraciones fallidas — la puerta de versiones las explica', () => {
  it('versión antigua (0): cadena vacía, v1 es la primera del formato', () => {
    const result = loadScenarioJson(textWithVersion(0))
    expectFailure(result)
    expect(result.issues.map((i) => i.path)).toContain('schemaVersion')
    const issue = result.issues.find((i) => i.path === 'schemaVersion')
    expect(issue?.code).toBe('unsupported_version')
    expect(issue?.message).toContain('cadena de migraciones está vacía')
    expect(issue?.message).toContain('primera del formato')
  })

  it('versión futura (2): posterior a la soportada', () => {
    const result = loadScenarioJson(textWithVersion(2))
    expectFailure(result)
    const issue = result.issues.find((i) => i.path === 'schemaVersion')
    expect(issue?.code).toBe('unsupported_version')
    expect(issue?.message).toContain('posterior a la soportada')
  })
})

describe('no pérdida silenciosa — campos desconocidos nunca se descartan', () => {
  it('un campo desconocido en un objeto se rechaza con su ruta', () => {
    const result = loadScenarioJson(textWithUnknownField())
    expectFailure(result)
    const issue = result.issues.find((i) => i.path === 'objects[0].custom')
    expect(issue, JSON.stringify(result.issues.map((i) => i.path))).toBeDefined()
    expect(issue?.code).toBe('unknown_field')
    expect(issue?.message).toContain('campo desconocido en "objects[0].custom"')
  })
})

describe('pureza — ningún fallo daña el escenario actual ni la entrada buena', () => {
  it('todas las cargas fallidas dejan intacto el escenario y la exportación buena', () => {
    const firstGood = loadScenarioJson(goodExport)
    if (!firstGood.ok) throw new Error('la exportación buena debía cargar')
    const snapshot = JSON.parse(JSON.stringify(scenario)) as Plain

    const failingTexts: { label: string; text: string }[] = [
      { label: 'duplicados', text: textWithDuplicateIds() },
      { label: 'referencia rota', text: textWithBrokenZoneReference() },
      { label: 'ciclo', text: textWithDependencyCycle() },
      { label: 'override inválido', text: textWithInvalidOverride() },
      { label: 'versión antigua', text: textWithVersion(0) },
      { label: 'versión futura', text: textWithVersion(2) },
      { label: 'campo desconocido', text: textWithUnknownField() },
    ]
    for (const failing of failingTexts) {
      const result = loadScenarioJson(failing.text)
      expect(result.ok, failing.label).toBe(false)
    }

    // El escenario original no fue tocado por ninguna carga fallida.
    expect(scenario).toEqual(snapshot)
    // La entrada buena sigue cargando y produce exactamente los mismos datos.
    const secondGood = loadScenarioJson(goodExport)
    expect(secondGood.ok).toBe(true)
    if (secondGood.ok) {
      expect(secondGood.data).toEqual(firstGood.data)
    }
  })
})
