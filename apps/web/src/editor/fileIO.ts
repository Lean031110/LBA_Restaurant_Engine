/**
 * Operaciones de fichero del editor (guardar/cargar JSON), compartidas por
 * la barra superior y los atajos Ctrl+S / Ctrl+O. Todo es local: descarga
 * de un Blob y lectura de File (regla 9: sin servidor ni APIs externas).
 */
import type { EditorStore } from '@lba/editor-2d'
import { parseScenarioJson, serializeScenario } from '@lba/editor-2d'

/** Guarda el escenario actual como fichero JSON determinista (descarga). */
export function saveScenarioFile(store: EditorStore): void {
  const result = serializeScenario(store.getState().document.scenario)
  if (!result.ok) {
    store.pushMessage('error', result.error)
    return
  }
  const blob = new Blob([result.json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const safeName = store
    .getState()
    .document.scenario.id.replace(/^scn_/, '')
    .replace(/[^a-z0-9-]/gi, '-')
  anchor.href = url
  anchor.download = `${safeName}.json`
  anchor.click()
  URL.revokeObjectURL(url)
  store.pushMessage('info', `Escenario guardado como ${safeName}.json.`)
}

/** Carga un fichero JSON como escenario; los errores no tocan el plano actual. */
export async function loadScenarioFile(store: EditorStore, file: File): Promise<void> {
  try {
    const text = await file.text()
    const result = parseScenarioJson(text)
    if (result.ok) {
      store.loadScenario(result.data, 'Escenario cargado')
    } else {
      const shown = result.issues
        .slice(0, 3)
        .map((i) => `${i.path}: ${i.message}`)
        .join(' · ')
      store.pushMessage(
        'error',
        `El fichero no es un escenario válido (${result.issues.length} problemas): ${shown}${result.issues.length > 3 ? '…' : ''}. El plano actual NO se ha modificado.`,
      )
    }
  } catch (error) {
    store.pushMessage('error', `No se pudo leer el fichero: ${String(error)}`)
  }
}
