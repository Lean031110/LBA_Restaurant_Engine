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
