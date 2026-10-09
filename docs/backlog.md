# Backlog maestro vinculado a las fases 00–11

Fuente: `docs/guia/FASES/` (criterios de salida por fase). Este backlog es el índice de trabajo del proyecto: cada fase abre sus propios issues al comenzar y se cierran solo con evidencia verificable.

## Reglas

- Una fase no empieza hasta que la anterior esté `APROBADA` en `docs/evidence/PHASE-XX.md`.
- Cada entrega va en rama de trabajo + PR; el merge (squash) se ejecuta solo tras la verificación completa de calidad, seguridad e integración del PR (autorización del propietario, 2026-10-09).
- Los problemas detectados se registran como issues con la plantilla `docs/guia/PLANTILLAS/INCIDENCIA.md`.

## Tabla de fases

| Fase | Título                       | Entregable verificable                                               | Criterios de salida clave                                                                                                                                                       | Estado    |
| ---- | ---------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 00   | Descubrimiento y contrato    | Repositorio inspeccionado, alcance cerrado, ADR, backlog, riesgos    | Repo/rama/HEAD documentados; alcance y exclusiones; ADR stack; backlog 00–11; informe de evidencia con SHA/URLs reales                                                          | APROBADA  |
| 01   | Base técnica, CI y logs      | Web local ejecutable, toolchain, logging estructurado, Actions       | App arranca por README; Node+lockfile fijados; scripts lint/tipo/test/build; CI con artefactos aunque falle; logger sin secretos exportable; sin dependencia de runtime externa | APROBADA  |
| 02   | Modelo de datos y catálogo   | Dominio validado (Zod) + catálogo de objetos predefinidos            | Schemas con errores comprensibles y ruta de campo; IDs estables; catálogo con propiedades/unidades                                                                              | Pendiente |
| 03   | Editor 2D                    | Paredes, puertas, equipos, grid, inspector, undo/redo, import/export | Dibujo por arrastre; snap; multi-select; validar dimensiones; guardar/cargar escenario versionado                                                                               | Pendiente |
| 04   | Motor de simulación          | Motor determinista de eventos discretos                              | Reloj que no retrocede; orden estable `(time, priority, sequence)`; semilla reproducible; pausa/paso/velocidad sin alterar resultados; liberación correcta de recursos          | Pendiente |
| 05   | Equipos, recetas, inventario | Capacidad, existencias y tiempos configurables                       | Máquinas de estado de equipos (`off…cleaning`); recetas con pasos/paralelismo; stock con reserva/consumo/reposición                                                             | Pendiente |
| 06   | Agentes, decisiones, flujos  | Personas con reglas propias y registro explicable                    | `observationSummary`/`chosenAction`/`ruleId`/`blockedBy`/`nextExpectedAction`; prioridades editables; tareas secundarias en ocio                                                | Pendiente |
| 07   | Movilidad y congestión       | Rutas, obstáculos, zonas, colisiones                                 | A* sobre grid; tolerancia de llegada al punto de interacción; registro de distancias/bloqueos; congestión básica                                                                | Pendiente |
| 08   | Clientes y operación         | Salón, cocina, pizzería, bar, VIP, fregado, limpieza                 | Llegada/espera/llamada de clientes; mesa limpia/ocupada/sucia; pedidos completos de extremo a extremo; ayuda entre roles                                                        | Pendiente |
| 09   | Métricas y experimentos      | Cuellos de botella y escenarios comparables                          | Mediana/percentiles; utilización; p90 de cola; A/B con misma semilla; exportación reproducible                                                                                  | Pendiente |
| 10   | Vista 3D                     | Observación Three.js del mismo estado                                | Se construye desde los mismos datos; órbita/zoom/selección; sin lógica ni reloj propios; fallo de WebGL no rompe 2D                                                             | Pendiente |
| 11   | QA final y entrega           | Auditoría funcional completa + documentación de uso                  | Matriz de aceptación global verificada; README de uso; primera versión web reproducible                                                                                         | Pendiente |

## Deuda técnica y postergaciones (ninguna aún)

| ID  | Descripción | Motivo | Riesgo | Fase prevista | Condición para retomar |
| --- | ----------- | ------ | ------ | ------------- | ---------------------- |
| —   | —           | —      | —      | —             | —                      |

## Tareas transversales permanentes

- [ ] Mantener `THIRD_PARTY_NOTICES.md` e inventario de dependencias actualizado en cada adición.
- [ ] Mantener el informe de licencias del CI en verde (sin licencias desconocidas/no permitidas).
- [ ] No subir secretos: revisar artefactos de Actions antes de cada cierre de fase.
- [ ] Actualizar este backlog al cerrar cada fase.
