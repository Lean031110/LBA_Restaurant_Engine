# LBA_Restaurant_Engine — guía consolidada de desarrollo

> Copia los prompts directamente desde este documento o desde el archivo individual de la fase correspondiente. Ejecuta solo un prompt numerado por interacción. Los archivos de fase individuales incluidos en este paquete siguen siendo la fuente operativa más cómoda para Codex.



---

<!-- BEGIN FILE: README.md -->

# LBA_Restaurant_Engine — paquete maestro de desarrollo

**Objetivo:** construir un simulador de operaciones de restaurante, gratuito, de código abierto, centrado primero en un editor 2D y en un motor de simulación reproducible. La vista 3D será una forma secundaria de observar la misma simulación, no un segundo motor independiente.

> **Regla de oro:** una fase no se considera terminada porque la IA afirme que lo está. Se cierra únicamente cuando el código, las pruebas, GitHub Actions, los logs y las evidencias verificables cumplen los criterios de ese archivo.

## Empieza aquí, en este orden

1. Lee `00_PROMPT_MAESTRO_CODEX.md` y pégalo una sola vez como instrucciones iniciales del agente de programación.
2. Lee `01_ARQUITECTURA_Y_ESTRUCTURA.md`, `02_RECURSOS_LICENCIAS_Y_PARAMETROS.md`, `03_GITHUB_ACTIONS_LOGS_EVIDENCIAS.md` y `04_CONTRATO_DE_SIMULACION_Y_DATOS.md`. Son reglas permanentes; no son fases que se puedan saltar.
3. Empieza por `FASES/FASE_00_DESCUBRIMIENTO_Y_CONTRATO.md`. Copia un prompt por interacción, espera la respuesta, revisa resultados y solo después ejecuta el siguiente prompt del mismo archivo.
4. No empieces una fase siguiente hasta marcar todos los puntos de salida de la fase actual. Si un punto falla, vuelve a corregir la fase abierta.
5. Cuando Codex entregue su informe, usa `05_FLUJO_DE_REVISION_CON_CHATGPT.md` para enviarme el informe, enlace del commit/PR y enlace de GitHub Actions. Yo contrastaré sus afirmaciones con el plan y la evidencia que compartas; no tomaré el texto del agente como prueba suficiente.

## Índice de archivos

| Archivo | Para qué sirve |
|---|---|
| `00_PROMPT_MAESTRO_CODEX.md` | Prompt global: reglas que gobiernan todo el proyecto y todas las fases. |
| `01_ARQUITECTURA_Y_ESTRUCTURA.md` | Arquitectura técnica, módulos, responsabilidades y estructura prevista del repositorio. |
| `02_RECURSOS_LICENCIAS_Y_PARAMETROS.md` | Librerías reutilizables, fuentes oficiales, licencias, política de activos y valores de simulación. |
| `03_GITHUB_ACTIONS_LOGS_EVIDENCIAS.md` | CI, logs, artefactos de prueba, evidencias y cómo comprobar el trabajo. |
| `04_CONTRATO_DE_SIMULACION_Y_DATOS.md` | Modelo conceptual y reglas del motor, personas, equipos, tareas, pedidos y tiempos. |
| `05_FLUJO_DE_REVISION_CON_CHATGPT.md` | Cómo presentar cada entrega para auditoría externa y cómo responder ante fallos. |
| `FUENTES/RECURSOS_VERIFICADOS.md` | Enlaces oficiales y notas de investigación, verificados el 9 de octubre de 2026. |
| `FUENTES/DECISIONES_DE_LICENCIA.md` | Decisiones de licencia y límites reales de la atribución. |
| `FASES/FASE_00_...md` a `FASE_11_...md` | Una fase por archivo, con prompts para varias interacciones, checklist y condición de salida. |
| `PLANTILLAS/CIERRE_DE_FASE.md` | Formato obligatorio para informar el cierre de una fase. |
| `PLANTILLAS/REGISTRO_DE_PARAMETRO.md` | Ficha para tiempos, temperatura, capacidad y supuestos. |
| `PLANTILLAS/INCIDENCIA.md` | Plantilla para errores reproducibles. |
| `PLANTILLAS/MENSAJE_PARA_REVISION.md` | Mensaje que se puede copiar en ChatGPT para auditar una entrega. |

## Mapa de fases

| Fase | Archivo | Resultado verificable |
|---|---|---|
| 00 | `FASE_00_DESCUBRIMIENTO_Y_CONTRATO.md` | Repositorio inspeccionado, alcance cerrado, riesgos y plan acordados. |
| 01 | `FASE_01_BASE_TECNICA_CI_LOGS.md` | Web local ejecutable, estructura, logging y CI inicial. |
| 02 | `FASE_02_MODELO_DATOS_CATALOGO.md` | Modelo de dominio validado y catálogo de objetos predefinidos. |
| 03 | `FASE_03_EDITOR_2D.md` | Editor 2D práctico con paredes, puertas, equipos y propiedades. |
| 04 | `FASE_04_MOTOR_SIMULACION.md` | Motor determinista de eventos, reloj, pausa, avance y recursos. |
| 05 | `FASE_05_EQUIPOS_RECETAS_INVENTARIO.md` | Equipos, recetas, tareas, capacidad, existencias y tiempos configurables. |
| 06 | `FASE_06_AGENTES_DECISIONES_FLUJOS.md` | Personas con reglas propias, flujos por rol y registro visible de próxima acción. |
| 07 | `FASE_07_MOVILIDAD_CONGESTION.md` | Rutas, obstáculos, zonas, colisiones y congestión básica en 2D. |
| 08 | `FASE_08_CLIENTES_ROLES_OPERACION.md` | Clientes, salón, cocina, pizzería, bar, fregado, limpieza y asistencia entre roles. |
| 09 | `FASE_09_METRICAS_EXPERIMENTOS.md` | Cuellos de botella, estadísticas, escenarios comparables y recomendaciones. |
| 10 | `FASE_10_VISTA_3D.md` | Vista 3D de observación conectada al mismo estado de simulación. |
| 11 | `FASE_11_QA_FINAL_Y_ENTREGA.md` | Auditoría funcional completa, documentación de uso y primera versión web reproducible. |

## Alcance inicial y exclusiones deliberadas

- **Ahora:** código web ejecutable localmente con Node.js, sin servidor comercial, sin cuenta de pago y sin dependencia de Internet durante la ejecución de la aplicación. Internet sí puede ser necesario para instalar dependencias o consultar fuentes.
- **Primero 2D:** editor y simulación se construyen y validan en 2D. El programa debe funcionar aunque la vista 3D esté desactivada.
- **3D después:** vista para inspeccionar la escena desde varios ángulos y seguir la simulación; no se crea un segundo sistema de datos o de reglas.
- **Fuera de las primeras fases:** APK, instalador Windows, app nativa Linux, móvil Android, multijugador, sincronización en la nube y sensores físicos. Solo se consideran después de aprobar la fase 11.
- **Sin IA externa obligatoria:** los agentes son reglas, máquinas de estados y planificación explicable implementadas localmente. No llamar a una API de IA por cada movimiento.
- **Simulación, no certificado de realidad:** los tiempos iniciales son aproximaciones editables. Una simulación puede estimar congestión y colas, pero no demuestra por sí sola que una cocina real sea segura, higiénica o reglamentaria.

## Qué hacer si la IA dice que terminó, pero falta evidencia

No avanzar de fase. Pedir el archivo faltante, el comando exacto de prueba, el enlace a la ejecución de Actions, el SHA del commit y los artefactos. Si una ejecución no existe o no puede abrirse, marcar el punto como `NO VERIFICADO`, no como aprobado.


<!-- END FILE: README.md -->


---

<!-- BEGIN FILE: 00_PROMPT_MAESTRO_CODEX.md -->

# Prompt maestro para Codex — LBA_Restaurant_Engine

Copia este documento como prompt inicial en el agente que trabajará sobre el repositorio. Después ejecuta exclusivamente los prompts numerados del archivo de la fase activa.

---

Actúa como arquitecto senior, desarrollador TypeScript, ingeniero de simulación, especialista en pruebas y auditor de dependencias del proyecto **LBA_Restaurant_Engine**. Trabaja sobre el repositorio GitHub que el usuario haya conectado. El usuario es principiante, por lo que debes mantener una estructura entendible, documentación en español y cambios pequeños, explicados y verificables.

## Misión del producto

Crear un simulador profesional de operaciones de restaurante que ayude a identificar cuellos de botella antes de abrir o reorganizar un negocio. El editor 2D es el centro del producto. Debe permitir dibujar una pared arrastrando del punto inicial al final; elegir puertas, ventanas, mesas, sillas, equipos y áreas desde un catálogo predefinido; colocar y mover objetos con ajuste a cuadrícula; cambiar las propiedades importantes en un inspector sencillo; y ejecutar simulaciones donde clientes, dependientes, cocineros, pizzeros, bartenders, luncheros y fregadores desarrollan trabajos realistas.

Cada persona simulada debe tener rol, habilidades, zona principal, tareas activas, prioridades y reglas de decisión. Tiene que poder leer un pedido, revisar requisitos y existencias, activar un equipo si hace falta, esperar a que esté listo, ejecutar las tareas en el orden correcto, coordinar actividades paralelas, atender bloqueos y buscar tareas útiles cuando no haya pedidos. Ejemplos de tareas de baja prioridad: lavar platos, limpiar una mesa, organizar una estación, reponer ingredientes o ayudar a otra área cuando sus propias prioridades lo permitan.

La interfaz mostrará una explicación operacional visible de la siguiente acción de cada agente: observación relevante, acción escogida, regla que la activó, dependencias pendientes y siguiente paso. Esto es un registro explicable de la lógica del simulador, no una caja de texto inventada ni una supuesta lectura de pensamientos humanos.

La simulación debe contemplar, por módulos, clientes que llegan y esperan, mesas y estados limpia/ocupada/sucia, llamadas de clientes, colas de tickets, cocina, pizzería, barra, áreas VIP, circulación, lavado, reposición, recursos limitados, tareas paralelas, equipos que se calientan o se encienden durante cierto tiempo, preparación de recetas, bloqueo de rutas, cambios de demanda y métricas para localizar retrasos.

## Reglas no negociables

1. **No saltar fases.** La fase activa es la única autorizada. No implementes funcionalidades de fases futuras “aprovechando” un cambio.
2. **Una interacción = un prompt numerado.** No combines todos los prompts de una fase en una sola ejecución. Después de resolver el prompt actual, detente y entrega un informe breve. Espera la instrucción del usuario para el siguiente prompt.
3. **No destruir ni sobrescribir trabajo existente.** Primero inspecciona el repositorio, rama, historial y cambios sin confirmar. Nunca borres cambios del usuario, reescribas la historia compartida o hagas `force push` sin autorización explícita.
4. **No declarar éxito sin evidencia.** Cada afirmación de prueba debe indicar comando, resultado real, cantidad de pruebas, archivo de salida y enlace a GitHub Actions cuando exista. No inventes enlaces ni ejecuciones.
5. **CI obligatorio.** Los cambios deben ir a una rama de trabajo. Ejecuta las pruebas locales disponibles y deja que GitHub Actions pruebe el commit remoto. No marques la fase como cerrada si el workflow requerido está pendiente, falló o no se pudo verificar.
6. **Merge solo tras verificación completa** (regla actualizada por autorización expresa del propietario, 2026-10-09). Abre o actualiza PR si el entorno lo permite. El agente puede decidir y ejecutar el merge (squash) de sus propios PR sin pedir confirmación adicional únicamente cuando haya comprobado: checks obligatorios en verde sobre el SHA final exacto, conflictos de integración resueltos, integración sin pérdida de cambios de `main`, pruebas y auditorías reales (sin aserciones debilitadas), evidencias publicadas e inspeccionadas, y ausencia de problemas de seguridad pendientes. Un CI verde por sí solo no autoriza el merge. Si alguna condición falla: no fusionar; corregir, volver a ejecutar y dejar registro. El propietario puede revocar esta autorización en cualquier momento.
7. **Mantener pequeño cada cambio.** Preferir varios commits claros a un cambio monolítico. Usa commits con mensajes descriptivos y, cuando estén disponibles, referencia fase e iteración, por ejemplo `feat(phase-03): add wall drawing tool`.
8. **Licencias comprobadas antes de instalar.** No incorporar paquetes, código copiado, fuentes, texturas, modelos 3D, sonidos ni datasets sin comprobar licencia, versión, mantenimiento y procedencia. Prohibidos por defecto: código propietario, licencias `NC`, `ND`, `UNLICENSED`, licencias desconocidas, servicios de pago obligatorios y dependencias GPL/AGPL/LGPL que puedan cambiar la distribución sin aprobación explícita. Para excepciones, detenerse y presentar alternativas.
9. **Ejecución local y privacidad.** Ninguna función esencial depende de un API externo, telemetría, cuenta en la nube o conexión durante la simulación. No subir secretos, tokens, rutas personales o configuraciones privadas a logs ni artefactos.
10. **Valores realistas sin falsas garantías.** Cada duración, temperatura, capacidad y porcentaje debe tener unidad, procedencia y nivel de confianza (`medido`, `fuente`, `estimado` o `calibrado por usuario`). Los valores de ejemplo son editables. Una estimación térmica no puede mostrarse como comprobación de inocuidad alimentaria.
11. **Separar modelo y presentación.** El motor no importa React, DOM, Konva ni Three.js. El editor y los visores leen/escriben comandos del modelo, nunca contienen la lógica central de la simulación.
12. **Errores trazables.** Los logs de sistema y el historial de decisiones de simulación son dos sistemas diferentes. Deben poder indicar evento, hora real y hora simulada, módulo, identificador, objeto/agente/pedido afectado, regla, nivel y traza relacionada; nunca registrar secretos.
13. **Pruebas reales.** Prohibido reemplazar pruebas por `expect(true).toBe(true)`, snapshots aceptados sin revisar, mocks que eviten probar la lógica principal o funciones vacías que devuelvan éxito. Toda limitación o prueba omitida debe declararse.
14. **No crear deuda invisible.** Si una decisión reduce el alcance o pospone algo, anótalo en un ADR/backlog con motivo, riesgo, fase prevista y condición para retomarlo.
15. **Interfaz minimalista pero utilizable.** Priorizar una barra de herramientas izquierda, lienzo central, inspector contextual a la derecha, controles de simulación arriba y eventos/estadísticas en un panel inferior o lateral. No ocultar acciones imprescindibles en menús confusos. Propiedades avanzadas pueden ir en secciones plegables.
16. **Pruebas de interacción completas.** Mantener inventario de botones, herramientas, comandos y propiedades. Cada acción de UI debe estar conectada, probada y tener estados vacíos, error, carga y éxito cuando corresponda.
17. **Usar librerías sin abdicar la arquitectura.** Reutilizar el canvas, controles, navegación y renderizadores abiertos cuando aporten valor. No incrustar un editor completo de terceros ni copiar una aplicación GPL. El motor de restaurantes y su semántica pertenecen a este proyecto.

## Arquitectura objetivo

- Aplicación web local con **React + TypeScript + Vite**; sin empaquetador nativo en esta etapa.
- Editor 2D con **Konva/React Konva**.
- Editor visual de flujos mediante **XYFlow / React Flow** solo cuando llegue la fase correspondiente.
- Motor propio TypeScript de eventos discretos, determinista, con cola de eventos y semilla de aleatoriedad reproducible.
- Dominio de restaurante en módulos independientes: pedidos, recetas, existencias, tareas, recursos, estados de equipos, roles y escenarios.
- Agentes con máquina de estados, reglas/utility scoring y trazas explicables. Árboles de comportamiento propios al principio; no exigir un LLM.
- Navegación 2D inicialmente con A* sobre una representación de celdas o nodos y reglas de reserva/congestión. `recast-navigation-js` solo si pruebas reales justifican navmesh.
- Renderizador 3D **Three.js** posterior, de solo lectura respecto al estado del simulador.
- Persistencia local del escenario mediante IndexedDB o almacenamiento local estructurado, más importación/exportación JSON. No incorporar servidor ni base de datos remota ahora.
- Pruebas unitarias e integración con Vitest; end-to-end en navegador con Playwright desde la fase en que ya exista UI estable.
- GitHub Actions para lint, tipos, tests, cobertura, build, e2e, auditoría de dependencias/licencias y artefactos de evidencia.

Consulta `01_ARQUITECTURA_Y_ESTRUCTURA.md` y `04_CONTRATO_DE_SIMULACION_Y_DATOS.md` para contratos más detallados.

## Protocolo de cada interacción

Al recibir un prompt de fase:
1. Lee el documento maestro y el archivo de fase señalado; confirma la fase y el número de iteración.
2. Inspecciona los archivos pertinentes antes de editar y anuncia brevemente el plan concreto.
3. Implementa solo el alcance de esa iteración.
4. Ejecuta las pruebas relevantes y guarda sus salidas sin esconder fallos.
5. Comprueba `git diff`, elimina cambios accidentales y actualiza documentación.
6. Haz commit y push a la rama de trabajo si tienes acceso y autorización a ello; si no, declara el bloqueo exacto y entrega los cambios disponibles sin fingir subida.
7. Indica el SHA, archivos modificados, comandos ejecutados, resultado literal resumido, workflow de Actions y artefactos reales.
8. Detente. No continúes al próximo prompt de forma autónoma.

## Protocolo de cierre de una fase

El último prompt de cada archivo exige una auditoría de los criterios de salida. En `docs/evidence/PHASE-XX.md` debe existir un informe que use `PLANTILLAS/CIERRE_DE_FASE.md`. Adjunta a la ejecución de GitHub Actions, conservando incluso en caso de fallo, los logs de pruebas, reporte JUnit si está configurado, cobertura, capturas, trazas de Playwright y resultados de la auditoría de licencias. Committe en el repositorio el resumen de evidencia y enlaces, pero no commits pesados o secretos. Los logs detallados pueden quedarse como artefactos de Actions.

Si cualquier requisito obligatorio falla, usa el estado **BLOQUEADA** o **INCOMPLETA**, crea una incidencia reproducible y no autorices la fase siguiente.

## Alcance en este momento

No inventes que el repositorio `lean0311g/LBA_Restaurant_Engine` existe. Verifica primero si el usuario ha conectado un repositorio real. Si no es accesible, detente tras la inspección y proporciona los pasos exactos que necesita el usuario para conectar/crear el repositorio. Comienza solamente por FASE 00.


<!-- END FILE: 00_PROMPT_MAESTRO_CODEX.md -->


---

<!-- BEGIN FILE: 01_ARQUITECTURA_Y_ESTRUCTURA.md -->

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


<!-- END FILE: 01_ARQUITECTURA_Y_ESTRUCTURA.md -->


---

<!-- BEGIN FILE: 02_RECURSOS_LICENCIAS_Y_PARAMETROS.md -->

# Recursos reutilizables, licencias y parámetros

## Política general

El programa y sus dependencias deben ser gratuitos para desarrollar y ejecutar, con código reutilizable y sin suscripciones obligatorias. “Gratis en una página” no significa “libre de condiciones”. Antes de usar algo se registra: nombre, versión, URL oficial, licencia SPDX o texto de licencia, finalidad, modificaciones locales, dependencias transitivas y archivo/asset incorporado. Las licencias se verifican otra vez al instalar, no solo al escribir esta guía.

## Selección recomendada

| Recurso | Licencia verificada/esperada | Papel | Decisión |
|---|---|---|---|
| React | MIT | Interfaz | Usar como base de la web. |
| Vite | MIT (con licencias de dependencias transitivas que se deben conservar) | Desarrollo/build | Usar, generar informe de dependencias cuando sea posible. |
| TypeScript | Apache-2.0 | Tipado y toolchain | Usar; conservar avisos. |
| Konva + React Konva | MIT | Editor gráfico 2D | Selección principal para paredes, objetos, drag/drop y transformaciones. |
| XYFlow / React Flow | MIT | Editor visual de nodos y enlaces | Introducir cuando se construyan flujos visuales; no usarlo para simular el proceso. |
| Three.js | MIT | Vista 3D posterior | Mantener en módulo separado y añadir en fase 10. |
| Vitest | MIT | Test unitario/integración y cobertura | Usar como herramienta de test JS/TS. |
| Playwright | Apache-2.0 | Pruebas end-to-end, capturas y trazas | Usar cuando existan flujos de UI estables. |
| Zustand | MIT | Estado de UI opcional | Usar solo si reduce complejidad; no convertirlo en motor de simulación. |
| Zod | MIT | Validación de datos/escenarios | Recomendado si encaja con el stack elegido. |
| Dexie | Apache-2.0 | API cómoda para IndexedDB | Opcional. Si se evita, documentar la persistencia nativa escogida. |
| Recast Navigation JS | Wrapper MIT; el código original Recast/Detour usa zlib | Navegación basada en navmesh | No obligatorio al inicio; evaluar licencia de la versión exacta y dependencias. |
| RVO2 | Apache-2.0 | Evitación recíproca de colisiones en 2D | Referencia/opción futura, no integrar sin necesidad y prueba de compatibilidad. |
| SimPy | MIT | Referencia didáctica del enfoque de eventos discretos | No usar como segunda implementación en runtime: el motor de producto será TypeScript. |
| Lucide | ISC; determinados iconos heredados incluyen avisos MIT | Iconos | Registrar y conservar notices según versión. |
| Kenney assets | CC0 según su política; revisar el archivo incluido en cada pack | Arte 2D/3D básico | Fuente candidata para placeholders, con registro de cada pack. |
| Poly Haven | CC0 para los assets descritos en su página de licencia | Texturas/modelos/HDRI para la futura vista 3D | Descargar de forma controlada; no depender de su API en ejecución. |

No son necesidades iniciales: PixiJS si Konva cubre la edición 2D; Sweet Home 3D como código incrustado (su proyecto está bajo GPL, incompatible con la política permisiva de esta guía); un motor comercial de simulación; un servicio remoto de IA; un motor de juego completo; servidores o bases de datos en la nube.

## Alternativas permitidas, pero requieren decisión escrita

- **PixiJS (MIT):** excelente renderizador 2D, pero no se añade en paralelo a Konva sin un benchmark que pruebe beneficio. Konva está mejor orientado al editor interactivo de objetos del MVP.
- **Recast Navigation JS (MIT para ese wrapper):** puede generar navmesh y calcular rutas para movimiento menos cuadriculado. Se incorpora únicamente cuando las pruebas de la navegación inicial indiquen que el grid/graph no cumple. No se debe asumir que el wrapper elimina la necesidad de respetar la licencia del código base, sus paquetes wasm y sus assets de ejemplo.
- **RVO2:** evitar colisiones agente-agente; integración WASM/C++ añade complejidad. Primero implementar y probar reserva de posiciones, pasillos y bloqueo por recursos.
- **Sweet Home 3D:** puede servir como inspiración para interacción de plano y formatos, pero no se copia ni incrusta bajo la política inicial. GPL supone obligaciones de distribución diferentes.
- **Datos de alimentos:** si se usa un conjunto de datos externo, auditar licencia de base de datos e imágenes por separado. Open Food Facts, por ejemplo, declara ODbL para la base y CC BY-SA para contenido visual en su documentación; no se importará masivamente sin revisar esas condiciones.

## Política mínima de licencias

1. Licencia del código propio recomendada: **MIT**, con titularidad y aviso `Copyright (c) 2026 Leandro (@lean0311g)` y el texto completo de MIT.
2. Mantener `THIRD_PARTY_NOTICES.md`, `assets/ATTRIBUTION.md` y un inventario de dependencias/activos. No cambiar la licencia del software de terceros por la del proyecto.
3. Lista inicial preferida para software: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC y zlib. Otras licencias se deben evaluar de forma explícita antes de incluirlas. CC0 para recursos y CC BY si se documenta la atribución exacta.
4. Bloquear dependencias con licencia desconocida, propietaria, no comercial, sin derivados, con acceso o actualización pagada obligatoria, o con condiciones de servicio que impidan el objetivo. También bloquear GPL/AGPL/LGPL por defecto para no introducir obligaciones de distribución no deseadas; revisar toda dependencia transitiva.
5. No descargar recursos de páginas de recopilación sin volver a la fuente original. Cada textura, icono, modelo, audio y fuente tipográfica conserva archivo de licencia/atribución, URL y fecha.
6. No hacer requests a APIs externas para que se pueda ejecutar la aplicación. Assets de terceros se incluyen localmente solo tras revisar licencia/tamaño y posibilidad de redistribución.
7. Crear un workflow que produzca un informe de licencias y falle ante estado desconocido/no permitido. Una excepción debe quedar aprobada en un ADR y documentada.

### Nota honesta sobre créditos

MIT exige conservar los avisos de copyright y el texto de licencia en copias o partes sustanciales. No garantiza, por sí sola, que todo proyecto derivado muestre un crédito prominente en su interfaz o README. Si la prioridad es usar una licencia estándar, sencilla y muy permisiva, MIT es una buena elección y el README puede pedir que se reconozca el origen, por ejemplo: “Basado en LBA_Restaurant_Engine, por @lean0311g”. Si el crédito visible obligatorio es una condición legal innegociable, habría que revisar una licencia distinta con asesoramiento especializado; inventar una cláusula y seguir llamándola MIT sería engañoso.

## Registro de parámetros realistas

Cada duración/temperatura/capacidad del catálogo incluye:
- `value` y `unit`, límites razonables y si puede editarse;
- `sourceType`: `measured`, `official_source`, `manufacturer`, `estimated`, `user_calibrated`;
- `sourceUrl`, `checkedAt`, descripción del supuesto y nivel de confianza;
- `scenarioOverride`, para que un local pueda usar sus propios tiempos;
- comentarios sobre lo que no representa el valor.

Ejemplos de propiedades de equipo:
- plancha: `powerOnSeconds`, `targetTemperatureC`, `warmupSeconds`, `heatRecoverySeconds`, `maxItems`, `cooldownSeconds`, `cleaningSeconds`;
- batidora: `startupSeconds`, `cycleSeconds`, `maxBatchUnits`, `cleaningSeconds`, `requiresFreeContainer`;
- impresora: `ticketPrintSeconds`, `queueCapacity`, `paperAvailable`;
- fregadero/lavavajillas: `capacity`, `washSeconds`, `drySeconds`, `cleaningSeconds`;
- horno de pizza: `warmupSeconds`, `targetTemperatureC`, `bakeSeconds`, `capacity`, `recoverySeconds`;
- mesa: `seats`, `cleaningSeconds`, `accessibleClearance`;
- cada acción: duración base, recursos requeridos, precondiciones, efecto, bloqueo y estrategia si falla.

Los valores iniciales deben estar etiquetados como **estimaciones de ejemplo** si no existe una fuente fiable para ese modelo exacto de equipo. El calentamiento de una plancha concreta depende de potencia, masa térmica, voltaje/combustible, ambiente y carga; no se inventará una duración universal.

La temperatura de la superficie no es lo mismo que la temperatura interior del alimento. Si se muestra una referencia de seguridad alimentaria (por ejemplo, la recomendación USDA para carne molida), se cita la fuente, se registra la fecha y se aclara que las normas locales pueden diferir. La simulación no puede declararse certificadora ni reemplazar un termómetro, el manual del equipo o la normativa local.


<!-- END FILE: 02_RECURSOS_LICENCIAS_Y_PARAMETROS.md -->


---

<!-- BEGIN FILE: 03_GITHUB_ACTIONS_LOGS_EVIDENCIAS.md -->

# GitHub Actions, logs y evidencias obligatorias

## Propósito

Que el trabajo de la IA pueda auditarse. GitHub Actions comprueba los cambios que llegan al repositorio y conserva archivos de las pruebas. El agente de programación escribe el código y sube su rama/PR si cuenta con acceso; **Actions no se presenta como si fuera quien programó el código**. No se debe afirmar que una ejecución terminó si el enlace real no muestra ese estado.

## Workflow mínimo, ampliable por fase

Crear workflows YAML en `.github/workflows/`. Como mínimo:

1. **CI principal** en `push`, `pull_request` y `workflow_dispatch`.
2. Instalar la versión Node.js LTS verificada para el momento de iniciar el repositorio, usando `.nvmrc` y un lockfile. Evitar `latest` sin pin.
3. Instalar dependencias reproducibles con `npm ci` (si se usa npm; no cambiar de gestor sin ADR).
4. Ejecutar en jobs/steps identificables: formato, lint, typecheck, test unitario, integración, cobertura, build, auditoría de licencias y Playwright cuando corresponda.
5. Ejecutar las pruebas relevantes de la fase activa. Nunca fingir una prueba que aún no existe; el test pendiente se marca como tal y bloquea el cierre si su criterio lo exige.
6. Guardar resultados como JUnit/JSON cuando la herramienta lo soporte, `coverage/`, `playwright-report/`, `test-results/`, capturas, trazas y logs estructurados.
7. Subir artefactos al finalizar **aunque una prueba falle**, mediante la condición adecuada (`if: always()` en el paso que sube evidencia). Verificar el nombre y contenido real del artefacto.
8. Mantener permisos mínimos del workflow. No exponer secrets en `pull_request` de forks ni ejecutar código no confiable con permisos de escritura privilegiados.
9. Usar versiones estables y auditadas de las acciones. Siempre que sea práctico, fijarlas a SHA completo verificado y comentar la versión legible; no inventar SHAs ni usar etiquetas flotantes por comodidad.
10. Mantener retención razonable para los artefactos. Los resultados detallados pueden vivir como artefactos del run; en el repositorio se versiona el resumen reproducible, no megabytes de logs ni datos sensibles.

## Qué debe guardarse por ejecución

Artefacto con nombre claro, por ejemplo `lba-phase-03-evidence-${{ github.sha }}`:

- salida de lint/typecheck/tests/build;
- reporte de pruebas y cobertura en formatos legibles;
- logs JSON de aplicación/simulador relevantes para el escenario probado;
- capturas de Playwright ante error y, cuando se requiera, capturas de los estados principales;
- trace/video de Playwright para pasos fallidos o retries;
- informe de licencias y versión de dependencias;
- `docs/evidence/PHASE-XX.md` o copia de evidencia de la fase; SHA, rama, run URL y resultados resumidos.

Excluir siempre: `.env`, credenciales, tokens, cookies, datos personales, directorios `node_modules`, cachés de build sin utilidad, copias de perfiles personales o logs con secretos. Añadir una prueba o paso de sanitización si los logs pueden contener datos importados del usuario.

## Dos tipos de registro, nunca confundirlos

### 1. Log diagnóstico del programa

Cada registro estructurado contiene cuando aplique:
`timestampUtc`, `level`, `eventCode`, `module`, `source`, `scenarioId`, `runId`, `traceId`, `agentId`, `orderId`, `resourceId`, `simulationTimeSeconds`, `message`, `detailsSanitized`.

Códigos sugeridos: `APP_BOOT`, `SCENARIO_LOAD_FAILED`, `SIM_START`, `SIM_PAUSE`, `TASK_QUEUED`, `TASK_BLOCKED`, `RESOURCE_RESERVED`, `DEVICE_POWER_ON`, `DEVICE_READY`, `AGENT_DECISION`, `ROUTE_BLOCKED`, `INVENTORY_SHORTAGE`, `ORDER_DELAYED`, `SIM_INVARIANT_FAILED`, `APP_UNHANDLED_ERROR`.

Requisitos:
- niveles `debug`, `info`, `warn`, `error`;
- identificadores correlacionables y stack de error cuando exista;
- registrar entrada/salida de operaciones importantes, no cada frame gráfico;
- historial disponible desde UI y exportable por el usuario;
- errores con un código legible y acción sugerida, no solo “algo salió mal”;
- sin telemetría remota por defecto y sin enviar datos de escenarios a servidores.

### 2. Historial de eventos de la simulación

Registro separado, determinista y ligado a tiempo simulado. Guarda qué cambió: tarea en cola/inicio/fin/bloqueo, objeto encendido/listo, consumo de stock, ruta elegida, decisión de agente, cliente sentado/esperando/llamando, mesa sucia/limpia. Orden por tiempo simulado + secuencia estable. Permite reconstruir por qué se generó una cola y comparar dos escenarios con la misma semilla.

## Tests requeridos

- Unitarios puros para dominio, tiempo, prioridad y validación.
- Integración para recorridos de pedidos completos y recursos compartidos.
- Playwright para abrir, crear/editar escenario, guardar, cargar, ejecutar, pausar, seleccionar persona y ver la próxima acción, mostrar errores de validación y exportar escenario.
- Test de botones/herramientas: mantener un catálogo de interacciones; comprobar que cada control activo dispara un cambio observable o navegación intencionada. Botones sin acción deben estar deshabilitados con explicación, no parecer funcionales.
- Test de cada propiedad configurable: rango válido, unidad, persistencia, valor por defecto y rechazo de valores fuera de rango.
- Test de fallos: archivo JSON mal formado, versión de esquema desconocida, equipo no encontrado, stock insuficiente, ruta bloqueada, tarea sin prerequisito, pausa y reinicio, error al guardar.
- Rendimiento: escenarios de referencia con cantidades definidas de personas/mesas/pedidos; medir tiempos y memoria cuando llegue la fase 9.
- Cobertura: definir umbral realista por módulo crítico e ir elevándolo. No perseguir 100% fingiendo assertions triviales; para el motor y reglas críticas exigir cobertura de ramas de errores además de la línea ejecutada.

## Evidencias por fase

El informe en `docs/evidence/PHASE-XX.md` incluye:

1. Estado: `APROBADA`, `INCOMPLETA` o `BLOQUEADA`.
2. SHA exacto, rama/PR y URL del workflow.
3. Tabla de cada comando de prueba con resultado real y conteos.
4. Enlaces/nombres de artefactos y contenido revisado.
5. Capturas que muestren funcionalidades reales, no mocks estáticos.
6. Bugs conocidos, pruebas pendientes, riesgos y diferencias con el archivo de fase.
7. Lista de archivos modificados con motivo.
8. Confirmación de licencia/dependencias y de que no hay secretos en artefactos.
9. Decisión explícita: se puede avanzar o no, con cada criterio citado.

## Política de fallo

- Si CI falla: conserva artefactos, diagnostica, corrige en la fase actual y vuelve a ejecutar.
- Si una acción fue omitida: marca `NO EJECUTADA`; no cambies el resultado a aprobado.
- Si una prueba es flaky: adjunta los intentos, crea incidencia y corrige la causa; no repitas hasta conseguir un verde y ocultar los rojos.
- Si la ejecución es inaccesible: informa URL y permiso faltante; no inventes el contenido.
- Si Codex no tiene acceso para push: detente, muestra `git status`, commit SHA local si existe y pasos exactos para que el usuario habilite el flujo; nunca afirmes que quedó en GitHub.


<!-- END FILE: 03_GITHUB_ACTIONS_LOGS_EVIDENCIAS.md -->


---

<!-- BEGIN FILE: 04_CONTRATO_DE_SIMULACION_Y_DATOS.md -->

# Contrato del motor y modelo de datos

Este documento define las reglas que toda implementación deberá preservar.

## 1. Tiempo y eventos

El motor será de **eventos discretos**. Mantendrá `simulationTimeSeconds` y una cola de eventos ordenada por `(time, priority, sequence)`. El orden del mismo instante tiene que ser determinista. Procesar un evento puede generar otros eventos futuros. La UI puede ejecutar todos los eventos hasta una hora, ejecutar uno, avanzar a velocidad 1x/10x, pausar o reiniciar sin alterar las reglas matemáticas.

No usar `setInterval`, animación CSS o reloj del navegador como reloj verdadero del dominio. Las animaciones solo interpolan entre estados ya calculados.

Invariantes:
- el tiempo jamás retrocede;
- los eventos se ejecutan en orden definido y estable;
- una misma semilla + escenario + configuración debe producir la misma salida lógica;
- recurso con capacidad 1 no puede estar asignado a dos tareas incompatibles al mismo tiempo;
- una tarea no empieza antes de que se cumplan sus precondiciones/dependencias;
- una tarea fallida, cancelada o interrumpida libera recursos correctamente;
- reset devuelve el escenario al estado inicial y elimina tareas/locks del run anterior;
- un bloqueo o condición imposible se refleja en el registro y no se arregla silenciosamente.

## 2. Entidades principales

- `Scenario`: versión del esquema, geometría, catálogo, personas, roles, pedidos, flujos, parámetros y semilla.
- `WorldObject`: pared, puerta, ventana, mueble, mesa, equipo, zona, pasillo, estación, salida u objeto de inventario físico.
- `Zone`: límites, categoría, permisos, capacidad, estación/función y reglas de acceso.
- `Agent`: id, nombre visible, rol, habilidades, posición, orientación, velocidad, zona asignada, tareas, política, estado y traza actual.
- `TaskTemplate`: nombre, precondiciones, pasos, dependencias, recursos requeridos, duración, efectos, prioridad, condición de interrupción y alternativa ante bloqueo.
- `TaskInstance`: plantilla + pedido/persona/recurso afectado + estados `blocked/ready/queued/running/completed/failed/cancelled` + tiempos.
- `Order`: items, notas, prioridad, tiempos de creación/promesa/entrega y estados configurables.
- `Recipe`: componentes, cantidades, pasos, paralelismo, recursos, temperatura/tiempos estimados y condición final.
- `Equipment`: capacidad, estado `off/starting/heating/ready/in-use/cooling/fault/cleaning`, tiempos, temperatura opcional y reglas de uso.
- `InventoryItem`: unidad, stock, reserva, consumo, reposición y ubicación física.
- `SimulationEvent`: timestamp simulado, secuencia, eventCode, actor/target, cambios y ruleId.
- `ParameterRecord`: valor, unidad, fuente, confianza, supuestos y override por escenario.

IDs estables no basados en la posición del array. Validar tipos y rangos al importar. `schemaVersion` permite migrar escenarios antiguos de forma explícita.

## 3. Modelo de objetos predefinidos

Objetos iniciales: pared, puerta abatible/corredera, ventana, mesa con capacidad, silla, banco/booth, mostrador, estantería, encimera, zona cocina/salón/bar/VIP/pizzería/fregado/almacén/baño/salida, plancha, cocina, freidora, horno, horno de pizza, nevera, congelador, batidora, fregadero, lavavajillas, impresora de tickets, caja/POS, bandeja de entrega, tabla de cortar, cubetas de ingredientes, carrito de limpieza, contenedores, pila de platos limpios/sucios, estación de lavado de manos y punto de recogida.

Cada objeto comparte id, tipo, posición, rotación, dimensiones, huella/colisión, punto de interacción, zona, etiquetas, capa, material/color predefinido y propiedades editables. Las propiedades avanzadas van plegadas por defecto.

## 4. Flujos por rol

Los flujos son grafos de tareas con condiciones y dependencias. Ejemplo conceptual de hamburguesa:
1. recibir ticket y reconocer variante;
2. validar receta, modificadores y tiempos prometidos;
3. comprobar existencias de carne, pan, queso, ingredientes, utensilios y plato/embalaje;
4. si la plancha está apagada, encenderla y programar evento de disponibilidad;
5. preparar tareas independientes mientras la plancha se calienta, si el agente y las zonas permiten hacerlo;
6. reservar una posición/capacidad de plancha y comenzar la carne solo al cumplir la condición de listo;
7. calentar/tostar pan según receta y disponibilidad;
8. montar componentes, validar variantes dobles/queso extra, presentar el pedido y notificar entrega;
9. liberar estación, actualizar inventario y cerrar tareas;
10. si no hay pedidos útiles, elegir una tarea secundaria permitida: revisar preparación, reponer, lavar, limpiar o ayudar otra estación.

Los pasos concretos deben poder editarse y reordenarse, incluyendo bifurcaciones como “si no hay carne preparada”, “si el equipo no está listo”, “si faltan platos” o “si la impresora no tiene papel”. No codificar toda la receta en un `if` gigante.

## 5. Decisiones locales de agentes

Cada ciclo de decisión observa el mundo; crea candidatas de acciones legales; comprueba rol, zona, dependencias, inventario, recursos y seguridad operacional; asigna puntuaciones/urgencias; elige una acción de manera determinista con desempate explícito; y registra `observationSummary`, `candidateActions`, `chosenAction`, `ruleId`, `reasonCode`, `blockedBy`, `nextExpectedAction` y consecuencia esperada. La UI puede mostrar una versión legible y compacta.

Prioridades orientativas y editables: emergencia/bloqueo peligroso; tareas en curso que deban finalizar; pedidos urgentes; trabajo de la estación/rol; tareas necesarias para desbloquear a otro; limpieza/reposición; ayuda de otra área; ocio/espera. Esto no debe quedar codificado como verdad universal: el usuario podrá editar prioridades y restricciones.

No usar un LLM remoto por persona o por tick. Las reglas programadas son rápidas, reproducibles, probables de testear y no requieren Internet. Cualquier recomendación generativa futura es solo auxiliar y el simulador verificará sus consecuencias.

## 6. Movimiento y geometría

El mundo usa unidades reales abstractas (m/cm) y proyección a píxeles solo en pantalla. Paredes y muebles generan obstáculos; puertas y pasos abren conexiones. La ruta inicial puede ser una cuadrícula/grafo. Agentes tienen radio, velocidad, destino e interacción de estación. La llegada a una tarea requiere estar dentro de una tolerancia del punto de interacción. Registrar distancias, intentos de ruta, colisiones, esperas y desvíos.

La capacidad del pasillo y las normas de despeje son parámetros del escenario; no presentar el resultado como aprobación de accesibilidad o normativa de construcción.

## 7. Equipos y tiempos

El estado de encendido/calefacción de un equipo es una máquina de estados y un evento futuro. `warmupSeconds`, `powerOnSeconds`, `targetTemperatureC`, `heatRecoverySeconds`, `cycleSeconds`, `capacity`, `cleaningSeconds`, `cooldownSeconds` son parámetros separados. No sumar siempre tiempos que ocurren paralelos; el motor programa dependencias y comparte recursos correctamente.

Una receta separa calentamiento de equipo, cocción/proceso del alimento, montaje y emplatado. Cualquier curva térmica simple debe documentar supuestos y estar probada. Temperatura de superficie, ambiente y núcleo son variables distintas. Los valores no sustituyen mediciones físicas.

## 8. Reproducibilidad y métricas

Cada ejecución registra semilla, hash/versión del escenario, parámetros y versión del motor. Comparaciones A/B usan misma semilla y demanda cuando sea posible. Métricas mínimas: tiempo de pedido, espera total y por etapa, tiempo de trabajo/walking/waiting, utilización de estaciones/personas, longitud y p90 de cola, pedidos atrasados, distancias, rutas bloqueadas, rotación de mesas, falta de existencias y porcentaje de tareas replanificadas.

Nunca mostrar solo el promedio si una cola extrema importa: incluir percentiles y distribución cuando haya muestras suficientes. Mostrar qué supuestos impulsan la conclusión.


<!-- END FILE: 04_CONTRATO_DE_SIMULACION_Y_DATOS.md -->


---

<!-- BEGIN FILE: 05_FLUJO_DE_REVISION_CON_CHATGPT.md -->

# Cómo trabajar con ChatGPT para auditar cada respuesta de Codex

Este archivo es el protocolo para el ciclo de trabajo del usuario, Codex y ChatGPT.

## Ciclo obligatorio

1. En Codex, ejecutar un solo prompt numerado del archivo de la fase activa.
2. Pedirle que incluya en su respuesta el SHA del commit, rama o PR, enlace real del workflow de Actions, resultados, logs y artefactos.
3. No avanzar al prompt siguiente si faltan evidencias que el prompt actual exige.
4. Compartir aquí en ChatGPT: el informe de Codex, URL del commit/PR, URL de Actions y la salida o archivos relevantes. Si el artefacto no se puede compartir directamente, pega su contenido o capturas del resultado, sin credenciales.
5. La revisión contrastará la entrega con el prompt maestro, el archivo de fase y el criterio de aceptación. El informe de Codex es una afirmación que debe verificarse, no prueba en sí misma.
6. Si hay diferencias, se devuelve a Codex una lista numerada de correcciones, vinculada a requisitos y tests. Se mantiene la misma fase hasta quedar aprobada.

## Qué se puede verificar desde cada prueba

- **Commit/PR:** prueba qué código quedó guardado y qué archivos cambiaron; por sí solo no demuestra que funciona.
- **GitHub Actions verde:** demuestra solo los pasos ejecutados por ese workflow y ese SHA. Revisar si los pasos importantes no fueron omitidos o marcados `continue-on-error`.
- **Log:** ayuda a explicar qué ocurrió, pero no demuestra por sí solo que el comportamiento es correcto.
- **Test:** evidencia el caso que cubre; revisar las assertions, no solo el conteo de verde.
- **Captura/video:** demuestra el estado visual observado, no la lógica interna ni todos los casos.
- **Reporte de cobertura:** muestra código ejecutado; no demuestra que las assertions detecten errores.
- **Benchmark:** solo sirve con escenario, hardware/entorno, semilla, cantidad de entidades y versión registrados.

## Plantilla de mensaje

Usa `PLANTILLAS/MENSAJE_PARA_REVISION.md`. No pegues secretos, tokens de GitHub ni cookies. Si deseas una revisión más profunda, comparte el ZIP del artefacto de Actions o los ficheros de reportes/capturas.

## Regla de aprobación

Una fase solo queda aprobada cuando cada criterio obligatorio del archivo de fase está marcado como `PASS` con evidencia verificable. `NO EJECUTADO`, `NO VERIFICADO`, `FALLÓ` y “debería funcionar” no equivalen a aprobado. Las pruebas que requieran dispositivo físico o medición real se marcan explícitamente como no verificadas en hardware y se dejan como limitación.


<!-- END FILE: 05_FLUJO_DE_REVISION_CON_CHATGPT.md -->


---

<!-- BEGIN FILE: MATRIZ_DE_ACEPTACION_GLOBAL.md -->

# Matriz global de aceptación de LBA_Restaurant_Engine

Este archivo ayuda a revisar la versión integrada. Cada elemento debe vincularse a un test, evidencia y archivo que lo implementa.

## Editor 2D
- [ ] Dibujo de pared por arrastre de punto inicial a final y edición de grosor/material/color.
- [ ] Puertas, ventanas, mesas, sillas, mostradores, zonas y equipos desde catálogo predefinido.
- [ ] Snap grid, zoom/pan, selección, mover, rotar, duplicar, borrar, multi-select, undo/redo.
- [ ] Inspector básico y avanzado; validación de dimensiones y persistencia.
- [ ] Guardar, autosave si procede, importar/exportar escenario versionado.
- [ ] Objetos con metadatos para colisión, punto de interacción y parámetros de simulación.

## Simulación y datos
- [ ] Motor separado de la UI con reloj/eventos deterministas.
- [ ] Pausar/reanudar/paso de evento/reset/velocidad sin cambiar el resultado lógico.
- [ ] Dependencias, recursos, locks, capacidades, stock y errores consistentes.
- [ ] Calentamiento/equipo listo/proceso/recuperación/enfriamiento/limpieza según parámetros configurables.
- [ ] Recetas con versiones, variantes, tareas paralelas y límites de equipos.
- [ ] Logs diagnósticos separados del historial de eventos simulado.

## Personas y áreas
- [ ] Roles principales: dependiente, cocinero, pizzero, bartender, lunchero/preparador, fregador, con capacidad para roles custom.
- [ ] Reglas/flujo personalizable por rol, zona, prioridad, skill, recursos y estado.
- [ ] Panel de próximo paso/motivo/regla y bloqueos, siempre derivado de la decisión real.
- [ ] Acciones secundarias en tiempos ociosos y ayuda entre áreas bajo reglas explícitas.
- [ ] Clientes, grupos, espera, llamada, mesas limpias/sucias, cocina, bar, pizzería, VIP, pedidos y entrega.
- [ ] Trayectorias con obstáculos, puertas, pasillos estrechos, colas, bloqueos y rutas alternas.

## Analítica
- [ ] Duración de pedido por etapa, mediana/percentiles, colas, utilización y distancias.
- [ ] Reportes de ruta bloqueada, falta de stock y tareas que impiden el flujo.
- [ ] Escenarios A/B y exportación reproducible con semilla, versión y supuestos.
- [ ] Aclaraciones visibles sobre datos estimados y límites de validez.

## Vista 3D
- [ ] Se construye desde los mismos datos/estados del modelo 2D.
- [ ] Cámara/orbita/zoom/selección y seguimiento de agentes.
- [ ] No ejecuta un reloj, recetas o lógica propios.
- [ ] Error o WebGL no compatible no impiden usar 2D.

## Ingeniería de calidad
- [ ] Todos los botones/herramientas/propiedades/tipos de objeto inventariados con tests.
- [ ] Unit/integration/e2e, cobertura de la lógica crítica y test de escenarios integrados.
- [ ] CI con permisos mínimos, logs y reportes adjuntos incluso al fallar.
- [ ] Informe de dependencias/licencias y notices completos.
- [ ] No se necesita un servidor, cloud o API para usar la aplicación.
- [ ] README documenta requisitos, instalación, ejecución, import/export, logs, tests, backup y errores comunes.
- [ ] No se declara validación de seguridad alimentaria, accesibilidad o seguridad física sin mediciones/revisión competente.

## Definición de “funcional”

“Funcional” significa que los flujos listados ejecutan y producen resultados que se comprueban con pruebas, que el usuario puede guardar/reabrir sus escenarios, que los errores muestran causas rastreables y que la misma entrada reproducible da la misma salida lógica. No significa que los tiempos coincidan automáticamente con un restaurante real; eso necesita calibración con observaciones del negocio.


<!-- END FILE: MATRIZ_DE_ACEPTACION_GLOBAL.md -->


---

<!-- BEGIN FILE: PROMPT_PARA_COMENZAR.md -->

# Primer mensaje para Codex

Pega primero `00_PROMPT_MAESTRO_CODEX.md` como sus instrucciones permanentes. En el turno siguiente, pega solo este texto:

> Vamos a empezar `LBA_Restaurant_Engine`. Lee el prompt maestro, todas las guías maestras y `FASES/FASE_00_DESCUBRIMIENTO_Y_CONTRATO.md`. Ejecuta únicamente el Prompt 00.1, inspección sin cambios destructivos. No implementes funcionalidades aún, no saltes de fase y no asumas que el repositorio existe. Al acabar, detente y entrégame hechos verificables, bloqueos y pruebas ejecutadas.


<!-- END FILE: PROMPT_PARA_COMENZAR.md -->


---

<!-- BEGIN FILE: FUENTES/RECURSOS_VERIFICADOS.md -->

# Fuentes oficiales y recursos revisados

**Fecha de revisión de esta guía:** 2026-10-09. Las versiones, condiciones y mantenimiento de software cambian; vuelve a abrir la página oficial justo antes de instalar.

## Interfaz y gráficos

- React, licencia MIT: https://github.com/facebook/react
- Vite, licencia MIT y detalles de dependencias incluidas: https://github.com/vitejs/vite/blob/main/packages/vite/LICENSE.md
- Konva, lienzo interactivo 2D, MIT: https://github.com/konvajs/konva
- React Konva, componentes React para Konva, MIT: https://github.com/konvajs/react-konva
- XYFlow / React Flow, editor de flujos de nodos, licencia MIT declarada por el proyecto: https://xyflow.com/open-source
- Three.js, renderizador 3D, MIT: https://threejs.org/license/
- Lucide, iconos, licencia ISC con avisos de determinados iconos derivados: https://github.com/lucide-icons/lucide/blob/main/LICENSE
- shadcn/ui, componentes accesibles y código personalizable bajo MIT: https://github.com/shadcn-ui/ui

## Simulación, navegación y persistencia

- SimPy, explicación útil de simulación de eventos discretos y recursos compartidos; MIT: https://simpy.readthedocs.io/en/stable/
- Recast Navigation (Recast/Detour), biblioteca de navegación con licencia zlib: https://github.com/recastnavigation/recastnavigation
- Recast Navigation JS, wrapper WebAssembly para JavaScript, licencia MIT del wrapper: https://github.com/isaac-mason/recast-navigation-js
- RVO2, evitación recíproca de colisiones en 2D, Apache-2.0: https://github.com/snape/RVO2
- RBush, índice espacial 2D para consultas rápidas, MIT: https://github.com/mourner/rbush
- Zustand, estado de interfaz, MIT: https://github.com/pmndrs/zustand
- Dexie.js, API de IndexedDB, Apache-2.0: https://github.com/dexie/Dexie.js

## Pruebas y automatización

- Vitest, licencia MIT: https://github.com/vitest-dev/vitest
- Cobertura de Vitest: https://vitest.dev/guide/coverage.html
- Playwright, proyecto oficial: https://github.com/microsoft/playwright
- GitHub Actions: artefactos de ejecución (logs, reportes, capturas y otros resultados): https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts
- Acción oficial para subir artefactos, y notas de versiones: https://github.com/actions/upload-artifact
- Calendario oficial de Node.js; la versión LTS debe comprobarse el día que se inicie el código: https://github.com/nodejs/Release#release-schedule

## Recursos visuales

- Kenney: preguntas frecuentes sobre assets CC0 y atribución no obligatoria; revisar también el archivo de licencia incluido en el paquete concreto: https://kenney.nl/support
- Catálogo de assets Kenney: https://kenney.nl/assets
- Poly Haven: licencia CC0 para sus assets, con ToS separado para el acceso a su web/API; descargar y guardar localmente los archivos necesarios: https://polyhaven.com/license
- Open Food Facts: licencia de base de datos ODbL y condiciones separadas para contenidos/imágenes: https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/tutorials/license-be-on-the-legal-side.md

## Parámetros de preparación de alimentos

- USDA FSIS, tabla de temperaturas mínimas internas: https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart
- USDA FSIS, carne molida y recomendaciones de seguridad: https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/meat/ground-beef-and-food-safety

Estas fuentes son referencia informativa. La aplicación debe expresar que las recomendaciones de USDA son de ese organismo y pueden no coincidir con las obligaciones legales del lugar donde se opere. No inferir un tiempo de cocción universal a partir de una temperatura. El modelo de simulación requiere temperatura interna/condiciones de proceso y, para una validación real, medición física/calibración.

## Recursos no seleccionados como dependencia del proyecto

- Sweet Home 3D puede ayudar como referencia de interacción/edición, pero su licencia GPL supone condiciones de distribución distintas de la licencia permisiva elegida para este proyecto. No incorporar código suyo al repositorio bajo la regla actual: https://www.sweethome3d.com/license/
- PixiJS es MIT y puede renderizar 2D, pero introducirlo junto a Konva duplicaría el stack gráfico sin beneficio demostrado. Solo reconsiderar con un ADR y un benchmark: https://github.com/pixijs/pixijs

## Cómo tratar esta lista

La lista no autoriza automáticamente cada versión o asset. Codex debe revisar la versión exacta, release, archivo LICENSE, dependencias transitivas, advisories de seguridad y política de licencia antes de instalar. Si la licencia no está clara, bloquear y proponer alternativa conocida.


<!-- END FILE: FUENTES/RECURSOS_VERIFICADOS.md -->


---

<!-- BEGIN FILE: FUENTES/DECISIONES_DE_LICENCIA.md -->

# Decisiones de licencia y atribución

## Licencia recomendada para código propio

MIT, con un copyright inicial del proyecto, por ejemplo:

`Copyright (c) 2026 Leandro (@lean0311g)`

El archivo `LICENSE` debe copiar el texto oficial completo de MIT y completar correctamente titular/año. No afirmar que el código queda bajo “MIT modificada”: eso no sería la licencia estándar.

## Qué significa para quien reutilice el proyecto

MIT permite usar, modificar, copiar, distribuir y adaptar el proyecto, incluso como base para otros programas, siempre que se respeten las condiciones, entre ellas conservar el aviso de copyright y el texto de licencia en las copias o porciones sustanciales. El README puede solicitar el crédito visible “Basado en LBA_Restaurant_Engine por @lean0311g” y un enlace al origen.

**Límite importante:** MIT no garantiza una obligación universal de mostrar ese crédito en la interfaz, anuncio o README de cada derivado. Si el crédito visible obligatorio es una condición jurídica indispensable, se necesita evaluar otra licencia, no inventar una cláusula y seguir llamándola MIT. La guía prioriza licencia estándar, fácil de reutilizar y sin cláusulas comerciales raras.

## Dependencias y artefactos

- Las licencias de terceros siguen siendo las de terceros. No cambiar el texto de sus licencias.
- MIT no elimina obligaciones de Apache-2.0, ISC, BSD, zlib o licencias de fuentes/modelos.
- Para activos CC BY, conservar atribución, título, fuente, autor, licencia y cambios. Para CC0, se puede atribuir por cortesía, pero registrar la procedencia de todos modos.
- No incrustar contenido de un paquete sin inspeccionar el archivo de licencia incluido.
- `THIRD_PARTY_NOTICES.md` se genera y revisa en CI; no puede consistir en una lista inventada a mano que omita dependencias transitivas.


<!-- END FILE: FUENTES/DECISIONES_DE_LICENCIA.md -->


---

<!-- BEGIN FILE: FASES/README.md -->

# Cómo ejecutar los prompts de fase

La secuencia oficial es FASE 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11. No se salta una fase por estar “casi terminada”.

En cada archivo:
- **Prompt A**: inspección/contrato o diseño detallado.
- **Prompt B**: implementación del incremento mínimo de la fase.
- **Prompt C**: pruebas, integración y corrección.
- **Prompt D**: auditoría, evidencia y decisión de salida.

Pega solo un prompt por interacción. Si la implementación resulta demasiado grande, el agente debe dividir el trabajo dentro del alcance y detenerse en un informe, no comprimir tres interacciones en una sola. Los prompts futuros describen el destino, pero no autorizan a implementarlos antes.


<!-- END FILE: FASES/README.md -->


---

<!-- BEGIN FILE: FASES/FASE_00_DESCUBRIMIENTO_Y_CONTRATO.md -->

# FASE 00 — Descubrimiento del repositorio, alcance y contrato de trabajo

**Objetivo:** Establecer exactamente qué repositorio y rama se utilizarán, qué existe, qué riesgos hay y cómo se demostrará cada fase. No construir aún funcionalidades del simulador.

**Precondición:** Ninguna. Es la primera fase.

**Archivos/módulos que normalmente se tocarán:** README.md del repo, `docs/architecture/`, `docs/decisions/`, `docs/evidence/PHASE-00.md`, backlog/roadmap; no reestructurar código existente sin motivo.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 00.1 — A — Inspección sin cambios destructivos

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 00. No avances a otra iteración automáticamente.
>
> Inspecciona el repositorio real conectado: URL, rama, HEAD, estado git, archivos, scripts, tests, workflows, licencias, dependencias y cambios sin confirmar. Verifica si el repositorio esperado `lean0311g/LBA_Restaurant_Engine` existe y está accesible; no lo supongas. No borres ni alteres código todavía. Resume qué existe, qué falta, riesgos y bloqueos de permisos. Ejecuta solo comandos de inspección seguros. Si no hay acceso al repo, detente con el bloqueo específico y pasos de conexión.

</details>

## Prompt 00.2 — B — Contrato y backlog

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 00. No avances a otra iteración automáticamente.
>
> Con los hallazgos de A, crea/actualiza el README del proyecto, un documento de alcance, lista de exclusiones, mapa de módulos futuro y backlog que se corresponda con las 12 fases de la guía. Crea un ADR inicial con stack propuesto (React/TS/Vite, Konva, motor propio, Playwright/Vitest y Three.js posterior). Verifica las páginas oficiales y licencias exactas antes de añadir dependencias; en esta fase no instales ninguna librería si no hace falta. Registra riesgos y supuestos, sin convertir estimaciones de trabajo en fechas garantizadas.

</details>

## Prompt 00.3 — C — Flujo y evidencias

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 00. No avances a otra iteración automáticamente.
>
> Comprueba qué capacidades reales tiene el entorno para branch, commit, push, PR y GitHub Actions. Define convención de ramas/commits, reporte de fase, log y evidencia. No afirmes que se creó un PR/workflow si no existe. Crea una lista de pruebas/validaciones que CI necesitará desde fase 01 y un archivo `docs/evidence/PHASE-00.md` con los resultados reales de inspección.

</details>

## Prompt 00.4 — D — Auditoría de salida

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 00. No avances a otra iteración automáticamente.
>
> Vuelve a revisar el diff y el informe de fase 00 criterio por criterio. Confirma que no se perdió trabajo existente ni se usaron licencias sin revisar. Ejecuta cualquier validación documental disponible. Adjunta evidencia, SHA/URL reales y lista de bloqueos. No implementes la fase 01. Si falta acceso al repositorio o una decisión esencial de alcance, marca BLOQUEADA y detente.

</details>

## Criterios obligatorios de salida

- [ ] Repositorio real identificado; rama/HEAD y cambios existentes documentados.
- [ ] Alcance y exclusiones registradas; no se ha creado trabajo fuera de fase.
- [ ] Stack y arquitectura inicial documentados con ADR, riesgos y alternativas.
- [ ] Backlog enlazado a fases 00–11 y criterios de salida.
- [ ] Informe de evidencia existe; SHA y URLs no están inventados.

## Pruebas mínimas requeridas

- [ ] Inspección de git status/diff; sin cambios del usuario descartados.
- [ ] Validación de Markdown/enlaces si hay tooling existente; no inventar un test inexistente.
- [ ] Revisión manual del alcance contra los documentos maestros.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-00.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_00_DESCUBRIMIENTO_Y_CONTRATO.md -->


---

<!-- BEGIN FILE: FASES/FASE_01_BASE_TECNICA_CI_LOGS.md -->

# FASE 01 — Base web ejecutable, toolchain, CI y diagnóstico

**Objetivo:** Crear un esqueleto web mínimo y fácil de ejecutar localmente, con código tipado, registro estructurado y GitHub Actions.

**Precondición:** FASE 00 aprobada.

**Archivos/módulos que normalmente se tocarán:** `apps/web`, workspace/package.json, `.nvmrc`, tsconfig, Vite, React, test config, `.github/workflows`, `docs/evidence/PHASE-01.md`, notices/licence.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 01.1 — A — Bootstrap mínimo

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 01. No avances a otra iteración automáticamente.
>
> Lee FASE 00 y la arquitectura. Inicializa workspace con npm workspaces y React+TypeScript+Vite (o conserva herramienta existente si está bien justificada). Verifica primero la versión Node LTS vigente en la fuente oficial y pinéala en `.nvmrc` y Actions. Fija lockfile. Construye una pantalla base minimalista con nombre LBA_Restaurant_Engine y paneles vacíos marcados como futuros. Debe arrancar con comandos documentados. No construir todavía el editor ni motor.

</details>

## Prompt 01.2 — B — Calidad y logging

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 01. No avances a otra iteración automáticamente.
>
> Añade scripts de formato/lint, typecheck, unit tests y build; integra Vitest y un logger de aplicación con niveles, eventCode, módulo, timestamp UTC, traceId opcional y sanitización. Añade un límite de error de UI y un panel/descarga de logs de diagnóstico mínimo. No registrar cada frame ni secretos. Crea la carpeta/documentación third-party y licencia propia MIT con titular `Leandro (@lean0311g)` solo después de documentar la nota sobre atribución y verificar el contexto legal del usuario.

</details>

## Prompt 01.3 — C — GitHub Actions

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 01. No avances a otra iteración automáticamente.
>
> Implementa workflow CI para push/PR/manual: instalación reproducible, lint, typecheck, tests, coverage y build; sube reportes/logs como artefactos incluso ante fallo. Emplea permisos mínimos y acciones estables verificadas, preferiblemente pin por SHA completo, sin inventar SHA. Añade prueba de configuración/escaneo de dependencias según herramienta elegida. No usar `continue-on-error` para hacer aparecer verde un paso crítico. Ejecuta localmente todas las tareas posibles.

</details>

## Prompt 01.4 — D — Auditoría de salida

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 01. No avances a otra iteración automáticamente.
>
> Prueba el flujo real desde una instalación limpia (`npm ci`, tests, build y arranque documentado), revisa permisos de Actions, logs, secretos y artefactos. Prueba al menos un error controlado y comprueba que se registra con código de evento y puede descargarse. Confirma que CI corrió sobre el SHA exacto. Cierra FASE 01 o deja los fallos bloqueando la fase 02.

</details>

## Criterios obligatorios de salida

- [ ] La app arranca localmente desde instrucciones de README.
- [ ] Lockfile y Node fijado; scripts de lint, tipos, test y build reproducibles.
- [ ] CI se dispara en push/PR/manual y conserva resultados aun ante error.
- [ ] Logger estructurado, sin secretos, con exportación local y errores comprensibles.
- [ ] No existe dependencia de runtime externa ni módulo de simulación falso.

## Pruebas mínimas requeridas

- [ ] npm ci desde limpio; lint; typecheck; unit tests; cobertura; build.
- [ ] Smoke test de arranque y navegación básica en navegador.
- [ ] Test de error controlado y sanitización de logs.
- [ ] Comprobar artefactos y contenido real del run de Actions.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-01.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_01_BASE_TECNICA_CI_LOGS.md -->


---

<!-- BEGIN FILE: FASES/FASE_02_MODELO_DATOS_CATALOGO.md -->

# FASE 02 — Modelo de datos validado y catálogo de objetos predefinidos

**Objetivo:** Definir escenarios versionados y objetos de restaurante con propiedades comunes, unidades y presets editables antes de construir interacciones de canvas complejas.

**Precondición:** FASE 01 aprobada.

**Archivos/módulos que normalmente se tocarán:** `packages/domain`, `packages/restaurant-model` (modelos base), `packages/asset-catalog`, `scenarios/fixtures`, docs de esquema y pruebas.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 02.1 — A — Esquema del escenario

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 02. No avances a otra iteración automáticamente.
>
> Diseña tipos y validadores para Scenario, WorldObject, Zone, Agent, TaskTemplate, Equipment, Order, Recipe e InventoryItem. Incluye schemaVersion, IDs estables, coordenadas en unidades del mundo, unidades explícitas y mensajes de error con ruta del campo. Implementa solo los tipos/esquemas y ejemplos mínimos. No construir el editor ni motor de eventos. Añade fixtures válido e inválidos.

</details>

## Prompt 02.2 — B — Catálogo/presets

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 02. No avances a otra iteración automáticamente.
>
> Crea un catálogo declarativo separado del código UI: paredes, puertas de presets (madera/metal/vidrio y tamaños), ventanas, mesas/sillas, mostrador, cocina, plancha, freidora, hornos/horno pizza, nevera/congelador, batidora, fregadero/lavavajillas, impresora/POS, bandejas, estaciones, barra, baño, salida, almacén, zonas VIP y áreas funcionales. Cada preset tiene dimensiones, huella, punto de interacción, propiedades editables, material/color sugerido, unidad, límites y metadata del parámetro. Evita descargar decenas de assets ahora; iconos vectoriales simples sirven para los placeholders.

</details>

## Prompt 02.3 — C — Importación, migración y licencia

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 02. No avances a otra iteración automáticamente.
>
> Implementa parse/validate de JSON y un formato exportable de escenario. Debe rechazar JSON mal formado, versiones desconocidas, IDs duplicados, valores fuera de rango, posiciones no finitas y unidades inválidas sin dañar el escenario actual. Define una política inicial de migraciones sin pérdida silenciosa. Verifica licencia de cada dependencia/asset añadido y actualiza THIRD_PARTY_NOTICES.

</details>

## Prompt 02.4 — D — Auditoría de salida

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 02. No avances a otra iteración automáticamente.
>
> Escribe pruebas de validación, esquemas y presets; prueba serialización/deserialización con ida y vuelta preservando propiedades. Verifica campos para futura extensibilidad: propiedades avanzadas y campos desconocidos se tratan según el contrato explícito, no se descartan silenciosamente. Guarda evidencia, tests y una tabla de presets. No avances a editor 2D si el modelo de datos es ambiguo.

</details>

## Criterios obligatorios de salida

- [ ] Tipos y validadores para las entidades obligatorias, IDs estables y schemaVersion.
- [ ] Catálogo declarativo de objetos predefinidos y propiedades/unidades documentadas.
- [ ] Import/export conserva el escenario y muestra errores con rutas de campo.
- [ ] Fixtures negativos cubren corrupción, límites, IDs duplicados y versión desconocida.
- [ ] Inventario de licencias actualizado; no hay asset no verificado.

## Pruebas mínimas requeridas

- [ ] Round-trip JSON con comparaciones profundas.
- [ ] Property-based o tabla de rangos si está disponible; mínimo equivalentes deterministas.
- [ ] Validación de cada tipo de objeto del catálogo.
- [ ] Pruebas de migración/versión y de no mutación al fallar una carga.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-02.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_02_MODELO_DATOS_CATALOGO.md -->


---

<!-- BEGIN FILE: FASES/FASE_03_EDITOR_2D.md -->

# FASE 03 — Editor 2D de plano profesional y minimalista

**Objetivo:** Crear la superficie de trabajo principal del usuario: canvas 2D, herramientas sencillas, presets, inspector y operaciones reversibles.

**Precondición:** FASE 02 aprobada.

**Archivos/módulos que normalmente se tocarán:** `packages/editor-2d`, UI web, adaptadores de dominio, pruebas del editor, capturas en artefactos.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 03.1 — A — Arquitectura de interacción

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 03. No avances a otra iteración automáticamente.
>
> Diseña el layout: barra izquierda de herramientas, lienzo central, inspector contextual derecho, toolbar superior y panel de mensajes/estado discreto. Implementa el canvas con Konva/React Konva. Define herramientas `select`, `wall`, `door`, `window`, `object`, `zone`, `measure`, `delete`; cuadrícula y unidades visibles. Pared: usuario arrastra desde un inicio hasta un final; no hace falta dibujar cada segmento con múltiples clics. Todavía no simules agentes.

</details>

## Prompt 03.2 — B — Editor básico funcional

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 03. No avances a otra iteración automáticamente.
>
> Implementa selección, mover, rotar, duplicar, borrar, zoom/pan, ajuste a cuadrícula configurable, selección múltiple, inspector de propiedades, presets de color/material, tamaños predefinidos, anular/rehacer, guardar/cargar escenario JSON. Puertas y ventanas deben interactuar con los muros a nivel visual y tener orientación/dirección de apertura. Evita hacer todas las propiedades visibles al mismo tiempo: básicas arriba, avanzadas plegadas. Conecta botones reales, no placeholders.

</details>

## Prompt 03.3 — C — Manejo de errores y usabilidad

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 03. No avances a otra iteración automáticamente.
>
> Añade validaciones de dimensión, selección, snapping sin saltos inesperados, advertencia de solapamiento, teclado para accesibilidad, instrucciones de uso/atajos, confirmación para borrado masivo y autosave local si su alcance está definido. Asegura que las zonas/estaciones tengan nombre y etiquetas. No afirmar que las colisiones arquitectónicas ya son físicamente correctas; el editor solo representa geometría. Incluye estados vacíos y mensajes.

</details>

## Prompt 03.4 — D — Pruebas y auditoría visual

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 03. No avances a otra iteración automáticamente.
>
> Escribe test de cada herramienta, propiedad y botón a través de pruebas de componente e integración; Playwright cubre crear pared por arrastre, colocar una puerta, mover una mesa, cambiar su propiedad, guardar y recargar. Genera capturas CI de escenario antes/después. Usa inspección por teclado/zoom y verifica que errores no destruyan el escenario. Cierra solo si los controles están conectados y las evidencias muestran la app real.

</details>

## Criterios obligatorios de salida

- [ ] Crear pared arrastrando inicio-fin; elegir presets de puerta/ventana y soltar objetos.
- [ ] Propiedades y materiales editables; ubicación/unidades independientes de píxeles.
- [ ] Seleccionar, mover, rotar, duplicar, borrar, zoom/pan, grid, undo/redo y multi-selección funcionan.
- [ ] Guardar/recargar produce el mismo escenario; errores no pierden datos.
- [ ] Inventario de controles y pruebas para cada herramienta/botón/propiedad.

## Pruebas mínimas requeridas

- [ ] Unitarios de transformaciones y conversiones mundo-píxel.
- [ ] Tests de herramienta/propiedad, límites y undo/redo.
- [ ] Playwright crea/edita/guarda/recarga una escena.
- [ ] Capturas en CI y revisión de consola/errores de navegador.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-03.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_03_EDITOR_2D.md -->


---

<!-- BEGIN FILE: FASES/FASE_04_MOTOR_SIMULACION.md -->

# FASE 04 — Motor de eventos discretos, reproducible y desacoplado

**Objetivo:** Crear el núcleo matemático que avanza el tiempo simulado, programa eventos, gestiona estados y es testeable sin interfaz.

**Precondición:** FASE 03 aprobada.

**Archivos/módulos que normalmente se tocarán:** `packages/simulation-core`, contratos de eventos, escenarios mínimos en `scenarios/fixtures`, tests unitarios/integración.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 04.1 — A — Reloj y cola de eventos

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 04. No avances a otra iteración automáticamente.
>
> Implementa un reloj simulado y priority queue ordenada por tiempo, prioridad y secuencia estable. Añade scheduling, cancelación, `runUntil`, paso único, pausa/resume y reset mediante API pura. No importar React, Konva, DOM ni timers reales para decidir el tiempo. La velocidad visual se separa del motor. Documenta semántica de empate, error y cancelación.

</details>

## Prompt 04.2 — B — Estado y recursos genéricos

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 04. No avances a otra iteración automáticamente.
>
> Añade eventos de cambio de estado y recursos de capacidad limitada con reserva/liberación atómica; tareas con precondiciones/dependencias/fin y registro. Si falta un recurso, la tarea queda en cola/bloqueada con código explicable, no se inicia parcialmente. Implementa semilla reproducible para cualquier aleatoriedad y un resumen de eventos/exportación.

</details>

## Prompt 04.3 — C — Invariantes, deadlock y recuperación

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 04. No avances a otra iteración automáticamente.
>
> Implementa verificaciones de invariantes, errores legibles, límites de eventos para detectar runaway loops, watchdog lógico de progreso/deadlock y reset limpio. Si una tarea falla, todos los locks se liberan según regla documentada. Registra actor, recurso, taskId, tiempo simulado y eventCode. No añadir aún recetas ni políticas detalladas de cocina.

</details>

## Prompt 04.4 — D — Tests deterministas

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 04. No avances a otra iteración automáticamente.
>
> Añade tests de tiempo 0/empates/prioridad, eventos que programan eventos, pausa/step/reset, cancelación, recursos de capacidad 1 y N, fallo/liberación de lock, dependencias y misma semilla. Ejecuta un escenario exacto: eventos planificados a 5, 10 y 60 segundos deben ocurrir en esos tiempos sin retrasos de reloj real. Cierra si el motor puede probarse en Node y cumple invariantes.

</details>

## Criterios obligatorios de salida

- [ ] Motor ejecutable fuera del navegador; API de stepping y reloj separados de UI.
- [ ] Orden estable `(time, priority, sequence)` y reproducibilidad por semilla.
- [ ] Recursos no superan capacidad y se liberan en fallo/cancelación.
- [ ] No avanza tiempo hacia atrás ni deja tareas ejecutándose sin precondiciones.
- [ ] Límite de eventos y diagnósticos para loop infinito/deadlock.

## Pruebas mínimas requeridas

- [ ] Tests numéricos exactos para la cola y tiempos previstos.
- [ ] Reproducibilidad byte-a-byte o igualdad lógica de historial con misma semilla.
- [ ] Tests de fallo, cancelación, deadlock y reset.
- [ ] Prueba de estrés controlada para gran número de eventos, con resultado medido.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-04.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_04_MOTOR_SIMULACION.md -->


---

<!-- BEGIN FILE: FASES/FASE_05_EQUIPOS_RECETAS_INVENTARIO.md -->

# FASE 05 — Equipos, recetas, existencias y flujos de preparación

**Objetivo:** Modelar procesos y máquinas de restaurante con tareas en serie/paralelo, capacidad compartida y tiempos editables.

**Precondición:** FASE 04 aprobada.

**Archivos/módulos que normalmente se tocarán:** `packages/restaurant-model`, catálogo de equipos y recetas, `packages/workflow-editor` si se aprueba XYFlow, fixtures de pedidos.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 05.1 — A — Modelo de equipo

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 05. No avances a otra iteración automáticamente.
>
> Implementa máquinas de estados para plancha, cocina/freidora, horno/horno pizza, batidora, impresora y fregadero/lavavajillas. Distingue apagado, encendido, calentando, listo, ocupado, recuperando temperatura, enfriando, limpieza y avería si aplica. Cada transición registra evento y programa su duración configurable. Capacidad y puntos de interacción deben limitar tareas simultáneas.

</details>

## Prompt 05.2 — B — Recetas y tareas DAG

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 05. No avances a otra iteración automáticamente.
>
> Implementa recetas como grafo de tareas con dependencias paralelas y secuenciales. Una hamburguesa simple/doble/queso extra son variantes declarativas, no duplicación de código. Modela ticket, revisión de ingredientes, preparación, calentamiento de equipo, cocción, tostado, montaje y entrega; prepara bebidas por separado cuando pueda ocurrir en paralelo. Define precondiciones, efectos de stock, recursos, duración y estrategia por falta de ingrediente/equipo apagado.

</details>

## Prompt 05.3 — C — Inventario y editor de flujos

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 05. No avances a otra iteración automáticamente.
>
> Añade stock por unidad/ubicación, reservas para tareas, consumo al momento definido por receta, reposición y falta de existencias. Integra XYFlow solo si la edición visual de nodos mejora realmente las tareas: el grafo serializado debe ser independiente de la UI, validarse sin abrir el editor y detectar ciclos/dependencias inexistentes. Mantén versión declarativa y alternativa de edición simple si el flujo visual falla.

</details>

## Prompt 05.4 — D — Calibración, fallos y auditoría

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 05. No avances a otra iteración automáticamente.
>
> Incluye valores de ejemplo etiquetados como estimados; registra fuente, unidad, confianza, fecha y override por escenario. Separa calentamiento de la plancha, recuperación de temperatura, tiempo de cocción y montaje. Incluye pruebas de falta de papel, stock, utensilios, capacidad saturada, equipo no listo y tarea interrumpida. Cualquier estimación térmica debe llevar advertencia y no certificar seguridad alimentaria.

</details>

## Criterios obligatorios de salida

- [ ] Estados de equipos con tiempos/configuración y capacidades.
- [ ] Recetas configurables y variantes sin ifs gigantes; dependencias validadas.
- [ ] Tareas paralelas se solapan solo si recursos/condiciones lo permiten.
- [ ] Stock no negativo por defecto, reservas coherentes y fallos explicables.
- [ ] Parámetros trazables con fuente/confianza/override; tiempos críticos editables.

## Pruebas mínimas requeridas

- [ ] Pedido de hamburguesa completo con plancha apagada y stock suficiente.
- [ ] Caso con batido en paralelo y equipo compartido sin duplicar capacidad.
- [ ] Falta de carne/pan/platos/papel: no “completa” mágicamente.
- [ ] Capacidad de plancha/horno y locks de utensilios.
- [ ] Ciclo de flujo, dependencia ausente y unidad inválida detectados.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-05.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_05_EQUIPOS_RECETAS_INVENTARIO.md -->


---

<!-- BEGIN FILE: FASES/FASE_06_AGENTES_DECISIONES_FLUJOS.md -->

# FASE 06 — Personas con decisiones locales y explicación de su próxima acción

**Objetivo:** Hacer que cada rol actúe por reglas visibles y configurables, no como una animación pregrabada ni como texto generativo sin efecto real.

**Precondición:** FASE 05 aprobada.

**Archivos/módulos que normalmente se tocarán:** `packages/agent-decision`, modelos de roles/políticas, datos de flujo, panel de agente/actividad, tests deterministas.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 06.1 — A — Ciclo de decisión

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 06. No avances a otra iteración automáticamente.
>
> Define observaciones, acciones candidatas, precondiciones, score/prioridad, desempate y salida. Un agente no elige una acción que su rol, zona, stock o recursos no permitan. Registra reglaId y motivo de selección. Implementa máquina de estados mínima (idle, thinking/choosing, moving, working, waiting, blocked, helping, cleaning, break/disabled según configuración). No usar LLM externo.

</details>

## Prompt 06.2 — B — Flujos por rol y plan visible

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 06. No avances a otra iteración automáticamente.
>
> Implementa políticas configurables para cocinero, dependiente/mesero, pizzero, bartender, lunchero/preparador y fregador, más roles definidos por usuario. A cada agente se asigna flujo editable, restricciones de zona, habilidades, prioridad de tareas y alternativas. Ejemplo: el cocinero lee el ticket, verifica receta/stock, activa la plancha si está apagada, aprovecha espera con tareas paralelas legales, cocina/monta/entrega y luego busca una tarea útil. Si no hay pedidos, el fregador lava; si acaba y el cocinero tiene bloqueos, puede ayudar cuando los permisos y sus prioridades lo permitan.

</details>

## Prompt 06.3 — C — Panel de “qué hará y por qué”

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 06. No avances a otra iteración automáticamente.
>
> Crea un panel de actividad por persona con estado actual, tarea, próxima acción, motivo breve, ruleId visible en detalles, condiciones pendientes, recursos esperados y últimas decisiones. Ejemplos de texto: “Voy a encender la plancha: este pedido necesita la estación y ahora está apagada”; “Esperando carne: el stock disponible es 0”; “Ayudaré al cocinero: mi cola está vacía y la regla de apoyo está habilitada”. El texto debe derivar de la decisión real y cambiar cuando cambia el estado, no estar hardcodeado como decoración.

</details>

## Prompt 06.4 — D — Conflictos, interrupciones y pruebas

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 06. No avances a otra iteración automáticamente.
>
> Prueba pedidos simultáneos, cambios de prioridad, stock faltante, equipo ocupado, cliente que llama, ruta bloqueada, tarea interrumpida y ayudante que recibe una tarea propia urgente. Evita que una persona ejecute tareas mutuamente incompatibles o repita sin fin una acción fallida. Añade trazas para candidatas rechazadas por precondición y replanificación, pero limita el volumen de logs.

</details>

## Prompt 06.5 — E — Auditoría de salida

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 06. No avances a otra iteración automáticamente.
>
> Verifica cada rol y regla de decisión con test de entrada/observación/salida. Comprueba que el panel corresponde a la decisión realmente emitida. Revisa desempates y reproducibilidad con semilla. Si no existe una política para un caso, reporta el gap y bloquea; no uses texto narrativo para aparentar inteligencia.

</details>

## Criterios obligatorios de salida

- [ ] Roles, reglas, prioridades, zonas y flujos modificables en datos.
- [ ] Próxima acción explicable enlazada a una decisión real y regla/causa trazable.
- [ ] Agentes respetan precondiciones, equipo, stock, habilidades y tareas activas.
- [ ] Tareas secundarias y apoyo entre áreas configurables; no invaden siempre la prioridad principal.
- [ ] Decisiones deterministas/reproducibles y condiciones bloqueadas visibles.

## Pruebas mínimas requeridas

- [ ] Tabla de decisión para cada rol y sus tareas principales/secundarias.
- [ ] Plancha apagada, stock faltante y preparación en paralelo.
- [ ] Fregador libre ayuda al cocinero solo bajo regla; reacciona a nueva prioridad.
- [ ] Agente bloqueado replantea sin bucle infinito; task/locks se limpian.
- [ ] UI refleja `chosenAction` y `ruleId` reales.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-06.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_06_AGENTES_DECISIONES_FLUJOS.md -->


---

<!-- BEGIN FILE: FASES/FASE_07_MOVILIDAD_CONGESTION.md -->

# FASE 07 — Geometría transitable, rutas y congestión entre personas

**Objetivo:** Mover personas de forma convincente sobre el plano 2D, respetando paredes, muebles, puertas y anchos de paso, y medir bloqueos.

**Precondición:** FASE 06 aprobada.

**Archivos/módulos que normalmente se tocarán:** `packages/spatial`, integración con `editor-2d`, agentes y pruebas geométricas.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 07.1 — A — Geometría y puntos de interacción

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 07. No avances a otra iteración automáticamente.
>
> Convierte muros, puertas, mobiliario y áreas en obstáculos/conexiones transitables. Define radio de persona, ancho de paso, puntos de uso delante/lateral de cada equipo, salidas y zonas permitidas. Mantén unidades del mundo consistentes. Escribe validadores visuales para objetos flotantes, puertas bloqueadas y pasillos no conectados.

</details>

## Prompt 07.2 — B — A* y navegación por rutas

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 07. No avances a otra iteración automáticamente.
>
> Implementa A* sobre grid/grafo o adopta una librería permissiva verificada si la simplificación se justifica. La ruta tiene inicio/objetivo alcanzables, distancia calculada, puntos de waypoint y resultado explícito `reachable/unreachable`. La velocidad modifica la llegada estimada, no la lógica del motor. En el editor muestra opcionalmente la ruta y por qué está bloqueada.

</details>

## Prompt 07.3 — C — Congestión/evitación simple

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 07. No avances a otra iteración automáticamente.
>
> Añade reserva temporal de posiciones/segmentos, capacidad de pasillos y comportamiento ante encuentro frontal, zona estrecha, obstáculo dinámico y estación ocupada. Los agentes deben esperar, ceder prioridad o tomar desvío según reglas. Guarda tiempo de caminar, bloquearse, esperar y recorrer desvío. No integres Recast/RVO2 salvo que documentes el problema medido que el método sencillo no resuelve y el ADR apruebe licencia/dependencias.

</details>

## Prompt 07.4 — D — Tests de escenarios geométricos

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 07. No avances a otra iteración automáticamente.
>
> Crea escenarios geométricos mínimos: pasillo recto, esquina, puerta cerrada, puerta abierta, estación inaccesible, dos agentes en sentido opuesto, mesa con espacio insuficiente y ruta alternativa. Captura el plano con ruta/trayectoria superpuesta. No presentar la geometría como certificación de accesibilidad o seguridad física.

</details>

## Criterios obligatorios de salida

- [ ] Las personas no atraviesan paredes/mobiliario ni llegan a estaciones sin punto accesible.
- [ ] Puerta abierta habilita paso; puerta cerrada/bloqueada cambia alcanzabilidad de forma explícita.
- [ ] Dos o más agentes generan espera/desvío cuando un pasillo no admite el cruce.
- [ ] Se miden distancia, marcha, espera, congestión y bloqueo.
- [ ] Ruta imposible dispara causa y no deja agente oscilando indefinidamente.

## Pruebas mínimas requeridas

- [ ] Pruebas unitarias de intersecciones, distancias y grafo transitable.
- [ ] Pruebas deterministas de rutas abiertas/bloqueadas y capacidad de pasillo.
- [ ] Tests multiagente con una semilla fija; límites de ciclos/espera.
- [ ] Playwright muestra rutas y alertas; capturas se adjuntan a Actions.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-07.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_07_MOVILIDAD_CONGESTION.md -->


---

<!-- BEGIN FILE: FASES/FASE_08_CLIENTES_ROLES_OPERACION.md -->

# FASE 08 — Flujo de clientes y operaciones completas del restaurante

**Objetivo:** Conectar las áreas de servicio para simular un turno de restaurante, incluidas las tareas “pequeñas” que producen cuellos de botella.

**Precondición:** FASES 02–07 aprobadas.

**Archivos/módulos que normalmente se tocarán:** `packages/restaurant-model`, escenarios reales de prueba, flujos de roles, panel de clientes/pedidos, datos de demanda.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 08.1 — A — Llegadas, espera y mesas

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 08. No avances a otra iteración automáticamente.
>
> Implementa llegadas de clientes por calendario/tasa o secuencia manual, grupos/tamaño, selección de mesa compatible, espera, renuncia configurable, pedido, consumo/espera y salida. La llegada puede ser fija o aleatoria con semilla. Cada mesa cambia entre disponible, reservada, ocupada, esperando limpieza y limpieza en curso. Un cliente puede llamar a un dependiente y generar evento/urgencia según configuración.

</details>

## Prompt 08.2 — B — Área de servicio completa

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 08. No avances a otra iteración automáticamente.
>
> Conecta dependiente, cocina, pizzería, barra/bartender, lunchero, fregador y limpieza. Incluye mesa sucia/llena de platos, platos limpios disponibles, reponer servilletas/ingredientes, tickets impresos, bandeja de despacho, entrega parcial/total, pedido tardío, reclamo/cancelación, zona VIP y asistencia inter-área. Roles y estaciones son editables, no hardcodeados en el motor.

</details>

## Prompt 08.3 — C — Fallos y tareas de mantenimiento

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 08. No avances a otra iteración automáticamente.
>
> Añade falta temporal de equipo, impresora sin papel, estación sucia, utensilio no disponible, stock por reponer, equipo en recuperación, persona ausente y mesa no accesible. Define respuestas deterministas configurables: esperar, avisar, buscar alternativa, pedir ayuda, reordenar flujo, cancelar o dejar bloqueado con alerta. Añade tareas secundarias recurrentes, pero no permitas que la limpieza interrumpa una tarea urgente o alimento en proceso si la política no lo permite.

</details>

## Prompt 08.4 — D — Escenarios integrados

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 08. No avances a otra iteración automáticamente.
>
> Crea escenarios reproducibles: hora tranquila, pico de demanda, muchas hamburguesas con batidos, turno de pizzas, bar lleno, falta de platos, cocina congestionada, dependiente saturado y fregador ocioso/disponible para ayudar. Documenta supuestos y tiempos editables. No uses nombres ni tiempos de una cocina real como datos “medidos” sin fuente.

</details>

## Prompt 08.5 — E — Auditoría de salida

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 08. No avances a otra iteración automáticamente.
>
> Ejecuta los escenarios de punta a punta, sigue varios pedidos en el historial desde llegada hasta entrega y confirma estados consistentes de mesas, platos, stock y equipo. Compara cada evento, no solo la animación. Los escenarios bloqueados deben explicar la causa. Informa decisiones de cada rol y cuellos de botella observados; no avances si una persona desaparece del flujo o una tarea se completa sin cumplir precondiciones.

</details>

## Criterios obligatorios de salida

- [ ] Un pedido tiene trazabilidad desde llegada/creación hasta entrega/salida o cancelación explícita.
- [ ] Mesas, vajilla, limpieza, reposición e impresora afectan a la operación y pueden crear colas.
- [ ] Bar, pizzería, salón, cocina y fregado son áreas configurables con roles/estaciones.
- [ ] La ayuda entre roles respeta prioridades, zona y habilidades.
- [ ] Escenarios de baja y alta demanda reproducibles y explicables.

## Pruebas mínimas requeridas

- [ ] E2E de un cliente sentado → pedido → preparación → entrega → mesa limpiada.
- [ ] Casos de llamada de cliente, platos agotados, falta de papel, estación caída y pedido cancelado.
- [ ] Pico de clientes con cuellos de botella esperados y sin estados imposibles.
- [ ] Verificar pedidos/stock/mesas/recursos después de reset y re-ejecución.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-08.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_08_CLIENTES_ROLES_OPERACION.md -->


---

<!-- BEGIN FILE: FASES/FASE_09_METRICAS_EXPERIMENTOS.md -->

# FASE 09 — Analítica, cuellos de botella y comparación de escenarios

**Objetivo:** Transformar el historial simulado en métricas para decidir cambios de distribución, cantidad de personal, capacidad y tiempos.

**Precondición:** FASES 04–08 aprobadas.

**Archivos/módulos que normalmente se tocarán:** `packages/analytics`, escenarios de benchmark, informes CSV/JSON, panel de resultados y pruebas estadísticas.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 09.1 — A — Métricas desde eventos

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 09. No avances a otra iteración automáticamente.
>
> Implementa métricas puras derivadas del historial: duración de pedido y sus etapas, espera/caminar/trabajar, utilización de equipos y personas, colas, p90 y mediana cuando haya suficientes muestras, atrasos, distancia, rutas bloqueadas, falta de stock, uso de mesas y tareas fallidas. Especifica fórmula, unidad, denominador y tratamiento de pedidos no terminados. No mutar ni alterar el historial de simulación.

</details>

## Prompt 09.2 — B — Panel y exportación

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 09. No avances a otra iteración automáticamente.
>
> Crea un panel minimalista de métricas con filtros por período, área, agente, estación y escenario, junto con tabla de eventos que explique los datos. Exporta CSV/JSON de resultados e incluye semilla, hash de escenario, versión del motor, supuestos y configuración. Señala muestras pequeñas, estimaciones y parámetros sin calibrar.

</details>

## Prompt 09.3 — C — Experimentos A/B y sugerencias

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 09. No avances a otra iteración automáticamente.
>
> Añade comparación de escenarios con misma semilla/demanda cuando tenga sentido: por ejemplo, un fregador adicional, plancha de capacidad superior, recolocar equipos o variar prioridades. Produce diferencias en métricas y evidencia del supuesto que generó cada recomendación. No hacer auto-optimización que edite el escenario del usuario sin confirmación. No afirmar causalidad fuerte cuando la simulación o muestra es insuficiente.

</details>

## Prompt 09.4 — D — Rendimiento y precisión

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 09. No avances a otra iteración automáticamente.
>
> Crea escenarios estándar con número definido de pedidos, clientes, agentes y eventos. Mide tiempo real de ejecución, número de eventos y uso aproximado de memoria con versión/entorno registrados. Verifica matemáticamente métricas usando un escenario pequeño con tiempos conocidos y resultado esperado. Implementa solo optimizaciones que conserven reproducibilidad y demuestren mejora.

</details>

## Criterios obligatorios de salida

- [ ] Métricas documentadas con unidad, fórmula y manejo de incomplete cases.
- [ ] Resultados explican el cuello de botella mediante eventos, no solo colores en un gráfico.
- [ ] Comparación A/B preserva escenarios, semilla y parámetros de origen.
- [ ] Exportaciones contienen datos suficientes para reproducir una corrida.
- [ ] Benchmarks medidos y repetibles, sin números inventados.

## Pruebas mínimas requeridas

- [ ] Test exacto de métricas sobre un run de tiempos conocidos.
- [ ] Tests de cero pedidos, un pedido, pedido aún abierto y muestras pequeñas.
- [ ] Ejecuciones A/B con mismo escenario/semilla comparables.
- [ ] Prueba de rendimiento con umbrales razonables y baseline guardado.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-09.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_09_METRICAS_EXPERIMENTOS.md -->


---

<!-- BEGIN FILE: FASES/FASE_10_VISTA_3D.md -->

# FASE 10 — Vista 3D de observación del mismo escenario

**Objetivo:** Permitir observar el local desde diferentes ángulos y seguir la simulación con la misma fuente de verdad que el editor 2D.

**Precondición:** FASES 03–09 aprobadas o criterios específicos documentados como precondición parcial; el motor y el mapa 2D deben funcionar.

**Archivos/módulos que normalmente se tocarán:** `packages/view-3d`, catálogo de meshes/asset metadata, puente de estado de solo lectura, tests de sincronización.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 10.1 — A — Extrusión y cámara

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 10. No avances a otra iteración automáticamente.
>
> Usa Three.js para convertir paredes, suelo, puertas, ventanas, mesas, equipos y zonas del escenario a objetos visuales ligeros. La vista debe mostrar planta/extrusión razonable, orbitar, rotar, acercar/alejar, restablecer cámara y elegir vistas ortográficas/perspectiva. No crear un editor 3D de construcción ni otra fuente de datos; los cambios estructurales se siguen haciendo en 2D.

</details>

## Prompt 10.2 — B — Personas y estados animados

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 10. No avances a otra iteración automáticamente.
>
> Representa personas por placeholders locales simples primero; su posición, orientación y estado vienen del motor/navegación 2D. Los objetos cambian visualmente entre apagado, calentando/listo/ocupado/lavado cuando exista un evento de dominio real. No inventar movimientos independientes que atraviesen paredes. Carga recursos solo desde archivos locales registrados con licencia.

</details>

## Prompt 10.3 — C — Sincronización y límites

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 10. No avances a otra iteración automáticamente.
>
> Añade sincronización al pausar, paso único, acelerar, reset y selección de agente/pedido entre las vistas 2D y 3D. La vista puede ser desactivada si el dispositivo/browser no soporta WebGL. Un error 3D no debe bloquear la simulación ni impedir abrir el editor 2D. Evita materiales/texturas enormes; documenta budget y fallback.

</details>

## Prompt 10.4 — D — Tests

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 10. No avances a otra iteración automáticamente.
>
> Añade pruebas que comparen posiciones/estados de un agente y equipos entre fuente de verdad y vista 3D; smoke test de carga, selección, cámara, pausa y reset. Ejecuta tests donde WebGL no esté disponible o no se pueda correr en CI, y declara la limitación real; no simules aprobación gráfica con un mock estático. Adjunta capturas en CI compatible o registra prueba manual repetible.

</details>

## Criterios obligatorios de salida

- [ ] 3D es opcional y de observación; motor/datos no dependen de Three.js.
- [ ] La vista 3D sigue las mismas posiciones, tareas, estados y reloj del motor.
- [ ] Cámara, zoom, perspectiva/ortográfica y selección funcionan.
- [ ] Error en 3D no derriba editor ni simulación 2D.
- [ ] Activos locales y licencias documentadas; carga/rendimiento razonables.

## Pruebas mínimas requeridas

- [ ] Tests de sincronización de estado 2D/3D con fixtures conocidos.
- [ ] Playwright smoke test en navegador compatible y prueba de fallback.
- [ ] Medición de tamaño/carga de assets y no dependencia de CDN.
- [ ] Evidencia de captura/video real y límites de CI explicados.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-10.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_10_VISTA_3D.md -->


---

<!-- BEGIN FILE: FASES/FASE_11_QA_FINAL_Y_ENTREGA.md -->

# FASE 11 — Auditoría funcional, estabilidad, documentación y entrega web

**Objetivo:** Probar el producto como un conjunto, cerrar defectos, asegurar reproducibilidad y dejar instrucciones para ejecutarlo localmente.

**Precondición:** FASES 00–10 aprobadas o excepciones explícitas aprobadas con ADR; ninguna deficiencia crítica de dominio debe quedar encubierta.

**Archivos/módulos que normalmente se tocarán:** Todo el repositorio, tests, CI, README de usuario/desarrollador, `THIRD_PARTY_NOTICES.md`, docs/evidence.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 11.1 — A — Auditoría del inventario

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 11. No avances a otra iteración automáticamente.
>
> Construye un inventario real de cada botón, herramienta, acción del teclado, propiedad editable, tipo de objeto, transición de equipo, rol, tarea, panel, import/export, control de simulación y funcionalidad 3D. Relaciónalo con test existente, archivo y estado. Detecta controles sin acción, propiedades que no persisten y rutas de código sin ejecutar. No empieces arreglando hasta priorizar por severidad.

</details>

## Prompt 11.2 — B — Pruebas integrales y fallos

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 11. No avances a otra iteración automáticamente.
>
> Ejecuta desde entorno limpio tests unitarios/integración/e2e, typecheck, lint, build, auditoría de licencias/dependencias y escenarios de stress. Prueba errores de usuario, archivos inválidos, reinicios, cargas grandes, multiagente, deadlocks y exportación. Verifica que el workflow conserva las pruebas fallidas. Repara defectos críticos/altos dentro de la fase, uno por uno, y añade test de regresión por cada bug.

</details>

## Prompt 11.3 — C — Usabilidad, accesibilidad y recuperación

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 11. No avances a otra iteración automáticamente.
>
> Revisa mensajes, teclado, foco, contraste razonable, zoom, texto de errores, panel de agente, navegación entre áreas, estados de carga y fallback si WebGL falla. Asegura que guardar/exportar y recuperar un escenario funciona y que logs no contienen datos privados. Revisa README de usuario: requisitos, instalación, ejecución (`npm ci`, `npm run dev`), tests, import/export, limitaciones, parámetros y resolución de errores comunes.

</details>

## Prompt 11.4 — D — Auditoría de licencias y supply chain

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 11. No avances a otra iteración automáticamente.
>
> Verifica todas las dependencias directas/transitivas, acciones GitHub, iconos, fuentes, imágenes, modelos, texturas y sonidos con la política de `02_RECURSOS_LICENCIAS_Y_PARAMETROS.md`. Regenera notices e informe. Corrige dependencias no verificadas o detén el release por ellas. Comprueba URLs de fuentes, lockfile, secrets, permisos de Actions y que no hay llamadas de red necesarias durante runtime.

</details>

## Prompt 11.5 — E — Cierre final

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 11. No avances a otra iteración automáticamente.
>
> Ejecuta CI final en el SHA candidate exacto, revisa su URL y todos sus artifacts. Actualiza matriz de aceptación y notas de versión; enumera limitaciones no resueltas. No llames “completo” a algo no probado en dispositivo físico. Deja rama/PR con verificación completa conforme a la política de integración (autorización expresa del propietario, 2026-10-09): el merge queda prohibido si algún criterio obligatorio no está en PASS; no empaquetes instaladores nativos. La fase solo se aprueba si todos los criterios obligatorios de esta fase son PASS o si una excepción de alcance documentada está aprobada explícitamente por el usuario.

</details>

## Criterios obligatorios de salida

- [ ] Matriz completa de controles/propiedades/roles/estados con tests y evidencia.
- [ ] CI verde en el SHA candidato y artefactos revisados; sin pasos críticos omitidos.
- [ ] Dependencias/licencias/activos auditados y notices completos.
- [ ] Instalación limpia y ejecución web documentadas y reproducibles.
- [ ] Limitaciones físicas/térmicas/de CI declaradas; no se afirma certificación del mundo real.
- [ ] No se han añadido instaladores nativos, Android ni servicios en nube sin aprobación.

## Pruebas mínimas requeridas

- [ ] CI completa, incluyendo tests de regresión de todos los bugs críticos/altos.
- [ ] Matriz de interacción UI con resultado por control/propiedad.
- [ ] Smoke test de principio a fin: diseñar local, crear pedido, simular, pausar, inspeccionar agente, métricas, guardar/cargar/exportar.
- [ ] Escenarios de pico, bloqueo, falta de stock y error de archivo.
- [ ] Auditoría de licencias, seguridad, logs y ausencia de red obligatoria.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-11.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.


<!-- END FILE: FASES/FASE_11_QA_FINAL_Y_ENTREGA.md -->


---

<!-- BEGIN FILE: PLANTILLAS/CIERRE_DE_FASE.md -->

# Cierre de fase XX — Título

- Estado: `APROBADA / INCOMPLETA / BLOQUEADA`
- Fecha UTC:
- Rama y PR:
- Commit SHA exacto:
- Workflow de GitHub Actions:
- Artefacto(s) de evidencia:
- Archivo de fase y revisión:

## Cambios realizados

| Archivo/módulo | Cambio | Requisito relacionado |
|---|---|---|

## Tests ejecutados

| Comando/workflow | Resultado real | Conteo/detalle | Evidencia |
|---|---|---|---|

## Criterios de salida

| ID | Criterio | Estado (`PASS/FAIL/NO VERIFICADO/NO EJECUTADO`) | Evidencia concreta |
|---|---|---|---|

## Capturas/logs/reportes

Enlaces exactos, nombres de artefactos y descripción de lo que se comprobó. No usar “todo bien” sin enlace o salida.

## Licencias, assets y supply chain

Dependencias nuevas, versión, licencia, notices añadidos, análisis de licencia y seguridad. Confirmar ausencia de secretos en artefactos.

## Bugs y limitaciones pendientes

Cada problema debe tener reproducción, impacto, módulo y próxima acción. No ocultar defectos conocidos para poder aprobar.

## Riesgos/diferencias

- Requisitos parcialmente implementados:
- Pruebas que no pudieron ejecutarse:
- Supuestos de simulación no medidos:
- Cambios de alcance con ADR:

## Decisión

- [ ] Se puede avanzar a la fase siguiente.
- [ ] No se avanza; corregir los puntos señalados.

Justificación basada en cada criterio de salida y sus evidencias:


<!-- END FILE: PLANTILLAS/CIERRE_DE_FASE.md -->


---

<!-- BEGIN FILE: PLANTILLAS/INCIDENCIA.md -->

# Incidencia reproducible

- ID/título:
- Fase/iteración:
- Severidad e impacto:
- Commit SHA:
- Sistema/navegador/versión Node cuando sea relevante:
- Escenario JSON y semilla reproducible:
- Pasos exactos:
- Resultado esperado:
- Resultado actual:
- Registro de eventos y `traceId`:
- Captura/video/Playwright trace:
- ¿Falla de forma determinista?:
- Causa raíz confirmada o hipótesis pendiente:
- Test de regresión que se añadirá:
- Estado:


<!-- END FILE: PLANTILLAS/INCIDENCIA.md -->


---

<!-- BEGIN FILE: PLANTILLAS/MENSAJE_PARA_REVISION.md -->

# Revisión de una entrega de Codex por ChatGPT

Estoy trabajando en `LBA_Restaurant_Engine`. Revisa esta entrega **sin dar por hecho que la respuesta de Codex sea correcta**. Utiliza los documentos maestros y el archivo de fase correspondiente como contrato.

- Fase/iteración actual:
- Archivo de fase:
- Mensaje completo de Codex:
- URL del commit o PR:
- SHA:
- URL de GitHub Actions:
- Estado del workflow:
- Artefactos disponibles/enlaces:
- Logs/reportes/capturas adjuntos:
- Criterios que Codex dice que cumplió:

Necesito que:
1. Separes hechos verificados, afirmaciones sin evidencia y datos que no se pueden comprobar con lo compartido.
2. Contrastes los archivos realmente modificados y pruebas reportadas con las condiciones del archivo de fase.
3. Detectes pruebas triviales, faltantes, desactivadas, falsos positivos, dependencias/licencias problemáticas, inconsistencias del modelo y riesgos de arquitectura.
4. Digas criterio por criterio `PASS`, `FAIL`, `NO VERIFICADO` o `NO EJECUTADO`, citando el artefacto o salida pertinente.
5. Redactes el siguiente prompt de corrección para Codex en español, limitado a los fallos identificados y a la fase actual. No avances la fase.
6. Si el estado no puede verificarse, dilo sin inventar acceso a GitHub. Señala exactamente qué enlace, log o archivo falta.

No apruebes una fase por el número total de tests solamente. Comprueba que las pruebas cubren la funcionalidad y que el motor/datos reales se ejecutan, no solo mocks.


<!-- END FILE: PLANTILLAS/MENSAJE_PARA_REVISION.md -->


---

<!-- BEGIN FILE: PLANTILLAS/REGISTRO_DE_PARAMETRO.md -->

# Registro de parámetro de simulación

- `parameterId`:
- Nombre visible:
- Objeto/receta/tarea afectada:
- Valor:
- Unidad:
- Valor mínimo/máximo permitido:
- Editable por el usuario: sí/no
- Tipo de fuente: `measured / official_source / manufacturer / estimated / user_calibrated`
- URL y nombre de fuente:
- Fecha de verificación:
- Confianza: baja/media/alta, con motivo:
- Supuestos del modelo:
- Condiciones de validez:
- Diferencia entre tiempo de proceso y tiempo de calentamiento:
- Override del escenario:
- Test que valida unidades/rangos:
- Advertencia visible que corresponde:


<!-- END FILE: PLANTILLAS/REGISTRO_DE_PARAMETRO.md -->
