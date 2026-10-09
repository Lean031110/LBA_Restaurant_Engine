# Fase 02 — Modelo de datos y catálogo

- Estado: `EN CURSO` — prompt 02.1 **integrado** (PR #4, squash `97bb93bd289f9635e54316b050588cae7d858733`); **iteración correctiva 02.1-b** (invariantes semánticos de parámetros) preparada y verificada en local, **pendiente de publicación** hasta que el propietario rote la credencial de GitHub (ver «Bloqueo de seguridad» en `PHASE-01.md`)
- Fecha UTC: 2026-10-10 (correctiva) / 2026-10-09 (02.1)
- Archivo de fase: `docs/guia/FASES/FASE_02_MODELO_DATOS_CATALOGO.md` (prompts 02.1–02.4; solo 02.1 ejecutado + correctiva)

## Prompt 02.1 — Tipos y validadores del dominio (integrado)

- Rama y PR: `feat/phase-02-modelo-datos` → PR #4: https://github.com/Lean031110/LBA_Restaurant_Engine/pull/4
- Commit SHA exacto evaluado por Actions: `cb712a362a67c5281568d1e6da19aedf5d22e078` — runs en verde: 37959743707 (push, 17/17 pasos) y 37959784777 (pull_request, 15/15 pasos), con artefactos de evidencias y build escaneados sin secretos
- Integración: squash merge del PR #4 → `main` en `97bb93bd289f9635e54316b050588cae7d858733` (2026-10-09T16:33:08Z); CI post-merge en `main`: run 37959942087 — **completed/success**
- Entregado: paquete `@lba/domain` (puro, sin DOM — regla 11) con esquemas Zod para las 9 entidades del contrato, IDs estables con marca de tipo, `schemaVersion` 1, mundo en m/cm, registro de parámetro con regla 10 (unidad/procedencia/confianza/rango/fuente/override), geometría finita/positiva, errores con ruta de campo exacta y fixtures válido/inválidos

## Iteración correctiva 02.1-b — Invariantes semánticos del parámetro

**Origen**: revisión del propietario sobre el merge del PR #4 (2026-10-10). El CI estaba en verde pero el modelo admitía estados semánticamente inválidos. La iteración NO se considera completada hasta que esta corrección esté integrada y verificada en `main`.

### Defectos detectados y corregidos

| ID  | Defecto (detectado por el propietario)                                                                                                        | Corrección aplicada                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A   | `SecondsParameterSchema` aceptaba duraciones negativas cuando no había `minValue`/`maxValue` declarados                                       | La unidad `s` impone `min: 0` a `value`, `minValue`, `maxValue` y `scenarioOverrideValue`. El 0 se admite donde tiene sentido operacional (encendido instantáneo, paso inmediato); sin tope superior arbitrario; el rango más estricto lo declara el usuario |
| B   | La unidad `%` declaraba rango 0–100 en la documentación pero la validación no lo imponía                                                      | La unidad `%` impone `[0, 100]` inclusivo a los cuatro campos numéricos; los límites exactos 0 y 100 son válidos y cualquier valor por debajo/encima se rechaza                                                                                              |
| C   | `minValue`/`maxValue` usaban `NonNegativeFiniteNumberSchema`, lo que impedía rangos de temperatura negativos (p. ej. congelador −25 a −15 °C) | Los límites solo exigen número finito; las cotas de signo las pone cada unidad. `C` no impone cotas (admite negativos); se mantiene el orden `min ≤ max` y la coherencia valor–unidad–rango                                                                  |
| D   | Las comprobaciones de rango se aplicaban a `value` pero no de forma equivalente a `scenarioOverrideValue`                                     | El override se valida con las mismas reglas: cotas de la unidad **y** rango declarado (`minValue`/`maxValue`); un override fuera de rango se rechaza con ruta exacta `scenarioOverrideValue`                                                                 |
| E   | Unidades `persons`/`unit`/`m`/`cm` sin semántica definida; `verifiedAt` solo validaba formato, no fechas reales                               | `persons`/`unit`: entero ≥ 0 (conteos discretos). `m`/`cm`: ≥ 0 con decimales (magnitudes; las coordenadas con signo viven en `PositionSchema`). `verifiedAt`: rechaza fechas imposibles (`2026-02-30`, `2026-13-01`, 29-F de año no bisiesto)               |

### Implementación

- Nueva tabla `UNIT_CONSTRAINTS` (única fuente de verdad de las cotas por unidad, exportada para el catálogo 02.2 y el editor) + explicaciones humanas por unidad para los mensajes de error.
- `withParameterRules` reescrito con `superRefine`: aplica cotas de unidad a los 4 campos numéricos, orden de límites, coherencia de `value` y del override con el rango declarado; todos los problemas se reportan juntos con ruta de campo exacta.
- `minValue`/`maxValue` pasan de `NonNegativeFiniteNumberSchema` a `FiniteNumberSchema` (el signo correcto lo decide la unidad del registro).
- `VerifiedAtSchema` nuevo: formato ISO + calendario real (bisiestos incluidos) — exportado.
- Sin cambios de API pública rompidos: `ParameterRecordSchema`, `SecondsParameterSchema`, `CelsiusParameterSchema`, helpers y entidades conservan su forma; solo se estrechan los valores aceptados (corrección, no ampliación).

### Pruebas (comportamiento, no solo cobertura)

- `packages/domain/src/parameter.test.ts`: 41 tests (antes 13) — duraciones negativas/cero/positivas/decimales/sin tope, porcentajes en bordes 0/100 y fuera, rangos Celsius negativos, override dentro/fuera de rango y por unidad, `persons`/`unit` enteros, `m`/`cm` decimales, tabla `UNIT_CONSTRAINTS` completa, fechas imposibles y bisiestos.
- `packages/domain/src/entities.test.ts`: 35 tests (antes 29) — equipo: duraciones negativas rechazadas en los 6 campos de segundos con ruta `«campo».value`, duración 0 válida, congelador −25…−15 válido, override de temperatura fuera/dentro de rango; receta y plantilla de tarea: duración de paso negativa con ruta `steps[N].durationSeconds.value`.
- `packages/domain/src/scenario.test.ts`: 9 tests (antes 7) — parámetros globales heredan cotas de unidad (`%` override 120 rechazado, `persons` 10.5 rechazado) y bordes válidos aceptados.
- `scenarios/fixtures/invalid-negative-duration.json` (nuevo): violación única documentada (calentamiento −30 s); `fixtures.test.ts` exige la ruta `equipment[0].warmupSeconds.value`.
- **Ninguna aserción existente fue eliminada, debilitada ni sustituida**: 177 → 273 sentencias `expect` en el paquete domain (+96); los tests previos se conservan íntegros y siguen pasando sin cambios de expectativa.

### Verificación local (2026-10-10, rama `fix/phase-02-parameter-invariants`, Node v24.21.0)

| Paso                     | Resultado real | Detalle                                                                                                                                                                              |
| ------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm ci`                 | OK             | instalación limpia desde lockfile, 0 vulnerabilidades                                                                                                                                |
| `npm run format:check`   | OK             | Prettier sin diferencias                                                                                                                                                             |
| `npm run lint`           | OK             | 0 errores, 0 avisos                                                                                                                                                                  |
| `npm run typecheck`      | OK             | `tsc --noEmit` sin errores en ambos workspaces                                                                                                                                       |
| `npm test`               | OK             | **157/157** (33 web + 124 domain); domain: 100% sentencias, 98,85% ramas, 100% funciones, 100% líneas; `parameter.ts` 100% en las cuatro métricas; web: 96,07% líneas / 88,52% ramas |
| `npm run build`          | OK             | build de producción completa                                                                                                                                                         |
| Smoke preview            | OK             | HTTP 200 con `<title>LBA_Restaurant_Engine</title>`                                                                                                                                  |
| `npm run audit:licenses` | OK             | 228 paquetes, todas las licencias permitidas (5 excepciones ADR-0002)                                                                                                                |
| `npm run audit:security` | OK             | 0 vulnerabilidades                                                                                                                                                                   |

### Estado de publicación

- La rama `fix/phase-02-parameter-invariants` está creada desde `main` (`97bb93bd`) con los cambios anteriores.
- **No se ha hecho push ni se ha abierto PR**: las escrituras remotas están suspendidas hasta que el propietario revoque el token antiguo y configure la credencial nueva (instrucción del 2026-10-10; registro del incidente en `PHASE-01.md`).
- Flujo pendiente cuando la credencial esté lista: push → PR → revisión del diff → Actions sobre el SHA exacto → inspección de pasos/tests/artefactos → confirmación de ausencia de conflictos → actualización de este informe con SHA/URLs/artefactos reales → merge autónomo (si todo verifica) → verificación del CI post-merge.

## Criterios de salida de la fase (parcial)

| ID  | Criterio (FASE_02)                                 | Estado    | Notas                                                                             |
| --- | -------------------------------------------------- | --------- | --------------------------------------------------------------------------------- |
| 1   | Schemas con errores comprensibles y ruta de campo  | CUMPLIDO  | Invariantes por unidad + override validado; mensajes con explicación de la unidad |
| 2   | IDs estables                                       | CUMPLIDO  | Sin cambios en esta iteración (ya cubierto en 02.1)                               |
| 3   | Catálogo con propiedades/unidades                  | PENDIENTE | Prompt 02.2 (no iniciado; la política exige cerrar primero la correctiva)         |
| 4   | Importación/migración sin pérdida silenciosa       | PENDIENTE | Prompt 02.3                                                                       |
| 5   | Auditoría de salida (ida y vuelta, extensibilidad) | PENDIENTE | Prompt 02.4                                                                       |

## Pendientes de la fase

1. Publicar e integrar la iteración correctiva 02.1-b cuando la nueva credencial esté configurada (flujo descrito arriba).
2. Ejecutar el prompt 02.2 (catálogo/presets) solo después de integrada y verificada la correctiva.
3. Prompts 02.3 (importación/migración) y 02.4 (auditoría de salida) después.
4. Rotación del token confirmada por el propietario y fecha registrada en `PHASE-01.md` (incidente de seguridad).
