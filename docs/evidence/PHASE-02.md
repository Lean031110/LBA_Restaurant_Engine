# Fase 02 — Modelo de datos y catálogo

- Estado: `EN CURSO` — prompt 02.1 **integrado** (PR #4, squash `97bb93bd289f9635e54316b050588cae7d858733`); **iteración correctiva 02.1-b + revisión de diseño 02.1-c + prompt 02.2 (catálogo)** preparadas y verificadas en local sobre la misma rama, **pendientes de publicación** (ver «Bloqueo de seguridad» en `PHASE-01.md`; la rama local ahora se llama `feat/phase-02-modelo-datos-catalogo`, renombrada desde `fix/phase-02-parameter-invariants` para reflejar su contenido acumulado)
- Fecha UTC: 2026-10-09 (02.1, correctiva 02.1-b, revisión 02.1-c) / 2026-10-10 (02.2) — fechas verificables por timestamps git
- Archivo de fase: `docs/guia/FASES/FASE_02_MODELO_DATOS_CATALOGO.md` (prompts 02.1–02.4; ejecutados 02.1 + correctivas + 02.2)

## Prompt 02.1 — Tipos y validadores del dominio (integrado)

- Rama y PR: `feat/phase-02-modelo-datos` → PR #4: https://github.com/Lean031110/LBA_Restaurant_Engine/pull/4
- Commit SHA exacto evaluado por Actions: `cb712a362a67c5281568d1e6da19aedf5d22e078` — runs en verde: 37959743707 (push, 17/17 pasos) y 37959784777 (pull_request, 15/15 pasos), con artefactos de evidencias y build escaneados sin secretos
- Integración: squash merge del PR #4 → `main` en `97bb93bd289f9635e54316b050588cae7d858733` (2026-10-09T16:33:08Z); CI post-merge en `main`: run 37959942087 — **completed/success**
- Entregado: paquete `@lba/domain` (puro, sin DOM — regla 11) con esquemas Zod para las 9 entidades del contrato, IDs estables con marca de tipo, `schemaVersion` 1, mundo en m/cm, registro de parámetro con regla 10 (unidad/procedencia/confianza/rango/fuente/override), geometría finita/positiva, errores con ruta de campo exacta y fixtures válido/inválidos

## Iteración correctiva 02.1-b — Invariantes semánticos del parámetro

**Origen**: revisión del propietario sobre el merge del PR #4 (2026-10-09, tras el merge de las 16:33:08Z). El CI estaba en verde pero el modelo admitía estados semánticamente inválidos. La iteración NO se considera completada hasta que esta corrección esté integrada y verificada en `main`.

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

### Verificación local (2026-10-09, rama `fix/phase-02-parameter-invariants`, Node v24.21.0)

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
- **No se ha hecho push ni se ha abierto PR**: las escrituras remotas están suspendidas hasta que el propietario revoque el token antiguo y configure la credencial nueva (instrucción del 2026-10-09; registro del incidente en `PHASE-01.md`).
- Flujo pendiente cuando la credencial esté lista: push → PR → revisión del diff → Actions sobre el SHA exacto → inspección de pasos/tests/artefactos → confirmación de ausencia de conflictos → actualización de este informe con SHA/URLs/artefactos reales → merge autónomo (si todo verifica) → verificación del CI post-merge.

## Revisión de diseño 02.1-c — Dos detalles del propietario + corrección de fechas

**Origen**: segunda revisión del propietario (2026-10-09) sobre la correctiva 02.1-b local (aún no publicada). Pide: (1) confirmar que la no negatividad de `m`/`cm` es válida para **todos** los usos previstos de `ParameterRecord` y, si el modelo pudiera representar desplazamientos con signo, no imponer la restricción global por unidad sino definir una semántica o tipo explícito; (2) comprobar que `verifiedAt` rechaza fechas imposibles, que los overrides se validan contra las restricciones de la unidad **y** los límites declarados, y que ninguna regla quedó duplicada de forma que el futuro catálogo pueda contradecir al dominio; (3) corregir fechas inconsistentes del registro del incidente.

### Decisión 1 — `m`/`cm` como magnitudes: confirmada contra el contrato

- **Confirmación de validez**: en el contrato, los parámetros de longitud son siempre magnitudes — dimensiones del local (docs/guia/01: «Las dimensiones del local se almacenan en metros o centímetros de mundo […] longitudes en metros»), huellas y puntos de interacción de presets (prompt 02.2: «dimensiones, huella, punto de interacción»), despejes accesibles (docs/guia/02: `accessibleClearance`), radios y distancias (docs/guia/04 §6). No existe ningún uso previsto de `ParameterRecord` con unidad `m`/`cm` que represente un desplazamiento con signo.
- **Semántica explícita (documentada en `parameter.ts` y `units.ts`)**: `ParameterRecord` representa escalares con unidad del catálogo; las cantidades espaciales **con signo** (coordenadas, desplazamientos, vectores de movimiento) no son parámetros — viven en `PositionSchema` (x/y finitas con signo) y vivirán en los tipos del motor de movilidad (FASE 07). Prueba que fija ese hogar: `units.test.ts` acepta coordenadas negativas en `PositionSchema` y sigue exigiendo finitud con ruta exacta.
- **Camino de extensión**: si algún día se necesitara una longitud con signo como parámetro, se añade una unidad o variante **explícita** al enum con su semántica documentada en `UNIT_CONSTRAINTS`; las cotas de `m`/`cm` no se relajan en silencio. Con esto no se impone una restricción «global arbitraria»: es la semántica de la unidad confirmada por el contrato, y la excepción futura tiene un camino definido y auditable.
- **Pruebas nuevas**: `parameter.test.ts` — la no negatividad de `m`/`cm` alcanza `minValue`, `maxValue` y `scenarioOverrideValue` (6 combinaciones con ruta exacta) y una contrapartida positiva con override decimal válido.

### Decisión 2 — Fechas, overrides y no duplicación

- **`verifiedAt` rechaza fechas imposibles — ahora también las futuras**: verificar una fuente es un evento ya ocurrido (docs/guia/02: «se cita la fuente, se registra la fecha»), de modo que «2999-12-31» es tan inválido como «2026-02-30». Se mantiene el calendario real (bisiestos incluidos) y se añade el rechazo de fechas posteriores a la fecha UTC en curso **más 1 día de tolerancia**, para no rechazar la fecha local «de hoy» de un verificador en zonas horarias por delante de UTC (el desfase máximo del planeta es UTC+14; la tolerancia no es un límite arbitrario sino la cobertura de ese desfase). Pruebas dinámicas estables cualquier día que se ejecuten: hoy/ayer/pasado lejano aceptados; hoy+1 tolerado; hoy+2 y «2999-12-31» rechazados con ruta `verifiedAt` y mensaje específico.
- **Ajuste de la lista de fechas válidas**: «2026-12-31» salió de la lista de fechas válidas del test de bisiestos **porque la regla nueva la rechaza** (es futura respecto a la fecha en curso); se sustituyó por fechas pasadas verificables («2020-02-29», «2026-10-09»). Es un endurecimiento, no una debilitación: el conteo total de aserciones del paquete subió de 273 a 288.
- **Overrides**: confirmado por pruebas existentes y nuevas que `scenarioOverrideValue` se valida con **ambas** capas — las cotas de la unidad (p. ej. override `-50` en `s`, `150` en `%`, `-0.01` en `m`) y el rango declarado (`minValue`/`maxValue`), siempre con ruta exacta `scenarioOverrideValue`.
- **No duplicación (el catálogo no puede contradecir al dominio)**: auditoría estructural — `EquipmentSchema` reutiliza `SecondsParameterSchema`/`CelsiusParameterSchema`, `ScenarioSchema` reutiliza `ParameterRecordSchema`, `units.ts` no aplica reglas (solo las documenta) y `UNIT_CONSTRAINTS` sigue siendo la única fuente de verdad de las cotas. Prueba nueva de anti-contradicción: un rango declarado que viole la semántica de la unidad se rechaza (p. ej. `%` con `maxValue: 200` → ruta `maxValue` con mensaje de la unidad), es decir, el catálogo 02.2 solo podrá declarar datos dentro de lo que el dominio permite. Mandato documentado en `parameter.ts`: el catálogo y el editor deben reutilizar `ParameterRecordSchema`/`UNIT_CONSTRAINTS`, no re-implementar reglas.

### Corrección de fechas del registro del incidente

- `PHASE-01.md` y este informe fechaban la instrucción de suspensión de escrituras y la correctiva en 2026-10-10 (desfase del reloj local del agente, UTC+8). La fecha verificable de los eventos es **2026-10-09 UTC**: la instrucción llegó tras el merge del PR #4 (16:33:08Z) y antes del primer commit correctivo local (18:06:39Z), ambos del 2026-10-09. Corregido en `PHASE-01.md` (con nota de corrección explícita) y en las 4 menciones de este informe.

### Cambios concretos (rama `fix/phase-02-parameter-invariants`, commit 02.1-c sobre `2d92c9a`)

_(El SHA exacto de la punta de la rama se registra en el informe de revisión y en el log de trabajo del agente; un commit no puede contener su propio hash. Al publicar, este informe se actualizará con el SHA evaluado por Actions.)_

_**Nota de autoría**: el entorno del agente se reinició entre sesiones y la identidad git local se perdió, dejando los commits correctivos con una identidad genérica del contenedor. Antes de publicar se restauró la identidad LeanKnight y se re-autoraron los commits locales **no publicados** (el 02.1-b conserva su fecha de autoría original, 18:06:39Z; mapeo en el log de trabajo: `04e3566` → `2d92c9a`); el historial publicado no se tocó y existe respaldo local `backup/02-1-local`. El mismo reinicio eliminó cualquier credencial del entorno: no queda token alguno en archivos de configuración, lo que reduce a cero la superficie de exposición local del incidente (que sigue ABIERTO hasta la rotación confirmada por el propietario)._

- `packages/domain/src/parameter.ts`: documentación de la decisión m/cm con referencias de contrato y camino de extensión; regla de no duplicación para el catálogo 02.2; `VerifiedAtSchema` con `superRefine` (calendario real + no futuro con tolerancia de 1 día); mensajes de unidad m/cm aclaran que son magnitudes.
- `packages/domain/src/units.ts`: documentación de la semántica m/cm y de `PositionSchema` como hogar de las coordenadas con signo.
- `packages/domain/src/parameter.test.ts`: 41 → 46 tests (+m/cm en 4 campos, +rango declarado que contradice a la unidad, +3 de fechas futuras dinámicas; lista de fechas válidas ajustada por la regla nueva).
- `packages/domain/src/units.test.ts`: 10 → 11 tests (+`PositionSchema` admite coordenadas con signo y sigue exigiendo finitud).
- `docs/evidence/PHASE-01.md` y `docs/evidence/PHASE-02.md`: corrección de fechas y esta sección.

### Verificación local (2026-10-09, rama `fix/phase-02-parameter-invariants`, Node v24.21.0)

| Paso                     | Resultado real | Detalle                                                                                                                                                                                           |
| ------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                 | OK             | instalación limpia desde lockfile, 0 vulnerabilidades                                                                                                                                             |
| `npm run format:check`   | OK             | Prettier sin diferencias (tras normalizar `PHASE-01.md`)                                                                                                                                          |
| `npm run lint`           | OK             | 0 errores, 0 avisos                                                                                                                                                                               |
| `npm run typecheck`      | OK             | `tsc --noEmit` sin errores en ambos workspaces                                                                                                                                                    |
| `npm test`               | OK             | **163/163** (33 web + 130 domain); domain: 100% sentencias, 98,90% ramas, 100% funciones, 100% líneas; `parameter.ts` y `units.ts` 100% en las cuatro métricas; web: 96,07% líneas / 88,52% ramas |
| `npm run build`          | OK             | build de producción completa                                                                                                                                                                      |
| Smoke preview            | OK             | HTTP 200 con `<title>LBA_Restaurant_Engine</title>`                                                                                                                                               |
| `npm run audit:licenses` | OK             | 228 paquetes, todas las licencias permitidas (5 excepciones ADR-0002)                                                                                                                             |
| `npm run audit:security` | OK             | 0 vulnerabilidades                                                                                                                                                                                |

Aserciones del paquete domain: 273 → 288 `expect` (+15); ninguna aserción previa fue eliminada ni debilitada (verificado con stash antes/después sobre el estado del 02.1-b, `04e3566`/`2d92c9a`).

**Estado de publicación**: sin cambios — SIN push, SIN PR, SIN merge hasta que el propietario revoque la credencial antigua, configure la nueva y lo confirme explícitamente.

## Prompt 02.2 — Catálogo/presets (preparado y verificado en local)

**Origen**: instrucción del propietario (2026-10-10): continuar la fase sin su intervención, con verificación completa por iteración. El prompt 02.2 se ejecutó apilado sobre la correctiva (misma rama) porque depende de `UNIT_CONSTRAINTS` y `VerifiedAtSchema` introducidos en 02.1-b/c.

### Entregado: paquete `@lba/asset-catalog`

- **48 presets**: 37 de objeto (11 estructurales: 3 paredes + 6 puertas madera/metal/cristal con tamaños 90/70/140/180 y mecanismos swing/sliding + 2 ventanas; 14 de mobiliario: 5 mesas + 2 sillas + 2 mostradores + barra + 3 estaciones + pila de bandejas; 12 de equipo, uno por cada `EquipmentKind` del dominio: 12/12) y 11 de zona (uno por cada `ZoneCategory`: 11/11).
- Cada preset declara: dimensiones en metros de mundo, `heightM`, huella poligonal opcional (mostrador curvo con chaflán), punto de interacción, materiales sugeridos con color `#RRGGBB` y material por defecto, propiedades numéricas como `ParameterRecord` del dominio (regla 10 completa: unidad + rango + procedencia + confianza + override), flags booleanos, icono vectorial y `usageNotes` (qué NO representan los valores — docs/guia/02).
- **Zonas**: `suggestedSize`, `defaultCapacity` (persons, editable), `allowedRoles` y `accessRules` ≥ 1.
- **Iconos**: 22 trazados SVG originales del proyecto (viewBox 0 0 24 24), sin descargas ni assets de terceros (prompt 02.2: «iconos vectoriales simples sirven para los placeholders»).
- **Cero paquetes nuevos**: `@lba/asset-catalog` reutiliza `zod@4.6.5` (ya directa de `@lba/domain`) y las herramientas de test existentes; el diff del lockfile es solo el link del workspace. Terceros: ninguno nuevo (THIRD_PARTY_NOTICES.md actualizado con la nota del paquete y la originalidad de los iconos).

### Cumplimiento del mandato «datos, no reglas» (decisión 02.1-c)

- Las propiedades numéricas EMBEBEN `ParameterRecordSchema` del dominio (`CatalogParameterSpec.record`): toda la semántica de unidades, rangos y overrides se valida una sola vez, en el dominio. El catálogo no tiene ninguna tabla de cotas propia.
- Pruebas de anti-contradicción: los rangos declarados se cruzan contra `UNIT_CONSTRAINTS` (ningún `minValue`/`maxValue` puede contradecir su unidad); fixture `invalid-preset-bad-range.json` (% con `maxValue` 200 → rutas `value` y `maxValue`).
- Auditoría estructural: test que lee el código fuente del paquete (vía `import.meta.glob ?raw` de vitest, sin `node:fs`) y falla si aparece una declaración local tipo `*CONSTRAINTS/*LIMITS/*RANGES/*BOUNDS* =` o un re-validador de unidad; test complementario exige que `preset.ts` importe `ParameterRecordSchema` de `@lba/domain`.
- Convención documentada: origen del preset = centro geométrico; punto de interacción a 0,45 m de la cara frontal (anillo máximo 0,5 m, `INTERACTION_POINT_MAX_OFFSET_M`); pasivas (paredes/ventanas) usan el centro. Unificación de nomenclatura: `heatRecoverySeconds` también en el horno de pizza (la guía usaba `recoverySeconds`; el dominio ya usa `heatRecoverySeconds` en `EquipmentSchema`) — documentada en el test de propiedades obligatorias.

### Pruebas

- 56 tests nuevos en 5 archivos (`preset.test.ts` 18, `catalog.test.ts` 14, `icons.test.ts` 4, `lookup.test.ts` 12, `fixtures.test.ts` 10): re-parse de los 48 presets contra los esquemas, cobertura 21/21 grupos + 12/12 equipos + 11/11 categorías, unicidad de IDs (con rechazo de duplicados en `buildCatalog`), honestidad de estimaciones (todo `estimated`/`low`/supuestos/fecha), coherencia `length` de pared = `dimensions.width`, anillo de interacción, huella poligonal dentro de `dimensions`, propiedades obligatorias por grupo (docs/guia/02), y 9 fixtures inválidos con ruta de campo exacta (ID sin prefijo, rango de `%` contradictorio, `verifiedAt` futuro, dimensión negativa, dimensión Infinity (1e999), punto de interacción a 5 m, `family "equipment"` sin `equipmentKind`, grupo desconocido, zona sin reglas de acceso).
- Nota zod 4: `z.number()` rechaza `Infinity` a nivel de tipo (mensaje "received Infinity"), igual que en el dominio; el refine de finitud sigue para NaN y el de positividad para negativos.

### Verificación local (2026-10-10, rama `feat/phase-02-modelo-datos-catalogo`, Node v24.21.0) — 9/9 OK

| Paso                     | Resultado real | Detalle                                                                                                                                                        |
| ------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                 | OK             | lockfile actualizado (solo link del workspace nuevo); 0 vulnerabilidades                                                                                       |
| `npm run format:check`   | OK             | Prettier sin diferencias                                                                                                                                       |
| `npm run lint`           | OK             | 0 errores, 0 avisos (eslint 10 flat sobre el paquete nuevo incluido)                                                                                           |
| `npm run typecheck`      | OK             | `tsc --noEmit` en los tres workspaces                                                                                                                          |
| `npm test`               | OK             | **219/219** (33 web + 130 domain + 56 asset-catalog); asset-catalog: 100% en las cuatro métricas; domain: 100/98,90/100/100; web: 96,07% líneas / 88,52% ramas |
| `npm run build`          | OK             | build de producción (el paquete nuevo es fuente pura; no añade paso de build)                                                                                  |
| Smoke preview            | OK             | HTTP 200 con `<title>LBA_Restaurant_Engine</title>`                                                                                                            |
| `npm run audit:licenses` | OK             | 228 paquetes (sin cambios: el link de workspace no añade paquetes auditables), todas permitidas                                                                |
| `npm run audit:security` | OK             | 0 vulnerabilidades                                                                                                                                             |

### Estado de publicación

- Commit sobre la rama `feat/phase-02-modelo-datos-catalogo` (apilado tras 02.1-c). SIN push, SIN PR, SIN merge (misma política que la correctiva).
- Al publicar: push → PR (cuerpo con checklist real) → Actions sobre el SHA exacto → artefactos escaneados → `PHASE-02.md` actualizado con SHA/URLs reales → merge verificado → CI post-merge.

## Prompt 02.3 — Importación, migración y licencia (preparado y verificado en local)

**Origen**: continuación autónoma de la fase (misma instrucción del 2026-10-10), apilado sobre 02.2 en la misma rama.

### Entregado: paquete `@lba/persistence`

- **Canal de importación en 6 etapas** (cada una corta y reporta rutas exactas; funciones puras — el escenario actual jamás se toca): (1) sintaxis JSON (fallo en `(raíz)`); (2) estructura (debe ser objeto); (3) puerta de versiones/migraciones; (4) validación Zod del dominio (tipos/rangos/unidades/IDs duplicados/posiciones no finitas); (5) sin pérdida silenciosa; (6) referencias cruzadas.
- **Sin pérdida silenciosa (mandato de 02.3 y 02.4)**: comparación entrada→salida tras validar; toda clave presente en la entrada y ausente en la salida validada (la que zod strip habría descartado) se rechaza con su ruta exacta a cualquier profundidad (`world.extra`, `objects[0].customField`, `temperature`). Dirección única: los opcionales ausentes en la entrada no son pérdida.
- **Referencias cruzadas (mandato del dominio, scenario.ts)**: 8 enlaces tipados (objects.zoneId→zones; agents.homeZoneId→zones; orders.items.recipeId→recipes; taskSteps.requiresEquipmentId→equipment; taskTemplates.dependencies→taskTemplates con existencia; fallbackTaskId→taskTemplates; recipes.components.inventoryItemId→inventory; inventory.locationWorldObjectId→objects) + autodependencia rechazada + detección de ciclos con DFS (reporta la cadena completa `a → b → a`). Los `requiredResourceIds` siguen siendo texto libre por contrato («FASE 06 los tipa») — no se inventan reglas.
- **Formato exportable determinista**: `exportScenario` produce JSON con indentación 2 y salto final; dos exportaciones son idénticas; `cargar(exportar(s))` devuelve un escenario profundo-igual; re-exportar lo reimportado produce exactamente el mismo texto.
- **Política de migraciones documentada** (migrations.ts, 6 reglas): solo hacia adelante; pasos puros; un paso que no pueda preservar un dato FALLA (nunca descarta); versiones futuras rechazadas explícitamente; la cadena se declara completa (sin pasos vacíos) y cada paso se prueba antes de publicarse. Estado inicial: cadena VACÍA (la versión 1 es la primera del formato; no existen archivos legítimos más antiguos). `schemaVersion` 0 y 2/5/99 producen mensajes específicos en `schemaVersion`.
- **Cero dependencias nuevas**: `@lba/persistence` solo depende del workspace `@lba/domain` (ni zod directa: usa `validateScenario` del dominio); herramientas de test existentes; el lockfile añade solo el link.

### Pruebas

- 48 tests en 4 archivos: `json.test.ts` 24 (los 7 fixtures inválidos del dominio alimentados como TEXTO ?raw — preserva literales 1e999 — y la primera ruta coincide con la del dominio; JSON mal formado; no-objeto; versiones futura/antigua; 4 casos de campos desconocidos con rutas; pureza con congelado y escenario actual intacto; 4 de exportación determinista/ida-vuelta/re-exportación idéntica), `loss-check.test.ts` 8, `references.test.ts` 12 (8 enlaces rotos con ruta + autodependencia + ciclo de 2 + dependencia legítima sin issues), `migrations.test.ts` 4.
- Cobertura del paquete: 84,93% sentencias / 80,43% ramas (por encima de los umbrales 75/70); el código no cubierto es el recorrido de la cadena de migraciones, vacía por diseño (estado inicial documentado).

### Verificación local (2026-10-10, rama `feat/phase-02-modelo-datos-catalogo`, Node v24.21.0) — 9/9 OK

| Paso                     | Resultado | Detalle                                                               |
| ------------------------ | --------- | --------------------------------------------------------------------- |
| `npm ci`                 | OK        | lockfile con link de workspace nuevo; 0 vulnerabilidades              |
| `npm run format:check`   | OK        | Prettier sin diferencias                                              |
| `npm run lint`           | OK        | 0 errores, 0 avisos                                                   |
| `npm run typecheck`      | OK        | cuatro workspaces                                                     |
| `npm test`               | OK        | **267/267** (33 web + 130 domain + 56 asset-catalog + 48 persistence) |
| `npm run build`          | OK        | build de producción completa                                          |
| Smoke preview            | OK        | HTTP 200 con `<title>LBA_Restaurant_Engine</title>`                   |
| `npm run audit:licenses` | OK        | 228 paquetes (sin cambios), todas permitidas                          |
| `npm run audit:security` | OK        | 0 vulnerabilidades                                                    |

### Estado de publicación

- Mismo flujo pendiente que 02.2 (push/PR/CI/merge cuando exista escritura remota). Sin cambios en THIRD_PARTY_NOTICES de terceros: el paquete no añade código externo.

## Criterios de salida de la fase (parcial)

| ID  | Criterio (FASE_02)                                 | Estado           | Notas                                                                                  |
| --- | -------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| 1   | Schemas con errores comprensibles y ruta de campo  | CUMPLIDO         | Invariantes por unidad + override validado; mensajes con explicación de la unidad      |
| 2   | IDs estables                                       | CUMPLIDO         | Sin cambios en esta iteración (ya cubierto en 02.1)                                    |
| 3   | Catálogo con propiedades/unidades                  | CUMPLIDO (local) | Prompt 02.2 ejecutado y verificado; pendiente de publicación junto a la correctiva     |
| 4   | Importación/migración sin pérdida silenciosa       | CUMPLIDO (local) | Prompt 02.3 ejecutado y verificado; pendiente de publicación junto al resto de la rama |
| 5   | Auditoría de salida (ida y vuelta, extensibilidad) | PENDIENTE        | Prompt 02.4                                                                            |

## Pendientes de la fase

1. Publicar e integrar la rama completa (correctiva 02.1-b/c + catálogo 02.2 + persistencia 02.3) cuando la escritura remota esté disponible; flujo de publicación documentado arriba.
2. Prompt 02.4 (auditoría de salida) después.
3. Rotación del token confirmada por el propietario y fecha registrada en `PHASE-01.md` (incidente de seguridad).
