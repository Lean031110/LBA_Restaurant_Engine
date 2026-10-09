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
