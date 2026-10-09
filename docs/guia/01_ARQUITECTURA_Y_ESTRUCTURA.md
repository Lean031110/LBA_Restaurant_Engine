# Arquitectura y estructura prevista

## Principio central

La aplicación es un laboratorio virtual de operaciones, no un editor CAD genérico. Los datos del escenario son la fuente de verdad; los visores 2D y 3D son representaciones del mismo modelo. El motor debe seguir funcionando en pruebas sin navegador ni gráficos.

## Tecnologías seleccionadas

| Necesidad | Selección principal | Uso previsto | Alternativa/condición |
|---|---|---|---|
| Lenguaje | TypeScript | Dominio, motor, interfaz, pruebas | No usar Python como segundo motor. Puede servir para análisis puntual fuera del runtime, si se documenta. |
| Interfaz web | React + Vite | Aplicación local en navegador | Sin Tauri, APK ni instalador hasta después de fase 11. |
| Editor 2D | Konva + React Konva | Canvas, selección, zoom, arrastre, formas, objetos, capas | No usar PixiJS simultáneamente sin benchmark y ADR. |
| Editor de flujos | XYFlow (`@xyflow/react`) | Nodos/relaciones de tareas y recetas cuando llegue fase 5/6 | Persistir el flujo como datos JSON de dominio, no como estado interno exclusivo del editor. |
| Esquemas | Zod o validador compatible ya usado | Validar escenarios importados, recetas y propiedades | No duplicar validaciones inconexas. |
| Estado UI | Zustand, solo si simplifica el estado real | Selección, paneles, herramientas, controles | El estado de simulación no debe residir exclusivamente en Zustand/React. |
| Persistencia local | IndexedDB; Dexie opcional | Autosave local, escenarios guardados, versiones | Importar/exportar JSON siempre debe existir como salida portable. |
| Motor de simulación | Propio TypeScript | Eventos discretos, recursos, agentes, tareas, colas | SimPy puede servir como referencia conceptual, pero no debe duplicar el motor en Python. |
| Rutas 2D iniciales | A* en grid/grafo + reglas propias de reserva de paso | Desplazamiento simple y reproducible | Recast Navigation JS se evalúa solo si la calidad de A* es insuficiente. |
| Vista 3D futura | Three.js | Recorrer visualmente el estado 2D extruido/modelado | La vista 3D no decide tareas ni crea su propio reloj. |
| Test | Vitest + Playwright | Unitarios, integración y navegador | Acciones de CI deben adjuntar reportes al finalizar incluso si fallan. |
| CI | GitHub Actions | Validación de cada push/PR y artefactos | No usar Actions para fingir una ejecución local o para sustituir revisión. |

Las versiones deben elegirse en el inicio real de cada fase consultando la documentación oficial, con lockfile committed. No copiar comandos viejos de tutoriales sin comprobar compatibilidad.

## Estructura recomendada del repositorio

```text
LBA_Restaurant_Engine/
  apps/
    web/                         # React/Vite, layout, paneles y rutas de UI
  packages/
    domain/                      # tipos, IDs, unidades, esquemas de escenarios
    simulation-core/             # reloj, cola de eventos, stepping, semillas
    restaurant-model/            # pedidos, recetas, recursos, inventario, estaciones
    agent-decision/              # políticas, prioridades, reglas y trazas de agentes
    spatial/                     # geometría, obstáculos, rutas y congestión
    editor-2d/                   # herramientas y adaptadores de React Konva
    workflow-editor/             # nodos y enlaces de tareas mediante XYFlow
    view-3d/                     # escena de observación Three.js, fase 10
    analytics/                   # agregación de tiempos, colas y cuellos de botella
    persistence/                 # autosave, import/export, migraciones de escenarios
    asset-catalog/               # presets y metadatos de recursos visuales
  scenarios/
    starter/                     # escenario demostrativo versionado
    fixtures/                    # casos mínimos para pruebas deterministas
  tests/
    integration/
    e2e/
    performance/
  docs/
    architecture/
    evidence/
    decisions/                   # ADR-0001-....md
    third-party/
  assets/
    2d/
    3d/
    textures/
    audio/
    ATTRIBUTION.md
  .github/
    workflows/
  LICENSE
  THIRD_PARTY_NOTICES.md
  README.md
  package.json
  package-lock.json
  .nvmrc
```

No es obligatorio crear todos los directorios vacíos en fase 1. Crear un módulo solo cuando una fase lo necesite. La estructura anterior es un mapa de responsabilidades, no una excusa para generar docenas de archivos sin función.

## Límites de los módulos

- `domain` no importa framework visual ni APIs de navegador.
- `simulation-core` recibe comandos y modelo de dominio; emite eventos de simulación. No conoce las coordenadas en píxeles, solo unidades de mundo.
- `restaurant-model` expresa qué significa encender una plancha, reservar capacidad, preparar una receta, consumir stock o lavar un plato.
- `agent-decision` pide observaciones, propone acciones candidatas, verifica precondiciones y registra la regla por la que eligió una acción.
- `spatial` convierte geometría del escenario en un mapa transitable y calcula rutas; no decide si alguien debería atender un pedido.
- `editor-2d` transforma operaciones de usuario en comandos validados del modelo, con undo/redo.
- `view-3d` traduce el estado en meshes y animaciones visuales. No recalcula colas, temperaturas, trabajos ni tiempos.
- `analytics` consume el historial de eventos, no modifica el resultado de la simulación para que el informe “salga bonito”.
- `persistence` valida versión de formato, guarda, carga y migra proyectos sin perder datos silenciosamente.

## Modelo de escenarios

Cada escenario tendrá `schemaVersion`, unidades explícitas, identificación estable, catálogo de objetos, roles, flujos, recetas, equipos, parámetros de tiempos, llegada de clientes, semilla aleatoria y configuración de experimentos. Un archivo inválido debe producir un error comprensible y una ruta de campo; no debe romper toda la aplicación ni corregirse silenciosamente.

Las dimensiones del local se almacenan en metros o centímetros de mundo, nunca en píxeles de pantalla. Temperaturas en °C, tiempos en segundos, longitudes en metros, masas en kg/g y cantidades con unidad declarada. Las conversiones se hacen en un solo módulo y se prueban.

## Simulación y UI desacopladas

El motor ofrece comandos controlados como:
- `loadScenario`, `start`, `pause`, `stepOneEvent`, `runUntil`, `setSpeed`, `reset`;
- obtener estado de lectura, historial de eventos y métricas parciales;
- exportar un resumen reproducible de la ejecución.

El multiplicador de velocidad afecta la presentación, no la matemática del reloj. Una ejecución de 8 horas simuladas puede resolverse más rápido que 8 horas reales sin cambiar resultados. El motor no depende de `setInterval` para avanzar la hora simulada.

## Decisiones por ADR

Cualquier cambio en la selección de motor, formato de escenario, persistencia, sistema de coordenadas, librería de navegación o política de licencia requiere un ADR con alternativas, motivos, impactos y condición de revisión. No agregar una segunda tecnología gráfica grande sin evidencia de que resuelve un problema real.
