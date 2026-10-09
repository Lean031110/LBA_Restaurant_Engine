# FASE 03 — Editor 2D de plano profesional y minimalista

**Objetivo:** Crear la superficie de trabajo principal del usuario: canvas 2D, herramientas sencillas, presets, inspector y operaciones reversibles.

**Precondición:** FASE 02 aprobada.

**Archivos/módulos que normalmente se tocarán:** `packages/editor-2d`, UI web, adaptadores de dominio, pruebas del editor, capturas en artefactos.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 03.1 — A — Arquitectura de interacción

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 03. No avances a otra iteración automáticamente.
>
> Diseña el layout: barra izquierda de herramientas, lienzo central, inspector contextual derecho, toolbar superior y panel de mensajes/estado discreto. Implementa el canvas con Konva/React Konva. Define herramientas `select`, `wall`, `door`, `window`, `object`, `zone`, `measure`, `delete`; cuadrícula y unidades visibles. Pared: usuario arrastra desde un inicio hasta un final; no hace falta dibujar cada segmento con múltiples clics. Todavía no simules agentes.

</details>

## Prompt 03.2 — B — Editor básico funcional

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 03. No avances a otra iteración automáticamente.
>
> Implementa selección, mover, rotar, duplicar, borrar, zoom/pan, ajuste a cuadrícula configurable, selección múltiple, inspector de propiedades, presets de color/material, tamaños predefinidos, anular/rehacer, guardar/cargar escenario JSON. Puertas y ventanas deben interactuar con los muros a nivel visual y tener orientación/dirección de apertura. Evita hacer todas las propiedades visibles al mismo tiempo: básicas arriba, avanzadas plegadas. Conecta botones reales, no placeholders.

</details>

## Prompt 03.3 — C — Manejo de errores y usabilidad

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 03. No avances a otra iteración automáticamente.
>
> Añade validaciones de dimensión, selección, snapping sin saltos inesperados, advertencia de solapamiento, teclado para accesibilidad, instrucciones de uso/atajos, confirmación para borrado masivo y autosave local si su alcance está definido. Asegura que las zonas/estaciones tengan nombre y etiquetas. No afirmar que las colisiones arquitectónicas ya son físicamente correctas; el editor solo representa geometría. Incluye estados vacíos y mensajes.

</details>

## Prompt 03.4 — D — Pruebas y auditoría visual

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 03. No avances a otra iteración automáticamente.
>
> Escribe test de cada herramienta, propiedad y botón a través de pruebas de componente e integración; Playwright cubre crear pared por arrastre, colocar una puerta, mover una mesa, cambiar su propiedad, guardar y recargar. Genera capturas CI de escenario antes/después. Usa inspección por teclado/zoom y verifica que errores no destruyan el escenario. Cierra solo si los controles están conectados y las evidencias muestran la app real.

</details>

## Criterios obligatorios de salida

- [ ] Crear pared arrastrando inicio-fin; elegir presets de puerta/ventana y soltar objetos.
- [ ] Propiedades y materiales editables; ubicación/unidades independientes de píxeles.
- [ ] Seleccionar, mover, rotar, duplicar, borrar, zoom/pan, grid, undo/redo y multi-selección funcionan.
- [ ] Guardar/recargar produce el mismo escenario; errores no pierden datos.
- [ ] Inventario de controles y pruebas para cada herramienta/botón/propiedad.

## Pruebas mínimas requeridas

- [ ] Unitarios de transformaciones y conversiones mundo-píxel.
- [ ] Tests de herramienta/propiedad, límites y undo/redo.
- [ ] Playwright crea/edita/guarda/recarga una escena.
- [ ] Capturas en CI y revisión de consola/errores de navegador.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-03.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.
