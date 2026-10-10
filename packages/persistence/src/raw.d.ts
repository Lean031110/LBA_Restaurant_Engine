/**
 * Declaración de tipos para los imports ?raw de vitest/vite: importar el
 * CONTENIDO textual de un archivo (usado para alimentar loadScenarioJson con
 * los fixtures de scenarios/fixtures sin re-serializarlos, preservando
 * literales como 1e999 que JSON.stringify convertiría en null).
 */
declare module '*?raw' {
  const content: string
  export default content
}
