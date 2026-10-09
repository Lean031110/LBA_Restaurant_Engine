# FASE 10 — Vista 3D de observación del mismo escenario

**Objetivo:** Permitir observar el local desde diferentes ángulos y seguir la simulación con la misma fuente de verdad que el editor 2D.

**Precondición:** FASES 03–09 aprobadas o criterios específicos documentados como precondición parcial; el motor y el mapa 2D deben funcionar.

**Archivos/módulos que normalmente se tocarán:** `packages/view-3d`, catálogo de meshes/asset metadata, puente de estado de solo lectura, tests de sincronización.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 10.1 — A — Extrusión y cámara

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 10. No avances a otra iteración automáticamente.
>
> Usa Three.js para convertir paredes, suelo, puertas, ventanas, mesas, equipos y zonas del escenario a objetos visuales ligeros. La vista debe mostrar planta/extrusión razonable, orbitar, rotar, acercar/alejar, restablecer cámara y elegir vistas ortográficas/perspectiva. No crear un editor 3D de construcción ni otra fuente de datos; los cambios estructurales se siguen haciendo en 2D.

</details>

## Prompt 10.2 — B — Personas y estados animados

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 10. No avances a otra iteración automáticamente.
>
> Representa personas por placeholders locales simples primero; su posición, orientación y estado vienen del motor/navegación 2D. Los objetos cambian visualmente entre apagado, calentando/listo/ocupado/lavado cuando exista un evento de dominio real. No inventar movimientos independientes que atraviesen paredes. Carga recursos solo desde archivos locales registrados con licencia.

</details>

## Prompt 10.3 — C — Sincronización y límites

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 10. No avances a otra iteración automáticamente.
>
> Añade sincronización al pausar, paso único, acelerar, reset y selección de agente/pedido entre las vistas 2D y 3D. La vista puede ser desactivada si el dispositivo/browser no soporta WebGL. Un error 3D no debe bloquear la simulación ni impedir abrir el editor 2D. Evita materiales/texturas enormes; documenta budget y fallback.

</details>

## Prompt 10.4 — D — Tests

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 10. No avances a otra iteración automáticamente.
>
> Añade pruebas que comparen posiciones/estados de un agente y equipos entre fuente de verdad y vista 3D; smoke test de carga, selección, cámara, pausa y reset. Ejecuta tests donde WebGL no esté disponible o no se pueda correr en CI, y declara la limitación real; no simules aprobación gráfica con un mock estático. Adjunta capturas en CI compatible o registra prueba manual repetible.

</details>

## Criterios obligatorios de salida

- [ ] 3D es opcional y de observación; motor/datos no dependen de Three.js.
- [ ] La vista 3D sigue las mismas posiciones, tareas, estados y reloj del motor.
- [ ] Cámara, zoom, perspectiva/ortográfica y selección funcionan.
- [ ] Error en 3D no derriba editor ni simulación 2D.
- [ ] Activos locales y licencias documentadas; carga/rendimiento razonables.

## Pruebas mínimas requeridas

- [ ] Tests de sincronización de estado 2D/3D con fixtures conocidos.
- [ ] Playwright smoke test en navegador compatible y prueba de fallback.
- [ ] Medición de tamaño/carga de assets y no dependencia de CDN.
- [ ] Evidencia de captura/video real y límites de CI explicados.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-10.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.
