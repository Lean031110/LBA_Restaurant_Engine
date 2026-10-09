# ADR-0002: Excepciones de licencia para dependencias transitivas del toolchain de build

- **Estado:** Aceptado
- **Fecha:** 2026-10-09
- **Fase:** 01 (base técnica)
- **Decisor:** Leandro (propietario), con el agente de programación como proponente

## Contexto

La primera auditoría de licencias (`npm run audit:licenses`, 2026-10-09) detectó 5 dependencias transitivas con licencias fuera de la lista preferida del proyecto (MIT, Apache-2.0, BSD-2/3, ISC, zlib), todas introducidas por el toolchain de build de Vite 8, no por código de runtime de la aplicación:

| Paquete                                  | Versión      | Licencia  | Introducida por              | Uso                                    |
| ---------------------------------------- | ------------ | --------- | ---------------------------- | -------------------------------------- |
| @csstools/color-helpers                  | 6.1.2        | MIT-0     | postcss-preset-env (cssnano) | Manipulación de color en build CSS     |
| @csstools/css-syntax-patches-for-csstree | 1.1.15       | MIT-0     | cssnano                      | Parches de sintaxis CSS en build       |
| caniuse-lite                             | 1.0.30001815 | CC-BY-4.0 | browserslist                 | Datos de compatibilidad de navegadores |
| lightningcss                             | 1.33.0       | MPL-2.0   | vite (minificación CSS)      | Minificador CSS en build               |
| lightningcss-linux-x64-gnu               | 1.33.0       | MPL-2.0   | lightningcss                 | Binario nativo del anterior            |

## Decisión

Ampliar la lista permitida del auditor de licencias con tres entradas **acotadas y documentadas**:

1. **MIT-0** (SPDX `MIT-0`, «MIT No Attribution»): idéntica a MIT sin obligación de aviso; es _más_ permisiva que MIT. Incluida sin restricciones.
2. **CC-BY-4.0**: permitida **solo para datos/activos con atribución documentada** (política ya prevista en la guía para CC BY). `caniuse-lite` distribuye datos de compatibilidad, no código ejecutable. Atribución registrada en `THIRD_PARTY_NOTICES.md`.
3. **MPL-2.0**: permitida **solo para herramientas de build sin modificar**. MPL-2.0 es copyleft a nivel de archivo: las obligaciones de compartir código aplican únicamente a los archivos MPL modificados, no al software que las usa como herramienta. No distribuimos ni modificamos estos paquetes; el CSS minificado resultante es obra propia. Queda prohibido incorporar código MPL en el runtime de la aplicación.

## Alternativas descartadas

- **Eliminar Vite 8 / forzar lightningcss fuera del árbol**: lightningcss es dependencia del propio Vite para minificación CSS; excluirla rompe la reproducibilidad del build (regla de la guía de no cambiar gestor/herramientas sin ADR) y no elimina el resto de paquetes.
- **Parchear `package-lock.json` a mano**: frágil, se pierde en cada `npm install`, contradice la instalación reproducible.
- **Marcar el paso como `continue-on-error`**: prohibido por la guía (fingir verde).

## Consecuencias

- El auditor (`scripts/audit-licenses.mjs`) mantiene MPL-2.0 y CC-BY-4.0 como excepciones comentadas con su alcance.
- Cualquier dependencia nueva de runtime con MPL/LGPL/GPL/AGPL/NC/ND/desconocida sigue bloqueada y requiere un ADR nuevo.
- Revisión: si Vite permite elegir minificador CSS alternativo con licencia preferida (esbuild) sin pérdida funcional, se evaluará revertir la excepción MPL-2.0.

## Condición de revisión

Revisar al cerrar la FASE 03 (build con assets reales) y en cada actualización mayor de Vite.
