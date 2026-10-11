/**
 * Declaración de tipos para los imports ?raw de vitest/vite: importar el
 * CONTENIDO textual de un archivo (usado para alimentar loadScenarioJson con
 * los fixtures de scenarios/fixtures sin re-serializarlos). Mismo patrón que
 * packages/persistence/src/raw.d.ts.
 */
declare module '*?raw' {
  const content: string
  export default content
}
