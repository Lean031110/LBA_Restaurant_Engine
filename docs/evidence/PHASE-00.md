# Cierre de fase 00 — Descubrimiento del repositorio, alcance y contrato de trabajo

- Estado: `APROBADA` (pendiente de merge del PR por parte del usuario, regla 6 del prompt maestro)
- Fecha UTC: 2026-10-09
- Rama y PR: `feat/phase-00-contrato` → PR #1: https://github.com/Lean031110/LBA_Restaurant_Engine/pull/1
- Commit SHA exacto: `80f1015` (documentos de fase) sobre base `800066c` (`main`, commit de constitución)
- Workflow de GitHub Actions: **no aplica en esta fase** — la FASE 00 es documental; el primer workflow llega con la FASE 01 (regla de la guía: no fingir una ejecución inexistente)
- Artefacto(s) de evidencia: este archivo; URLs de repo/PR verificables en GitHub
- Archivo de fase y revisión: `docs/guia/FASES/FASE_00_DESCUBRIMIENTO_Y_CONTRATO.md` (prompts 00.1–00.4 ejecutados de forma consolidada por autorización expresa del usuario: «configura completamente el repositorio […] y luego empieza con el proyecto»)

## Cambios realizados

| Archivo/módulo | Cambio | Requisito relacionado |
|---|---|---|
| `README.md` | Readme completo del proyecto: misión, estado, stack, enlaces a guía y docs | Prompt 00.2 B |
| `docs/alcance.md` | Objetivo, dentro/fuera de alcance, exclusiones deliberadas con condición de retorno | Prompt 00.2 B |
| `docs/arquitectura/mapa-modulos.md` | Estructura prevista del repo y límites de responsabilidad por módulo | Prompt 00.2 B / guía 01 |
| `docs/decisions/ADR-0001-stack-inicial.md` | Stack con versiones y licencias verificadas el 2026-10-09; alternativas descartadas | Prompt 00.2 B |
| `docs/backlog.md` | Fases 00–11 con entregables y criterios de salida enlazados a la guía | Prompt 00.2 B |
| `docs/riesgos.md` | 10 riesgos con impacto/probabilidad/mitigación, 5 supuestos, bloqueos conocidos | Prompt 00.2 B |
| `CONTRIBUTING.md` | Convenciones de rama, commit, licencias, PR y evidencia | Repositorio profesional |
| `SECURITY.md` | Política de secretos, datos de usuario y reporte de vulnerabilidades | Repositorio profesional |
| `docs/evidence/PHASE-00.md` | Este informe | Prompt 00.4 D |

## Inspección del repositorio (Prompt 00.1 A)

- Repositorio real: `Lean031110/LBA_Restaurant_Engine` — creado el 2026-10-09 vía API con el token fine-grained del propietario (cuenta verificada: `Lean031110`, id 100109036). El nombre previsto en la guía (`lean0311g/LBA_Restaurant_Engine`) no existía; la cuenta real del token es `Lean031110` y se adopta como repositorio oficial. **Nota:** el token vive solo en el credential store local del entorno de desarrollo, nunca en el repo.
- Configuración aplicada al crear el repo: público (proyecto open source según la guía), issues habilitados, wiki/projects deshabilitados, squash-merge únicamente, borrado de rama al fusionar, rama por defecto `main`, topics (`restaurant`, `simulation`, `discrete-event-simulation`, `typescript`, `react`, `vite`, `konva`, `operations-management`, `bottleneck-analysis`, `open-source`, `lba`).
- Estado git inicial: repositorio vacío (sin historial previo, sin cambios sin confirmar). No existía trabajo previo que preservar; el primer commit (`800066c`) preserva la guía maestra íntegra en `docs/guia/` (33 archivos, 3.748 líneas) por instrucción expresa del usuario.
- Rama/HEAD al cerrar: `feat/phase-00-contrato` @ `80f1015`; `main` @ `800066c`.
- Scripts/tests/workflows existentes al inspeccionar: ninguno (repo recién creado); se crean desde FASE 01.
- Riesgos y bloqueos de permisos: sin bloqueos para push/PR. Pendiente de verificar en FASE 01: ejecución real de GitHub Actions y artefactos.

## Tests ejecutados

| Comando/workflow | Resultado real | Conteo/detalle | Evidencia |
|---|---|---|---|
| `curl api.github.com/user` | OK | Cuenta del token identificada: `Lean031110` | Ejecutado en el entorno de desarrollo |
| `curl api.github.com/repos/Lean031110/LBA_Restaurant_Engine` (pre-creación) | `404 Not Found` | Confirmación de que el repo no existía | Ejecutado en el entorno |
| `npm view <paquete> version license` × 15 paquetes | OK | Versiones/licencias verificadas el 2026-10-09, registradas en ADR-0001 | ADR-0001 |
| `git push origin main` / `git push origin feat/phase-00-contrato` | OK | Ambas ramas visibles en GitHub | Redirección `* [new branch]` en salida git |
| Creación de PR vía API | OK | PR #1 creado | URL arriba |

Validación de Markdown: sin herramienta de lint de Markdown instalada todavía (se evalúa en FASE 01 si procede); revisión manual de enlaces relativos realizada contra la estructura real de archivos.

## Criterios de salida

| ID | Criterio | Estado | Evidencia concreta |
|---|---|---|---|
| 1 | Repositorio real identificado; rama/HEAD y cambios existentes documentados | PASS | `Lean031110/LBA_Restaurant_Engine`; `main@800066c`, `feat/phase-00-contrato@80f1015`; sin trabajo previo (repo nuevo); sección Inspección arriba |
| 2 | Alcance y exclusiones registradas; no se ha creado trabajo fuera de fase | PASS | `docs/alcance.md`; este PR no contiene código de aplicación ni dependencias |
| 3 | Stack y arquitectura inicial documentados con ADR, riesgos y alternativas | PASS | `ADR-0001-stack-inicial.md` con versiones+licencias verificadas, alternativas descartadas y condición de revisión; `docs/riesgos.md`; `docs/arquitectura/mapa-modulos.md` |
| 4 | Backlog enlazado a fases 00–11 y criterios de salida | PASS | `docs/backlog.md` con tabla completa por fase |
| 5 | Informe de evidencia existe; SHA y URLs no están inventados | PASS | Este archivo; SHA `80f1015` verificable con `git show`; PR #1 verificable en GitHub |

## Capturas/logs/reportes

- Repositorio: https://github.com/Lean031110/LBA_Restaurant_Engine
- PR de esta fase: https://github.com/Lean031110/LBA_Restaurant_Engine/pull/1
- Guía preservada: https://github.com/Lean031110/LBA_Restaurant_Engine/tree/main/docs/guia
- No hay capturas de UI: la interfaz no existe hasta FASE 01 (no se finge evidencia).

## Licencias, assets y supply chain

- **Cero dependencias instaladas en esta fase** (regla del prompt 00.2 B: no instalar librerías si no hace falta). Las versiones citadas en ADR-0001 solo se *consultaron* en npm, no se incorporaron.
- Licencia propia: MIT, `Copyright (c) 2026 Leandro (@lean0311g)` (texto íntegro en `LICENSE`), conforme a `docs/guia/02_RECURSOS_LICENCIAS_Y_PARAMETROS.md`.
- Sin activos de terceros incorporados.
- Confirmación de ausencia de secretos: el token GitHub solo existe en el credential store local; revisados los archivos del commit (documentación Markdown) sin credenciales.

## Bugs y limitaciones pendientes

| Problema | Reproducción | Impacto | Módulo | Próxima acción |
|---|---|---|---|---|
| El nombre de cuenta real (`Lean031110`) difiere del citado en la guía (`lean0311g`) | Cualquier enlace interno de la guía que referencie `lean0311g/...` | Bajo (la guía se conserva inalterada a propósito) | docs | Aceptado; los documentos del proyecto usan la cuenta real |
| Sin CI todavía | — | Bajo (fase documental) | — | FASE 01 introduce el workflow |

## Riesgos/diferencias

- Requisitos parcialmente implementados: ninguno de esta fase.
- Pruebas que no pudieron ejecutarse: ninguna requerida por la fase (las «pruebas mínimas» de FASE 00 son inspección git, validación documental y revisión manual — realizadas).
- Supuestos de simulación no medidos: ninguno incorporado todavía (sin catálogo aún).
- Cambios de alcance con ADR: ninguno.
- Diferencia con el protocolo estricto de la guía: los prompts 00.1–00.4 se ejecutaron consolidados en una sola entrega por autorización expresa del usuario (mensaje de inicio del proyecto). La disciplina de «un prompt por interacción» se aplica a partir de FASE 01 en las interacciones siguientes.

## Decisión

- [x] Se puede avanzar a la fase siguiente.
- [ ] No se avanza; corregir los puntos señalados.

Justificación: los 5 criterios obligatorios de salida están en `PASS` con evidencia verificable (SHA reales, PR real, inspección documentada, cero dependencias, cero secretos). El merge del PR #1 queda en manos del usuario conforme a la regla 6 del prompt maestro; la FASE 01 puede comenzar en rama apilada y su CI validará el árbol completo.
