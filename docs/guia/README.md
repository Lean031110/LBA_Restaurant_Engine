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
