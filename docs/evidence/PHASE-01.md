# Cierre de fase 01 — Base web ejecutable, toolchain, CI y diagnóstico

- Estado: `APROBADA` — merge del PR #2 ejecutable bajo la política de integración verificada (autorización expresa del propietario, 2026-10-09)
- Fecha UTC: 2026-10-09
- Rama y PR: `feat/phase-01-base-tecnica` (apilada sobre `feat/phase-00-contrato`) → PR #2: https://github.com/Lean031110/LBA_Restaurant_Engine/pull/2
- Commit SHA exacto: `24ee124aace5bdb0ad26cbd6d854e460fb4e605e` (`ci(phase-01): workflow Actions con evidencias, auditoría de licencias y ADR-0002`)
- Workflow de GitHub Actions: «CI» — https://github.com/Lean031110/LBA_Restaurant_Engine/actions/runs/37950646517 — resultado **completed/success** sobre el SHA exacto citado (verificado vía API)
- Artefacto(s) de evidencia: `lba-ci-evidence-24ee124aace5bdb0ad26cbd6d854e460fb4e605e` (109 081 bytes: JUnit, cobertura, informes de licencias, smoke HTML) y `lba-build-24ee124aace5bdb0ad26cbd6d854e460fb4e605e` (72 998 bytes: build de producción)
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

| Comando                     | Resultado real | Conteo/detalle                                                                                  | Evidencia                                  |
| --------------------------- | -------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `npm ci`                    | OK             | 115 paquetes, 0 vulnerabilidades                                                                | Salida de consola del entorno              |
| `npm run format:check`      | OK             | «All matched files use Prettier code style!»                                                    | Salida de consola                          |
| `npm run lint`              | OK             | 0 errores, 0 avisos                                                                             | Salida de consola                          |
| `npm run typecheck`         | OK             | `tsc --noEmit` sin errores                                                                      | Salida de consola                          |
| `npm test`                  | OK             | **33/33 pruebas superadas** (6 archivos)                                                        | JUnit en `apps/web/test-results/junit.xml` |
| Cobertura (mismo comando)   | OK             | 94,11 % líneas · 94,11 % sentencias · 88,52 % ramas · 97,56 % funciones (umbrales: 75/75/70/75) | `apps/web/coverage/`                       |
| `npm run build`             | OK             | 22 módulos → dist (JS 228,12 kB / gzip 71,90 kB; CSS 3,52 kB)                                   | Salida de consola                          |
| Smoke `vite preview` + curl | OK             | HTTP 200 con `<title>LBA_Restaurant_Engine</title>` y `id="root"`                               | `/tmp/smoke.html` en entorno local         |
| `npm run audit:licenses`    | OK             | 115 paquetes auditados; 5 excepciones aprobadas por ADR-0002                                    | `reports/license-report.md`                |
| `npm run audit:security`    | OK             | «found 0 vulnerabilities»                                                                       | Salida de consola                          |

### GitHub Actions (remoto, SHA `24ee124a`)

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
- Transitivas: 113 paquetes en total auditados por `scripts/audit-licenses.mjs`; 5 con licencias fuera de la lista preferida, evaluadas y aprobadas en **ADR-0002** (MIT-0 ×2, CC-BY-4.0 ×1 datos, MPL-2.0 ×2 solo build). El auditor falla ante licencias desconocidas/no permitidas.
- `npm audit`: 0 vulnerabilidades (nivel high).
- Sin activos de terceros incorporados.
- **Secretos**: el primer push de esta rama fue rechazado por la protección de secretos de GitHub porque una prueba usaba el token real como fixture. Corregido antes de publicar: los fixtures usan tokens ficticios construidos por partes y se verificó (`git grep`) que el historial committeado no contiene ningún patrón de token. Se confirmó la ausencia de secretos en los artefactos (JUnit/cobertura solo contienen métricas de pruebas).

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

Justificación: los 5 criterios obligatorios están en `PASS` con evidencia local y remota verificable (workflow verde sobre el SHA exacto, 33/33 pruebas, cobertura sobre umbral, 0 vulnerabilidades, licencias auditadas con ADR, secretos excluidos y verificados). El PR #1 (FASE 00) ya está fusionado en `main` (squash `15455d6`). El PR #2 (FASE 01) se fusiona conforme a la política de integración verificada (autorización expresa del propietario, 2026-10-09): checks obligatorios en verde sobre el SHA final, conflictos resueltos sin pérdida de cambios de `main`, pruebas y auditorías reales, evidencias publicadas. La FASE 02 (modelo de datos y catálogo) comienza tras confirmar la integración.
