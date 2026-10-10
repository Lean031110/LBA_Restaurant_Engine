# Cierre de fase 01 — Base web ejecutable, toolchain, CI y diagnóstico

- Estado: `APROBADA` — PR #2 **fusionado en `main`** (squash `b7fe430f4d9399c4a571dea4947d1858f5e0530b`) el 2026-10-09 conforme a la política de integración verificada; CI post-merge en verde
- Fecha UTC: 2026-10-09
- Rama y PR: `feat/phase-01-base-tecnica` (apilada sobre `feat/phase-00-contrato`) → PR #2: https://github.com/Lean031110/LBA_Restaurant_Engine/pull/2
- Commit SHA exacto (código de la fase): `f494283bd403d6a99cb0c029e808f6058b31f7f2` — runs en verde: 37950646517 (sobre `24ee124a`) y 37950848683 (sobre `f494283b`)
- Integración de `main` tras el squash del PR #1: merge `2d891ab` (resolución de conflictos documentada abajo) + actualización documental `07b5101` (política de merge del 2026-10-09)
- Integración final del PR #2: squash `b7fe430` en `main` (2026-10-09T16:14:36Z); SHA final verificado `eff7f731b4dff2710cbf4b4f414d78edac0de30d` con runs en verde 37957357148 (push, 17/17 pasos) y 37957364663 (pull_request, 15/15 pasos); CI post-merge en `main`: https://github.com/Lean031110/LBA_Restaurant_Engine/actions/runs/37957686994 — **completed/success** con artefactos `lba-ci-evidence-b7fe430f4d9399c4a571dea4947d1858f5e0530b` (109 072 B) y `lba-build-b7fe430f4d9399c4a571dea4947d1858f5e0530b` (72 998 B)
- Workflow de GitHub Actions: «CI» — https://github.com/Lean031110/LBA_Restaurant_Engine/actions/runs/37950848683 — resultado **completed/success** sobre el SHA exacto citado (verificado vía API: 15/15 pasos en success y 2 artefactos)
- Artefacto(s) de evidencia: `lba-ci-evidence-f494283bd403d6a99cb0c029e808f6058b31f7f2` (109 078 bytes: JUnit, cobertura, informes de licencias, smoke HTML) y `lba-build-f494283bd403d6a99cb0c029e808f6058b31f7f2` (72 998 bytes: build de producción)
- Archivo de fase y revisión: `docs/guia/FASES/FASE_01_BASE_TECNICA_CI_LOGS.md` (prompts 01.1–01.4 ejecutados de forma consolidada por autorización expresa del usuario)

## Cambios realizados

| Archivo/módulo                                           | Cambio                                                                                                                                                                                                                          | Requisito relacionado         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `package.json` + `package-lock.json`                     | Workspace npm raíz (`apps/*`, `packages/*`), scripts dev/build/typecheck/lint/format/test/audits, engines Node 24                                                                                                               | Prompts 01.1 A, 01.2 B        |
| `.nvmrc`                                                 | Node 24.21.0 fijado (versión LTS verificada en el entorno local y usada por Actions vía `node-version-file`)                                                                                                                    | Prompt 01.1 A                 |
| `apps/web/`                                              | Aplicación React 19.3 + TypeScript 6.0.3 + Vite 8.3.4: pantalla base con layout de la guía (regla 15), paneles de fases futuras deshabilitados con fase prevista (regla 16)                                                     | Prompt 01.1 A                 |
| `apps/web/src/logger/`                                   | Logger estructurado: niveles debug/info/warn/error, `eventCode`, módulo, `timestampUtc` ISO, `traceId`, sanitización de secretos con `[REDACTED]`, búfer circular con suscripción, exportación JSONL local                      | Prompt 01.2 B                 |
| `apps/web/src/components/ErrorBoundary.tsx`              | Límite de errores con `APP_UNHANDLED_ERROR`, mensaje con código legible y acción sugerida                                                                                                                                       | Prompt 01.2 B                 |
| `apps/web/src/components/LogPanel.tsx`                   | Panel de diagnóstico: listado, botón «Provocar error controlado», exportar JSONL, limpiar                                                                                                                                       | Prompt 01.2 B / 01.4 D        |
| `eslint.config.mjs`, `.prettierrc`                       | ESLint 10 flat + typescript-eslint + react-hooks/react-refresh; Prettier 3                                                                                                                                                      | Prompt 01.2 B                 |
| `apps/web/vite.config.ts`                                | Vitest 5 con jsdom, cobertura v8 (umbrales líneas 75 / ramas 70), reporte JUnit                                                                                                                                                 | Prompt 01.2 B / guía 03       |
| `.github/workflows/ci.yml`                               | CI en push/PR/manual: npm ci, formato, lint, typecheck, tests+cobertura, build, smoke preview, auditoría de licencias, npm audit; artefactos con `if: always()`; permisos `contents: read`; acciones fijadas por SHA verificado | Prompt 01.3 C                 |
| `scripts/audit-licenses.mjs`                             | Auditoría de licencias sin dependencias externas; falla ante licencias desconocidas/no permitidas                                                                                                                               | Guía 02 (política 7)          |
| `docs/decisions/ADR-0002-licencias-transitivas-build.md` | Evaluación y aprobación de 5 excepciones transitivas (MIT-0, CC-BY-4.0 datos, MPL-2.0 solo build)                                                                                                                               | Guía 02 (excepciones con ADR) |
| `THIRD_PARTY_NOTICES.md`                                 | Inventario de dependencias con versión, licencia, URL y finalidad; atribuciones                                                                                                                                                 | Prompt 01.2 B                 |
| `README.md`, `docs/backlog.md`                           | Estado de fases e instrucciones de ejecución actualizadas                                                                                                                                                                       | Prompt 01.1 A                 |

## Tests ejecutados

### Local (entorno de desarrollo, Node v24.21.0)

| Comando                     | Resultado real | Conteo/detalle                                                                                                                          | Evidencia                                  |
| --------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `npm ci`                    | OK             | 236 paquetes añadidos / 238 auditados, 0 vulnerabilidades (cifras corregidas y re-verificadas el 2026-10-09 tras la integración)        | Salida de consola del entorno              |
| `npm run format:check`      | OK             | «All matched files use Prettier code style!»                                                                                            | Salida de consola                          |
| `npm run lint`              | OK             | 0 errores, 0 avisos                                                                                                                     | Salida de consola                          |
| `npm run typecheck`         | OK             | `tsc --noEmit` sin errores                                                                                                              | Salida de consola                          |
| `npm test`                  | OK             | **33/33 pruebas superadas** (6 archivos)                                                                                                | JUnit en `apps/web/test-results/junit.xml` |
| Cobertura (mismo comando)   | OK             | 96,07 % líneas · 94,11 % sentencias · 88,52 % ramas · 97,56 % funciones (umbrales: 75/75/70/75; etiquetas líneas/sentencias corregidas) | `apps/web/coverage/`                       |
| `npm run build`             | OK             | 22 módulos → dist (JS 228,12 kB / gzip 71,90 kB; CSS 3,52 kB)                                                                           | Salida de consola                          |
| Smoke `vite preview` + curl | OK             | HTTP 200 con `<title>LBA_Restaurant_Engine</title>` y `id="root"`                                                                       | `/tmp/smoke.html` en entorno local         |
| `npm run audit:licenses`    | OK             | 228 paquetes auditados; 5 excepciones aprobadas por ADR-0002 (cifra corregida y re-verificada)                                          | `reports/license-report.md`                |
| `npm run audit:security`    | OK             | «found 0 vulnerabilities»                                                                                                               | Salida de consola                          |

### GitHub Actions (remoto, SHAs `24ee124a` y `f494283b`; ambos runs en verde con artefactos)

| Paso del workflow                       | Resultado | Nota                                    |
| --------------------------------------- | --------- | --------------------------------------- |
| Instalar Node LTS según `.nvmrc`        | success   | Node 24.21.0                            |
| `npm ci`                                | success   | Instalación reproducible desde lockfile |
| Comprobar formato (Prettier)            | success   |                                         |
| Lint (ESLint)                           | success   |                                         |
| Typecheck (TypeScript)                  | success   |                                         |
| Tests con cobertura (JUnit)             | success   | 33/33                                   |
| Build de producción (Vite)              | success   |                                         |
| Smoke test del arranque (preview)       | success   | Página servida y verificada             |
| Auditoría de licencias                  | success   | 115 paquetes, 5 excepciones ADR-0002    |
| Auditoría de seguridad (npm audit high) | success   | 0 vulnerabilidades                      |
| Subir evidencias / build                | success   | 2 artefactos publicados                 |

Prueba de error controlado (prompt 01.4 D): el botón «Provocar error controlado» registra una entrada `APP_ERROR_DEMO` con claves `fakeGithubToken`/`fakePassword`/`nested.apiKey` sanitizadas a `[REDACTED]`, verificada por la prueba `LogPanel > el error controlado se registra...`. El ErrorBoundary registra `APP_UNHANDLED_ERROR` con stack (prueba `ErrorBoundary > registra APP_UNHANDLED_ERROR...`). La exportación JSONL se verifica en `LogPanel > exporta el registro...` y `downloadJsonl`.

## Integración con `main` y resolución de conflictos (2026-10-09)

Tras la fusión del PR #1 (squash `15455d6`), GitHub informó este PR como `mergeable=false / dirty`: la rama estaba apilada sobre la FASE 00 y el squash no comparte historial con ella. Resolución ejecutada:

- Verificado primero que el squash del PR #1 fue limpio: `git diff origin/main 44e53ab` es vacío (el árbol de `main` coincide exactamente con el contenido aprobado de FASE 00).
- `git merge origin/main` en `feat/phase-01-base-tecnica` (merge `2d891ab`): 8 archivos en conflicto (README.md y add/add en SECURITY.md, alcance, mapa-módulos, backlog, ADR-0001, PHASE-00.md, riesgos).
- Cada conflicto se resolvió con la versión de FASE 01 tras revisar huno a huno los 8 deltas: formato Prettier (tablas alineadas, cursivas) y actualizaciones legítimas de la fase (estados, README activo, `.gitignore` de `reports/`), sin sobrescribir información aprobada de FASE 00.
- Prueba de no pérdida: el árbol resultante del merge es **idéntico** al de `f494283` (`git diff --cached f494283` vacío antes de confirmar); ningún archivo eliminado para resolver conflictos; sin `reset --hard`, sin reescritura de historial publicado y sin force-push.
- Verificación local completa repetida tras la integración: 9/9 pasos OK (npm ci, formato, lint, typecheck, 33/33 pruebas, build, smoke, auditoría de licencias, auditoría de seguridad).

## Auditoría de seguridad del incidente del token (2026-10-09)

Revisión exhaustiva del incidente del fixture (token real usado en una prueba del primer intento de push; el push fue rechazado por la protección de secretos de GitHub y el token nunca llegó al repositorio):

- **Local**: se localizaron restos del token real únicamente en objetos git inalcanzables (3 commits del intento descartado + 1 blob suelto, accesibles solo vía reflog). Se purgaron con `git reflog expire --expire=now --expire-unreachable=now --all` + `git gc --prune=now`. Verificación posterior: **0 coincidencias** del token real en TODOS los objetos de la base git; el árbol de trabajo y todas las ramas quedaron intactos (puntas idénticas antes/después de la purga).
- **Remoto**: escaneo del tarball de `main`, tarball de la rama, logs de los runs 37950646517 y 37950848683 y los 4 artefactos publicados: **0 coincidencias** del token real; la única cadena `github_pat_*` publicada es el prefijo literal de 11 caracteres del sanitizador en `core.ts` (código legítimo, sin valor de credencial).
- **Pendiente del propietario**: rotación del token en GitHub (Settings → Developer settings → Fine-grained tokens). Un PAT fine-grained no puede rotarse vía API por el propio agente; el token jamás se volvió a copiar en archivos, comandos, logs ni conversaciones. _(Actualización 2026-10-09: el entorno del agente se reinició entre sesiones y el credential store local fue eliminado con él; verificación posterior: no existe token alguno en `~/.git-credentials`, `~/.netrc`, configuración de gh ni variables de entorno — la superficie de exposición local es cero. La rotación en GitHub sigue siendo necesaria para cerrar el incidente, porque el valor pudo quedar comprometido antes.)_ El incidente no se considera cerrado hasta esa rotación.
- **Actualización (2026-10-09, instrucción del propietario)**: mientras la rotación no se confirme, quedan **suspendidas todas las operaciones remotas de escritura** con la credencial antigua (sin push, sin crear PR y sin ejecutar merges). El trabajo correctivo posterior (iteración 02.1 de FASE 02) se prepara y verifica íntegramente en local; su publicación espera a que el propietario revoque el token antiguo y configure una credencial nueva. La fecha de rotación se registrará aquí cuando el propietario la confirme; hasta entonces el incidente permanece **ABIERTO**. _(Corrección de registro: una versión previa de este acta fechaba la instrucción el 2026-10-10 por un desfase del reloj local del agente; la fecha verificable del evento es 2026-10-09 UTC — la instrucción llegó tras el merge del PR #4 a las 16:33:08Z y antes del primer commit correctivo local de las 18:06:39Z, ambos del 2026-10-09.)_

## Criterios de salida

| ID  | Criterio                                                                         | Estado | Evidencia concreta                                                                                                                                                                     |
| --- | -------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | La app arranca localmente desde instrucciones de README                          | PASS   | `npm run dev` documentado; smoke local y en CI (paso «Smoke test del arranque») con HTTP 200 y contenido esperado                                                                      |
| 2   | Lockfile y Node fijados; scripts de lint, tipos, test y build reproducibles      | PASS   | `.nvmrc` 24.21.0; `engines >=24.21.0 <25`; `package-lock.json` comprometido; `npm ci` verde local y en Actions                                                                         |
| 3   | CI se dispara en push/PR/manual y conserva resultados aun ante error             | PASS   | Run 37950646517 en push (triggers `pull_request`/`workflow_dispatch` configurados); pasos de subida con `if: always()`; artefactos reales publicados (109 kB evidencias + 73 kB build) |
| 4   | Logger estructurado, sin secretos, con exportación local y errores comprensibles | PASS   | 19 pruebas del logger; sanitización probada (claves y patrones); panel con exportar JSONL; ErrorBoundary con código de evento y acción sugerida                                        |
| 5   | No existe dependencia de runtime externa ni módulo de simulación falso           | PASS   | Únicas dependencias de runtime: `react` y `react-dom` (MIT); ningún módulo de simulación creado (llega en fase 04); ningún `expect(true)` ni mock vacío en las 33 pruebas              |

## Capturas/logs/reportes

- Workflow (verde, SHA exacto): https://github.com/Lean031110/LBA_Restaurant_Engine/actions/runs/37950646517
- Artefactos del run: `lba-ci-evidence-24ee124aace5bdb0ad26cbd6d854e460fb4e605e` (JUnit + cobertura + informes + smoke) y `lba-build-24ee124aace5bdb0ad26cbd6d854e460fb4e605e`
- PR: https://github.com/Lean031110/LBA_Restaurant_Engine/pull/2
- Sin capturas de UI en el informe: la verificación de UI se realiza con pruebas de componente (jsdom) y smoke de preview; las capturas con Playwright llegan cuando exista UI estable (fase 03), según ADR-0001.

## Licencias, assets y supply chain

- Dependencias nuevas: 15 directas (2 runtime: react, react-dom — MIT; 13 desarrollo — MIT/Apache-2.0). Versiones y licencias verificadas en npm el 2026-10-09 antes de instalar (ADR-0001).
- Transitivas: 228 paquetes en total auditados por `scripts/audit-licenses.mjs` (cifra corregida el 2026-10-09; el borrador previo citaba conteos incompletos); 5 con licencias fuera de la lista preferida, evaluadas y aprobadas en **ADR-0002** (MIT-0 ×2, CC-BY-4.0 ×1 datos, MPL-2.0 ×2 solo build). El auditor falla ante licencias desconocidas/no permitidas.
- `npm audit`: 0 vulnerabilidades (nivel high).
- Sin activos de terceros incorporados.
- **Secretos**: el primer push de esta rama fue rechazado por la protección de secretos de GitHub porque una prueba usaba el token real como fixture. Corregido antes de publicar: los fixtures usan tokens ficticios construidos por partes y se verificó (`git grep`) que el historial committeado no contiene ningún patrón de token. Se confirmó la ausencia de secretos en los artefactos (JUnit/cobertura solo contienen métricas de pruebas). Ampliado en la sección «Auditoría de seguridad del incidente del token» de este informe.

## Bugs y limitaciones pendientes

| Problema                                             | Reproducción                                                      | Impacto                                        | Módulo    | Próxima acción                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------- | --------- | ------------------------------------------------------------- |
| `styles.css` aparece al 0 % en la tabla de cobertura | `npm test` (artefacto del pipeline de cobertura de Vite para CSS) | Nulo (no es código ejecutable)                 | cobertura | Excluir CSS del informe cuando se toque la config en fase 02+ |
| E2E de navegador real (Playwright) no instalado      | —                                                                 | Medio (la verificación de UI es jsdom + smoke) | pruebas   | Incorporar en fase 03 con UI estable, según ADR-0001 y guía   |

## Riesgos/diferencias

- Requisitos parcialmente implementados: ninguno de esta fase.
- Pruebas que no pudieron ejecutarse: ninguna (las mínimas de la fase se ejecutaron todas).
- Supuestos de simulación no medidos: ninguno incorporado (sin catálogo todavía).
- Cambios de alcance con ADR: ADR-0002 (excepciones de licencia del toolchain de build).
- Diferencia con el protocolo estricto: prompts 01.1–01.4 consolidados por autorización expresa del usuario (mensaje inicial). La disciplina «un prompt por interacción» se aplica en adelante.

## Decisión

- [x] Se puede avanzar a la fase siguiente.
- [ ] No se avanza; corregir los puntos señalados.

Justificación: los 5 criterios obligatorios están en `PASS` con evidencia local y remota verificable (workflow verde sobre el SHA exacto, 33/33 pruebas, cobertura sobre umbral, 0 vulnerabilidades, licencias auditadas con ADR, secretos excluidos y verificados). El PR #1 (FASE 00) ya está fusionado en `main` (squash `15455d6`). El PR #2 (FASE 01) se fusiona conforme a la política de integración verificada (autorización expresa del propietario, 2026-10-09): checks obligatorios en verde sobre el SHA final exacto (inspeccionados vía API: pasos, pruebas y artefactos), conflictos resueltos sin pérdida de cambios de `main`, pruebas y auditorías reales, evidencias publicadas. El resultado final de la integración quedó registrado: `main` en `b7fe430` (squash del PR #2, 2026-10-09), CI post-merge en verde (run 37957686994). La FASE 02 (modelo de datos y catálogo) comienza tras confirmar la integración.
