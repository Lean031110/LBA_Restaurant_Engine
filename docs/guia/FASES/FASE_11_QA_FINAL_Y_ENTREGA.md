# FASE 11 — Auditoría funcional, estabilidad, documentación y entrega web

**Objetivo:** Probar el producto como un conjunto, cerrar defectos, asegurar reproducibilidad y dejar instrucciones para ejecutarlo localmente.

**Precondición:** FASES 00–10 aprobadas o excepciones explícitas aprobadas con ADR; ninguna deficiencia crítica de dominio debe quedar encubierta.

**Archivos/módulos que normalmente se tocarán:** Todo el repositorio, tests, CI, README de usuario/desarrollador, `THIRD_PARTY_NOTICES.md`, docs/evidence.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 11.1 — A — Auditoría del inventario

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 11. No avances a otra iteración automáticamente.
>
> Construye un inventario real de cada botón, herramienta, acción del teclado, propiedad editable, tipo de objeto, transición de equipo, rol, tarea, panel, import/export, control de simulación y funcionalidad 3D. Relaciónalo con test existente, archivo y estado. Detecta controles sin acción, propiedades que no persisten y rutas de código sin ejecutar. No empieces arreglando hasta priorizar por severidad.

</details>

## Prompt 11.2 — B — Pruebas integrales y fallos

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 11. No avances a otra iteración automáticamente.
>
> Ejecuta desde entorno limpio tests unitarios/integración/e2e, typecheck, lint, build, auditoría de licencias/dependencias y escenarios de stress. Prueba errores de usuario, archivos inválidos, reinicios, cargas grandes, multiagente, deadlocks y exportación. Verifica que el workflow conserva las pruebas fallidas. Repara defectos críticos/altos dentro de la fase, uno por uno, y añade test de regresión por cada bug.

</details>

## Prompt 11.3 — C — Usabilidad, accesibilidad y recuperación

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 11. No avances a otra iteración automáticamente.
>
> Revisa mensajes, teclado, foco, contraste razonable, zoom, texto de errores, panel de agente, navegación entre áreas, estados de carga y fallback si WebGL falla. Asegura que guardar/exportar y recuperar un escenario funciona y que logs no contienen datos privados. Revisa README de usuario: requisitos, instalación, ejecución (`npm ci`, `npm run dev`), tests, import/export, limitaciones, parámetros y resolución de errores comunes.

</details>

## Prompt 11.4 — D — Auditoría de licencias y supply chain

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 11. No avances a otra iteración automáticamente.
>
> Verifica todas las dependencias directas/transitivas, acciones GitHub, iconos, fuentes, imágenes, modelos, texturas y sonidos con la política de `02_RECURSOS_LICENCIAS_Y_PARAMETROS.md`. Regenera notices e informe. Corrige dependencias no verificadas o detén el release por ellas. Comprueba URLs de fuentes, lockfile, secrets, permisos de Actions y que no hay llamadas de red necesarias durante runtime.

</details>

## Prompt 11.5 — E — Cierre final

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 11. No avances a otra iteración automáticamente.
>
> Ejecuta CI final en el SHA candidate exacto, revisa su URL y todos sus artifacts. Actualiza matriz de aceptación y notas de versión; enumera limitaciones no resueltas. No llames “completo” a algo no probado en dispositivo físico. Deja rama/PR con verificación completa conforme a la política de integración (autorización expresa del propietario, 2026-10-09): el merge queda prohibido si algún criterio obligatorio no está en PASS; no empaquetes instaladores nativos. La fase solo se aprueba si todos los criterios obligatorios de esta fase son PASS o si una excepción de alcance documentada está aprobada explícitamente por el usuario.

</details>

## Criterios obligatorios de salida

- [ ] Matriz completa de controles/propiedades/roles/estados con tests y evidencia.
- [ ] CI verde en el SHA candidato y artefactos revisados; sin pasos críticos omitidos.
- [ ] Dependencias/licencias/activos auditados y notices completos.
- [ ] Instalación limpia y ejecución web documentadas y reproducibles.
- [ ] Limitaciones físicas/térmicas/de CI declaradas; no se afirma certificación del mundo real.
- [ ] No se han añadido instaladores nativos, Android ni servicios en nube sin aprobación.

## Pruebas mínimas requeridas

- [ ] CI completa, incluyendo tests de regresión de todos los bugs críticos/altos.
- [ ] Matriz de interacción UI con resultado por control/propiedad.
- [ ] Smoke test de principio a fin: diseñar local, crear pedido, simular, pausar, inspeccionar agente, métricas, guardar/cargar/exportar.
- [ ] Escenarios de pico, bloqueo, falta de stock y error de archivo.
- [ ] Auditoría de licencias, seguridad, logs y ausencia de red obligatoria.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-11.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.
