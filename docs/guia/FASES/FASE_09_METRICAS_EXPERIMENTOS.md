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
