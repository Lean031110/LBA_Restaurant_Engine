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
