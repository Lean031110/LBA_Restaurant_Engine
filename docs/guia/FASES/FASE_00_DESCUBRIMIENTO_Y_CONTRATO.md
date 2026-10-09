# FASE 00 — Descubrimiento del repositorio, alcance y contrato de trabajo

**Objetivo:** Establecer exactamente qué repositorio y rama se utilizarán, qué existe, qué riesgos hay y cómo se demostrará cada fase. No construir aún funcionalidades del simulador.

**Precondición:** Ninguna. Es la primera fase.

**Archivos/módulos que normalmente se tocarán:** README.md del repo, `docs/architecture/`, `docs/decisions/`, `docs/evidence/PHASE-00.md`, backlog/roadmap; no reestructurar código existente sin motivo.

## Reglas de ejecución para esta fase

Lee el `00_PROMPT_MAESTRO_CODEX.md` y las guías maestras. Copia un único prompt numerado por mensaje. No ejecutes la fase completa de una vez. Al terminar una iteración, detente y reporta su SHA, pruebas, diff y evidencia real. No empieces la fase siguiente hasta que la salida de esta esté aprobada.

## Prompt 00.1 — A — Inspección sin cambios destructivos

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 00. No avances a otra iteración automáticamente.
>
> Inspecciona el repositorio real conectado: URL, rama, HEAD, estado git, archivos, scripts, tests, workflows, licencias, dependencias y cambios sin confirmar. Verifica si el repositorio esperado `lean0311g/LBA_Restaurant_Engine` existe y está accesible; no lo supongas. No borres ni alteres código todavía. Resume qué existe, qué falta, riesgos y bloqueos de permisos. Ejecuta solo comandos de inspección seguros. Si no hay acceso al repo, detente con el bloqueo específico y pasos de conexión.

</details>

## Prompt 00.2 — B — Contrato y backlog

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 00. No avances a otra iteración automáticamente.
>
> Con los hallazgos de A, crea/actualiza el README del proyecto, un documento de alcance, lista de exclusiones, mapa de módulos futuro y backlog que se corresponda con las 12 fases de la guía. Crea un ADR inicial con stack propuesto (React/TS/Vite, Konva, motor propio, Playwright/Vitest y Three.js posterior). Verifica las páginas oficiales y licencias exactas antes de añadir dependencias; en esta fase no instales ninguna librería si no hace falta. Registra riesgos y supuestos, sin convertir estimaciones de trabajo en fechas garantizadas.

</details>

## Prompt 00.3 — C — Flujo y evidencias

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 00. No avances a otra iteración automáticamente.
>
> Comprueba qué capacidades reales tiene el entorno para branch, commit, push, PR y GitHub Actions. Define convención de ramas/commits, reporte de fase, log y evidencia. No afirmes que se creó un PR/workflow si no existe. Crea una lista de pruebas/validaciones que CI necesitará desde fase 01 y un archivo `docs/evidence/PHASE-00.md` con los resultados reales de inspección.

</details>

## Prompt 00.4 — D — Auditoría de salida

<details>
<summary>Copiar prompt</summary>

> **Instrucción para Codex:** Ejecuta solo esta iteración de la FASE 00. No avances a otra iteración automáticamente.
>
> Vuelve a revisar el diff y el informe de fase 00 criterio por criterio. Confirma que no se perdió trabajo existente ni se usaron licencias sin revisar. Ejecuta cualquier validación documental disponible. Adjunta evidencia, SHA/URL reales y lista de bloqueos. No implementes la fase 01. Si falta acceso al repositorio o una decisión esencial de alcance, marca BLOQUEADA y detente.

</details>

## Criterios obligatorios de salida

- [ ] Repositorio real identificado; rama/HEAD y cambios existentes documentados.
- [ ] Alcance y exclusiones registradas; no se ha creado trabajo fuera de fase.
- [ ] Stack y arquitectura inicial documentados con ADR, riesgos y alternativas.
- [ ] Backlog enlazado a fases 00–11 y criterios de salida.
- [ ] Informe de evidencia existe; SHA y URLs no están inventados.

## Pruebas mínimas requeridas

- [ ] Inspección de git status/diff; sin cambios del usuario descartados.
- [ ] Validación de Markdown/enlaces si hay tooling existente; no inventar un test inexistente.
- [ ] Revisión manual del alcance contra los documentos maestros.

## Evidencia y decisión

Completar `PLANTILLAS/CIERRE_DE_FASE.md` como `docs/evidence/PHASE-00.md`. Debe incluir rama/PR, SHA, URL real del workflow, artefactos, comandos y resultados. Si cualquier criterio obligatorio está en `FAIL`, `NO EJECUTADO` o `NO VERIFICADO`, el estado es `INCOMPLETA` o `BLOQUEADA`. No avanzar.
