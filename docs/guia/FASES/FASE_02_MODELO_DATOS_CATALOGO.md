# FASE 02 — Modelo de datos validado y catálogo de objetos predefinidos

**Objetivo:** Definir escenarios versionados y objetos de restaurante con propiedades comunes, unidades y presets editables antes de construir interacciones de canvas complejas.

**Precondición:** FASE 01 aprobada.

**Archivos/módulos que normalmente se tocarán:** `packages/domain`, `packages/restaurant-model` (modelos base), `packages/asset-catalog`, `scenarios/fixtures`, docs de esquema y pruebas.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 02.1 — A — Esquema del escenario

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 02. No avances a otra iteración automáticamente.
>
> Diseña tipos y validadores para Scenario, WorldObject, Zone, Agent, TaskTemplate, Equipment, Order, Recipe e InventoryItem. Incluye schemaVersion, IDs estables, coordenadas en unidades del mundo, unidades explícitas y mensajes de error con ruta del campo. Implementa solo los tipos/esquemas y ejemplos mínimos. No construir el editor ni motor de eventos. Añade fixtures válido e inválidos.

</details>

## Prompt 02.2 — B — Catálogo/presets

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 02. No avances a otra iteración automáticamente.
>
> Crea un catálogo declarativo separado del código UI: paredes, puertas de presets (madera/metal/vidrio y tamaños), ventanas, mesas/sillas, mostrador, cocina, plancha, freidora, hornos/horno pizza, nevera/congelador, batidora, fregadero/lavavajillas, impresora/POS, bandejas, estaciones, barra, baño, salida, almacén, zonas VIP y áreas funcionales. Cada preset tiene dimensiones, huella, punto de interacción, propiedades editables, material/color sugerido, unidad, límites y metadata del parámetro. Evita descargar decenas de assets ahora; iconos vectoriales simples sirven para los placeholders.

</details>

## Prompt 02.3 — C — Importación, migración y licencia

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 02. No avances a otra iteración automáticamente.
>
> Implementa parse/validate de JSON y un formato exportable de escenario. Debe rechazar JSON mal formado, versiones desconocidas, IDs duplicados, valores fuera de rango, posiciones no finitas y unidades inválidas sin dañar el escenario actual. Define una política inicial de migraciones sin pérdida silenciosa. Verifica licencia de cada dependencia/asset añadido y actualiza THIRD_PARTY_NOTICES.

</details>

## Prompt 02.4 — D — Auditoría de salida

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 02. No avances a otra iteración automáticamente.
>
> Escribe pruebas de validación, esquemas y presets; prueba serialización/deserialización con ida y vuelta preservando propiedades. Verifica campos para futura extensibilidad: propiedades avanzadas y campos desconocidos se tratan según el contrato explícito, no se descartan silenciosamente. Guarda evidencia, tests y una tabla de presets. No avances a editor 2D si el modelo de datos es ambiguo.

</details>

## Criterios obligatorios de salida

- [ ] Tipos y validadores para las entidades obligatorias, IDs estables y schemaVersion.
- [ ] Catálogo declarativo de objetos predefinidos y propiedades/unidades documentadas.
- [ ] Import/export conserva el escenario y muestra errores con rutas de campo.
- [ ] Fixtures negativos cubren corrupción, límites, IDs duplicados y versión desconocida.
- [ ] Inventario de licencias actualizado; no hay asset no verificado.

## Pruebas mínimas requeridas

- [ ] Round-trip JSON con comparaciones profundas.
- [ ] Property-based o tabla de rangos si está disponible; mínimo equivalentes deterministas.
- [ ] Validación de cada tipo de objeto del catálogo.
- [ ] Pruebas de migración/versión y de no mutación al fallar una carga.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-02.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.
