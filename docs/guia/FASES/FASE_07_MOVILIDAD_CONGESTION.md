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
