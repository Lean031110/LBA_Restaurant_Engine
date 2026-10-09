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
