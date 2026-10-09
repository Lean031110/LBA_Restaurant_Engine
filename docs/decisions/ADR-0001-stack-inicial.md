# ADR-0001: Stack técnico inicial

- **Estado:** Aceptado
- **Fecha:** 2026-10-09
- **Fase:** 00 (contrato) — se materializa en FASE 01
- **Decisor:** Leandro (propietario del proyecto), con el agente de programación como proponente

## Contexto

El proyecto necesita una base técnica para un simulador de operaciones de restaurante: editor 2D + motor de eventos discretos + vista 3D futura, ejecutable localmente, gratuito, sin servidor, reproducible y auditable. El usuario es principiante, por lo que la mantenibilidad y la documentación en español pesan más que la sofisticación. La política de licencias solo admite MIT, Apache-2.0, BSD-2/3, ISC, zlib y CC0 para activos; GPL/AGPL/LGPL y cualquier licencia desconocida o `NC`/`ND` quedan bloqueadas por defecto.

## Decisión

Adoptar el stack siguiente, verificado en npm/GitHub el **9 de octubre de 2026**:

| Capa                             | Elección                                                       | Versión verificada                                         | Licencia           |
| -------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------- | ------------------ |
| Lenguaje                         | TypeScript (línea 6.x, no la 7.x nativa aún)                   | 6.0.3                                                      | Apache-2.0         |
| UI                               | React + react-dom                                              | 19.3.0                                                     | MIT                |
| Build/Dev                        | Vite + @vitejs/plugin-react                                    | 8.3.4 / 6.1.2                                              | MIT                |
| Editor 2D (fase 03)              | Konva + react-konva                                            | a fijar en fase 03                                         | MIT                |
| Editor de flujos (fase 05/06)    | @xyflow/react                                                  | a fijar en su fase                                         | MIT                |
| Vista 3D (fase 10)               | three                                                          | a fijar en fase 10                                         | MIT                |
| Tests unitarios/integración      | Vitest + @vitest/coverage-v8                                   | 5.0.3                                                      | MIT                |
| DOM de pruebas                   | jsdom                                                          | 30.1.2                                                     | MIT                |
| Lint                             | ESLint + typescript-eslint + plugins react-hooks/react-refresh | 10.12.0 / 8.71.1                                           | MIT                |
| Formato                          | Prettier                                                       | 3.9.9                                                      | MIT                |
| Estado UI (cuando haga falta)    | Zustand — solo si reduce complejidad                           | a fijar                                                    | MIT                |
| Validación de esquemas (fase 02) | Zod — candidato                                                | a fijar                                                    | MIT                |
| Persistencia local (fase 03+)    | IndexedDB directo; Dexie opcional con ADR                      | a fijar                                                    | Apache-2.0 (Dexie) |
| CI                               | GitHub Actions (acciones fijadas por SHA completo)             | checkout v7.0.1, setup-node v7.1.0, upload-artifact v7.0.2 | MIT                |
| Motor de simulación              | **Propio, TypeScript**, eventos discretos deterministas        | —                                                          | —                  |

Versiones exactas instaladas en FASE 01 con lockfile comprometido (`package-lock.json`).

## Motivos

1. **TypeScript en toda la pila** — el contrato del motor exige tipos estrictos y validación de escenarios; un solo lenguaje evita un segundo motor en Python.
2. **TypeScript 6.0.3 y no 7.0.2** — typescript-eslint 8.71.1 (verificado en npm) declara compatibilidad `>=4.8.4 <6.1.0`; la versión 7.x (port nativo) aún no está soportada por el ecosistema de lint. Se retomará cuando typescript-eslint lo declare.
3. **React 19 + Vite 8** — estándar de facto para apps locales; recarga rápida; sin servidor en producción; `vitest` 5.0.3 declara soporte para Vite 8 (peer deps verificadas).
4. **Konva para el editor 2D** — orientado a editores interactivos de objetos (selección, arrastre, transformadores); PixiJS queda como alternativa solo con benchmark que lo justifique (regla de la guía).
5. **Motor propio** — SimPy es solo referencia conceptual; el producto exige reproducibilidad local sin Python en runtime.
6. **Acciones de GitHub fijadas por SHA** — verificadas vía API de GitHub el 2026-10-09 (tags apuntando directamente a commits).

## Alternativas descartadas

- **Next.js/SSR**: aporta servidor y complejidad que el proyecto prohíbe; no hay necesidad de backend.
- **PixiJS como motor 2D inicial**: renderizador excelente pero genérico; Konva encaja mejor en edición de objetos.
- **Sweet Home 3D incrustado**: GPL, incompatible con la política permisiva.
- **Recast Navigation JS desde el inicio**: se evaluará solo si A* sobre grid resulta insuficiente (fase 07).
- **RVO2**: se pospone; primero reserva de pasos y congestión propias.
- **Playwright desde la fase 01**: se incorpora cuando exista UI estable (fase 03+), como indica la guía.

## Consecuencias

- Workspace npm con `apps/web` y `packages/*` creados por fase.
- Node fijado en `.nvmrc` (línea LTS 24) y en Actions; `npm ci` como instalación reproducible.
- Toda dependencia futura pasa por verificación de licencia/versión antes de instalarse, y queda reflejada en `THIRD_PARTY_NOTICES.md` y en el informe de licencias del CI.
- Reversibilidad: cada cambio de librería importante requerirá un ADR nuevo.

## Condición de revisión

Revisar este ADR al cerrar las fases 03 (Konva en producción), 04 (motor) y 10 (Three.js), o cuando una dependencia cambie de licencia/mantenimiento.
