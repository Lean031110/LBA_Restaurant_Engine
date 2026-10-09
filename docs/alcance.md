# Alcance del proyecto LBA_Restaurant_Engine

Este documento cierra el alcance acordado para la construcción del simulador. Deriva de `docs/guia/README.md` (paquete maestro) y se corresponde con la FASE 00 de la guía. Cualquier cambio de alcance futuro requiere un ADR y la actualización de este archivo.

## Objetivo del producto

Construir un **simulador profesional de operaciones de restaurante** que ayude a identificar cuellos de botella antes de abrir o reorganizar un negocio. El producto se centra primero en:

1. Un **editor 2D** capaz de dibujar el local (paredes, puertas, ventanas, mesas, equipos y zonas) desde un catálogo predefinido, con ajuste a cuadrícula, inspector de propiedades e importación/exportación de escenarios versionados.
2. Un **motor de simulación determinista de eventos discretos**, separado de la interfaz, donde clientes, dependientes, cocineros, pizzeros, bartenders, luncheros y fregadores desarrollan trabajos realistas con reglas de decisión explicables.
3. Una **vista 3D de observación** (fase 10) que lee el mismo estado del simulador; no es un segundo motor.

## Dentro del alcance ahora

- Aplicación web ejecutable **localmente** con Node.js: React + TypeScript + Vite (workspace npm).
- Editor 2D con Konva/React Konva (fase 03).
- Motor propio TypeScript de eventos discretos con semilla reproducible (fase 04).
- Modelo de dominio de restaurante: escenarios, objetos, zonas, pedidos, recetas, equipos, inventario, tareas, agentes y flujos por rol (fases 02, 05, 06).
- Movilidad con A* sobre grid/grafo, obstáculos y congestión básica (fase 07).
- Operación completa del restaurante: clientes, salón, cocina, pizzería, bar, fregado, limpieza y asistencia entre roles (fase 08).
- Métricas, colas, percentiles y experimentos A/B comparables (fase 09).
- Vista 3D con Three.js, de solo lectura respecto al estado (fase 10).
- QA final, documentación de uso y entrega reproducible (fase 11).
- CI con GitHub Actions: lint, typecheck, tests, cobertura, build, auditoría de licencias y artefactos de evidencia.
- Persistencia local (IndexedDB o almacenamiento estructurado) + import/export JSON.

## Fuera del alcance ahora (exclusiones deliberadas)

| Exclusión                                                                         | Motivo                                                                                                                                | Condición para retomar                                                |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| APK, instalador Windows, app nativa Linux, móvil Android                          | El compromiso actual es web local; empaquetar añade coste sin validar todavía el núcleo                                               | Aprobar fase 11 y decidir con ADR                                     |
| Multijugador y sincronización en la nube                                          | Rompería la reproducibilidad local y añade servidores/costes                                                                          | Aprobación explícita post-fase 11                                     |
| Sensores físicos                                                                  | Fuera del dominio de un simulador de eventos discretos                                                                                | No previsto                                                           |
| IA externa obligatoria (LLM por agente/tick)                                      | Los agentes son reglas, máquinas de estados y planificación explicable; una API remota rompe localidad, reproducibilidad y privacidad | Solo como auxiliar opcional en el futuro, verificado por el simulador |
| Servidor comercial, cuentas de pago, dependencia de Internet durante la ejecución | Requisito de producto: gratuito y local                                                                                               | No previsto                                                           |
| Motor de juego completo, editor de terceros incrustado, código GPL/AGPL           | Política de licencias permisiva del proyecto (MIT/Apache/BSD/ISC/zlib)                                                                | Excepciones solo vía ADR aprobado                                     |
| Declaración de inocuidad alimentaria, accesibilidad normativa o seguridad física  | Una simulación con valores estimados no certifica la realidad; los valores son editables y etiquetados por procedencia                | Nunca sin medición y revisión competente                              |

## Reglas de trabajo que gobiernan el alcance

1. **No saltar fases**: la fase activa es la única autorizada (secuencia 00→11).
2. **Una interacción = un prompt numerado** de la guía.
3. **No declarar éxito sin evidencia**: comando, resultado real, conteos, artefactos y URL de Actions.
4. **CI obligatorio** y **sin merge automático**: los cambios van por rama + PR; el merge final lo decide el usuario.
5. **Licencias comprobadas antes de instalar** cualquier paquete o activo.
6. **Separación modelo/presentación**: el motor no importa React, DOM, Konva ni Three.js.
7. **Dos sistemas de registro diferenciados**: log diagnóstico de la app e historial de eventos de simulación.

## Fuente de verdad

La guía maestra completa e inalterada vive en `docs/guia/`. Si este archivo contradice a la guía, gana la guía.
