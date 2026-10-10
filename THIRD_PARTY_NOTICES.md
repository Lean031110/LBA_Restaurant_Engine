# Avisos de terceros — LBA_Restaurant_Engine

Inventario de dependencias y activos de terceros con licencia, versión, URL oficial y finalidad. La política del proyecto (docs/guia/02_RECURSOS_LICENCIAS_Y_PARAMETROS.md) solo admite licencias permisivas: MIT, Apache-2.0, BSD-2/3-Clause, ISC, zlib (y CC0 para activos). Este archivo se actualiza en cada adición de dependencias y el CI genera un informe automático (`npm run audit:licenses`) que falla ante licencias desconocidas o no permitidas.

Versiones y licencias verificadas en npm el **9 de octubre de 2026**.

## Dependencias directas — runtime (apps/web)

| Paquete   | Versión | Licencia | URL oficial       | Finalidad                      |
| --------- | ------- | -------- | ----------------- | ------------------------------ |
| react     | 19.3.0  | MIT      | https://react.dev | Biblioteca de interfaz         |
| react-dom | 19.3.0  | MIT      | https://react.dev | Renderizado de React en el DOM |

## Dependencias directas — runtime (packages/domain, FASE 02)

| Paquete | Versión | Licencia | URL oficial     | Finalidad                                             |
| ------- | ------- | -------- | --------------- | ----------------------------------------------------- |
| zod     | 4.6.5   | MIT      | https://zod.dev | Validación de esquemas del dominio con rutas de campo |

> Nota: `zod@4.6.5` ya figuraba en el árbol de dependencias (transitiva de `eslint-plugin-react-hooks`) y fue verificada de nuevo (licencia MIT, auditoría del CI) antes de promoverla a dependencia directa de `@lba/domain` en la FASE 02; no añade paquetes nuevos al lockfile.

## packages/asset-catalog (FASE 02, prompt 02.2)

- **Sin código de terceros**: el paquete declara datos (presets, materiales, propiedades, iconos) y reutiliza los esquemas de `@lba/domain`; su única dependencia de runtime es `zod@4.6.5` (workspace `@lba/domain`, misma versión ya verificada arriba), y las de desarrollo coinciden con las existentes (typescript, vitest, coverage-v8). El lockfile solo añade el link del workspace.
- **Iconos vectoriales**: los 22 trazados SVG de `src/icons.ts` son obra original de este proyecto (geometría básica dibujada a mano; sin descargas ni redistribución de recursos de terceros), cubiertos por la licencia MIT del proyecto. No hay activos de terceros en el catálogo.

## packages/persistence (FASE 02, prompt 02.3)

- **Sin código de terceros**: importación/exportación de escenarios sobre `@lba/domain` (workspace) y JSON nativo; ni una dependencia externa nueva (el lockfile solo añade el link). Las herramientas de desarrollo (typescript, vitest, coverage-v8) coinciden con las ya verificadas; los fixtures usados por las pruebas son los propios de `scenarios/fixtures`.

## Dependencias directas — desarrollo (apps/web)

| Paquete                   | Versión | Licencia   | URL oficial                                        | Finalidad                      |
| ------------------------- | ------- | ---------- | -------------------------------------------------- | ------------------------------ |
| typescript                | 6.0.3   | Apache-2.0 | https://www.typescriptlang.org                     | Tipado y toolchain             |
| vite                      | 8.3.4   | MIT        | https://vite.dev                                   | Servidor de desarrollo y build |
| @vitejs/plugin-react      | 6.1.2   | MIT        | https://github.com/vitejs/vite-plugin-react        | Integración React en Vite      |
| vitest                    | 5.0.3   | MIT        | https://vitest.dev                                 | Pruebas unitarias/integración  |
| @vitest/coverage-v8       | 5.0.3   | MIT        | https://vitest.dev                                 | Cobertura de pruebas           |
| jsdom                     | 30.1.2  | MIT        | https://github.com/jsdom/jsdom                     | Entorno DOM para pruebas       |
| @testing-library/react    | 16.3.3  | MIT        | https://testing-library.com                        | Pruebas de componentes React   |
| @testing-library/jest-dom | 7.0.1   | MIT        | https://testing-library.com                        | Matchers de DOM para pruebas   |
| @types/react              | 19.3.0  | MIT        | https://github.com/DefinitelyTyped/DefinitelyTyped | Tipos de React                 |
| @types/react-dom          | 19.3.0  | MIT        | https://github.com/DefinitelyTyped/DefinitelyTyped | Tipos de react-dom             |

## Dependencias directas — desarrollo (raíz del workspace)

| Paquete                     | Versión | Licencia | URL oficial                                                | Finalidad                     |
| --------------------------- | ------- | -------- | ---------------------------------------------------------- | ----------------------------- |
| eslint                      | 10.12.0 | MIT      | https://eslint.org                                         | Lint                          |
| typescript-eslint           | 8.71.1  | MIT      | https://typescript-eslint.io                               | Reglas ESLint para TypeScript |
| eslint-plugin-react-hooks   | 7.1.1   | MIT      | https://react.dev/reference/eslint-plugin-react-hooks      | Reglas de hooks               |
| eslint-plugin-react-refresh | 0.5.7   | MIT      | https://github.com/ArnaudBarre/eslint-plugin-react-refresh | Reglas de Fast Refresh        |
| prettier                    | 3.9.9   | MIT      | https://prettier.io                                        | Formato de código             |

## Dependencias transitivas

El listado completo (con versiones resueltas) se genera automáticamente en `reports/license-report.json` ejecutando `npm run audit:licenses`, y se conserva como artefacto en cada ejecución de CI. Las transitivas de la FASE 01 pertenecen a la cadena de las herramientas anteriores (Vite, Vitest, ESLint, Prettier, jsdom) y sus licencias se auditan en cada push.

### Excepciones de licencia aprobadas (ADR-0002)

La primera auditoría (2026-10-09) detectó 5 transitivas del toolchain de build con licencias fuera de la lista preferida. Evaluadas y aprobadas en `docs/decisions/ADR-0002-licencias-transitivas-build.md`:

| Paquete                                  | Versión      | Licencia  | Alcance aprobado                                                                                |
| ---------------------------------------- | ------------ | --------- | ----------------------------------------------------------------------------------------------- |
| @csstools/color-helpers                  | 6.1.2        | MIT-0     | Sin restricciones (más permisiva que MIT)                                                       |
| @csstools/css-syntax-patches-for-csstree | 1.1.15       | MIT-0     | Sin restricciones (más permisiva que MIT)                                                       |
| caniuse-lite                             | 1.0.30001815 | CC-BY-4.0 | Solo datos; atribución: _Datos de compatibilidad de navegadores por caniuse.com bajo CC-BY-4.0_ |
| lightningcss                             | 1.33.0       | MPL-2.0   | Solo herramienta de build sin modificar                                                         |
| lightningcss-linux-x64-gnu               | 1.33.0       | MPL-2.0   | Solo herramienta de build sin modificar                                                         |

Cualquier dependencia futura con licencia MPL/LGPL/GPL/AGPL, `NC`, `ND` o desconocida sigue bloqueada por el auditor y requerirá un ADR nuevo.

## Acciones de GitHub (CI)

| Acción                  | Versión (SHA fijado, verificado 2026-10-09)         | Licencia |
| ----------------------- | --------------------------------------------------- | -------- |
| actions/checkout        | v7.0.1 (`3d3c42e5aac5ba805825da76410c181273ba90b1`) | MIT      |
| actions/setup-node      | v7.1.0 (`949feb2413d6458794dcd2491c4babbbce0c15c1`) | MIT      |
| actions/upload-artifact | v7.0.2 (`cf430e030ddbb5b0abf93d22962f4752f3646cd9`) | MIT      |

## Activos (assets)

- Ninguno de terceros incorporado todavía (FASE 01). Los futuros activos se registrarán en `assets/ATTRIBUTION.md` con pack, licencia, URL y fecha de descarga.

## Aviso de licencia del proyecto

El código propio de este repositorio se distribuye bajo MIT (`LICENSE`): `Copyright (c) 2026 Leandro (@lean0311g)`. Las licencias anteriores de terceros se mantienen tal cual; este proyecto no cambia la licencia de software ajeno.
