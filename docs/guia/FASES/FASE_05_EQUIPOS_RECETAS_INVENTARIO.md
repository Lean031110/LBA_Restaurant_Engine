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
