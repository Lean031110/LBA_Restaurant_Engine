# FASE 01 — Base web ejecutable, toolchain, CI y diagnóstico

**Objetivo:** Crear un esqueleto web mínimo y fácil de ejecutar localmente, con código tipado, registro estructurado y GitHub Actions.

**Precondición:** FASE 00 aprobada.

**Archivos/módulos que normalmente se tocarán:** `apps/web`, workspace/package.json, `.nvmrc`, tsconfig, Vite, React, test config, `.github/workflows`, `docs/evidence/PHASE-01.md`, notices/licence.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 01.1 — A — Bootstrap mínimo

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 01. No avances a otra iteración automáticamente.
>
> Lee FASE 00 y la arquitectura. Inicializa workspace con npm workspaces y React+TypeScript+Vite (o conserva herramienta existente si está bien justificada). Verifica primero la versión Node LTS vigente en la fuente oficial y pinéala en `.nvmrc` y Actions. Fija lockfile. Construye una pantalla base minimalista con nombre LBA_Restaurant_Engine y paneles vacíos marcados como futuros. Debe arrancar con comandos documentados. No construir todavía el editor ni motor.

</details>

## Prompt 01.2 — B — Calidad y logging

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 01. No avances a otra iteración automáticamente.
>
> Añade scripts de formato/lint, typecheck, unit tests y build; integra Vitest y un logger de aplicación con niveles, eventCode, módulo, timestamp UTC, traceId opcional y sanitización. Añade un límite de error de UI y un panel/descarga de logs de diagnóstico mínimo. No registrar cada frame ni secretos. Crea la carpeta/documentación third-party y licencia propia MIT con titular `Leandro (@lean0311g)` solo después de documentar la nota sobre atribución y verificar el contexto legal del usuario.

</details>

## Prompt 01.3 — C — GitHub Actions

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 01. No avances a otra iteración automáticamente.
>
> Implementa workflow CI para push/PR/manual: instalación reproducible, lint, typecheck, tests, coverage y build; sube reportes/logs como artefactos incluso ante fallo. Emplea permisos mínimos y acciones estables verificadas, preferiblemente pin por SHA completo, sin inventar SHA. Añade prueba de configuración/escaneo de dependencias según herramienta elegida. No usar `continue-on-error` para hacer aparecer verde un paso crítico. Ejecuta localmente todas las tareas posibles.

</details>

## Prompt 01.4 — D — Auditoría de salida

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 01. No avances a otra iteración automáticamente.
>
> Prueba el flujo real desde una instalación limpia (`npm ci`, tests, build y arranque documentado), revisa permisos de Actions, logs, secretos y artefactos. Prueba al menos un error controlado y comprueba que se registra con código de evento y puede descargarse. Confirma que CI corrió sobre el SHA exacto. Cierra FASE 01 o deja los fallos bloqueando la fase 02.

</details>

## Criterios obligatorios de salida

- [ ] La app arranca localmente desde instrucciones de README.
- [ ] Lockfile y Node fijado; scripts de lint, tipos, test y build reproducibles.
- [ ] CI se dispara en push/PR/manual y conserva resultados aun ante error.
- [ ] Logger estructurado, sin secretos, con exportación local y errores comprensibles.
- [ ] No existe dependencia de runtime externa ni módulo de simulación falso.

## Pruebas mínimas requeridas

- [ ] npm ci desde limpio; lint; typecheck; unit tests; cobertura; build.
- [ ] Smoke test de arranque y navegación básica en navegador.
- [ ] Test de error controlado y sanitización de logs.
- [ ] Comprobar artefactos y contenido real del run de Actions.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-01.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.
