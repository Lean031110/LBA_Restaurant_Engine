# Mapa de módulos y responsabilidades

Extracto operativo de `docs/guia/01_ARQUITECTURA_Y_ESTRUCTURA.md`. Define la estructura objetivo del repositorio. **Regla:** crear un módulo solo cuando una fase lo necesite; no generar directorios vacíos por adelantado.

## Estructura prevista

```text
LBA_Restaurant_Engine/
  apps/
    web/                         # React/Vite: layout, paneles y rutas de UI
  packages/
    domain/                      # tipos, IDs, unidades, esquemas de escenarios
    simulation-core/             # reloj, cola de eventos, stepping, semillas
    restaurant-model/            # pedidos, recetas, recursos, inventario, estaciones
    agent-decision/              # políticas, prioridades, reglas y trazas de agentes
    spatial/                     # geometría, obstáculos, rutas y congestión
    editor-2d/                   # herramientas y adaptadores de React Konva
    workflow-editor/             # nodos y enlaces de tareas mediante XYFlow
    view-3d/                     # escena de observación Three.js (fase 10)
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
    guia/                        # guía maestra íntegra (no modificar)
    architecture/
    evidence/
    decisions/                   # ADR-0001-....md
    third-party/
  assets/
    2d/ 3d/ textures/ audio/
    ATTRIBUTION.md
  .github/workflows/
  LICENSE  THIRD_PARTY_NOTICES.md  README.md
  package.json  package-lock.json  .nvmrc
```

## Límites de responsabilidad por módulo

| Módulo             | Responsabilidad                                                                                     | Prohibido                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `domain`           | Tipos, IDs, unidades, esquemas de escenarios                                                        | Importar framework visual o APIs de navegador                              |
| `simulation-core`  | Recibe comandos y modelo; emite eventos de simulación. Reloj propio, unidades de mundo              | Conocer píxeles; depender de `setInterval` como reloj del dominio          |
| `restaurant-model` | Semántica de encender una plancha, reservar capacidad, preparar receta, consumir stock, lavar plato | Lógica de UI                                                               |
| `agent-decision`   | Observa, propone acciones candidatas, verifica precondiciones, registra regla elegida               | Llamar a un LLM remoto por decisión                                        |
| `spatial`          | Convierte geometría en mapa transitable; calcula rutas                                              | Decidir quién atiende un pedido                                            |
| `editor-2d`        | Traduce operaciones de usuario en comandos validados, con undo/redo                                 | Contener lógica central de simulación                                      |
| `workflow-editor`  | Editar flujos como grafos de datos de dominio                                                       | Guardar el flujo solo como estado interno del editor                       |
| `view-3d`          | Traduce estado en meshes y animaciones visuales                                                     | Recalcular colas, temperaturas, trabajos ni tiempos; crear su propio reloj |
| `analytics`        | Consume el historial de eventos y agrega métricas                                                   | Modificar el resultado de la simulación                                    |
| `persistence`      | Valida versión de formato, guarda, carga y migra proyectos                                          | Perder datos silenciosamente                                               |

## Estado de creación de módulos

| Módulo                      | Fase que lo crea | Estado real                                                                            |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `apps/web`                  | 01               | Creado (FASE 01, integrado en `b7fe430`)                                               |
| `packages/domain`           | 02 (02.1)        | Creado (02.1 integrado en `97bb93b`; correctiva 02.1-b/c pendiente de publicación)     |
| `packages/asset-catalog`    | 02 (02.2)        | Creado (48 presets + iconos originales; pendiente de publicación)                      |
| `packages/persistence`      | 02 (02.3)        | Creado (import/export de 6 etapas, migraciones, referencias; pendiente de publicación) |
| `scenarios/fixtures`        | 02 (02.1)        | Creado (2 válidos + 7 inválidos)                                                       |
| `tests/integration`         | 02 (cierre)      | Creado (flujo completo catálogo→dominio→persistence; pendiente de publicación)         |
| `.github/workflows`         | 01               | Creado (CI con evidencias; integrado desde FASE 01)                                    |
| `scenarios/starter`         | 03+              | No creado a propósito (regla: crear solo cuando la fase lo necesite)                   |
| `packages/simulation-core`  | 04               | No creado a propósito                                                                  |
| `packages/restaurant-model` | 05               | No creado a propósito                                                                  |
| `packages/agent-decision`   | 06               | No creado a propósito                                                                  |
| `packages/spatial`          | 07               | No creado a propósito                                                                  |
| `packages/editor-2d`        | 03               | No creado a propósito                                                                  |
| `packages/workflow-editor`  | 06               | No creado a propósito                                                                  |
| `packages/view-3d`          | 10               | No creado a propósito                                                                  |
| `packages/analytics`        | 09               | No creado a propósito                                                                  |

La tabla anterior describe el **estado real del repositorio** en el cierre de FASE 02; se actualiza al crear cada módulo. Los directorios `tests/e2e` y `tests/performance` de la estructura objetivo aún no existen: se crearán cuando su fase lo necesite.

## Comandos del motor hacia la UI (contrato futuro)

- `loadScenario`, `start`, `pause`, `stepOneEvent`, `runUntil`, `setSpeed`, `reset`.
- Estado de lectura, historial de eventos y métricas parciales.
- Exportación de un resumen reproducible de la ejecución (semilla, hash de escenario, versión del motor).

El multiplicador de velocidad afecta la presentación, no la matemática del reloj.
