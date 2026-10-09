# Cómo contribuir a LBA_Restaurant_Engine

Gracias por tu interés. Este proyecto sigue una **disciplina de fases estricta** definida en la guía maestra ([`docs/guia/`](guia/README.md)). Leerla antes de contribuir es obligatorio.

## Reglas básicas

1. **No se salta fases.** La secuencia es FASE 00 → 11. Cada fase tiene criterios de salida verificables en su archivo de `docs/guia/FASES/`.
2. **Rama + PR por entrega.** No se hace push directo a `main` (salvo el commit inicial de constitución del repositorio). El merge se ejecuta solo tras verificación completa —checks del SHA final en verde, conflictos resueltos, sin pérdida de cambios de `main`, pruebas y auditorías reales, evidencias publicadas— conforme a la autorización del propietario (2026-10-09) para que el agente fusione sus propios PR verificados, preferentemente con squash.
3. **Convención de ramas:** `feat/phase-XX-descripcion`, `fix/phase-XX-descripcion`, `docs/phase-XX-descripcion`.
4. **Convención de commits:** `tipo(scope): descripción en presente`, p. ej. `feat(phase-03): add wall drawing tool`. Referencia fase e iteración cuando aplique.
5. **Cambios pequeños.** Varios commits claros valen más que uno monolítico.
6. **Sin secretos jamás.** Ni tokens, ni `.env`, ni claves. Ver `SECURITY.md`.
7. **Licencias permisivas únicamente:** MIT, Apache-2.0, BSD-2/3, ISC, zlib (y CC0 para activos). GPL/AGPL/LGPL, `NC`, `ND`, desconocidas o de pago: prohibidas sin ADR aprobado.
8. **Todo parámetro de simulación** (tiempo, temperatura, capacidad) se registra con valor, unidad, procedencia y nivel de confianza, según la plantilla `docs/guia/PLANTILLAS/REGISTRO_DE_PARAMETRO.md`.

## Antes de abrir un PR

```bash
npm ci            # instalación reproducible desde el lockfile
npm run lint      # ESLint
npm run typecheck # TypeScript sin emitir
npm run test      # Vitest con cobertura
npm run build     # build de producción
```

El CI de GitHub Actions ejecuta lo mismo (más la auditoría de licencias) y **debe estar en verde**. Los artefactos de evidencia se conservan aunque falle un paso.

## Informe de entrega

Toda entrega de fase usa la plantilla `docs/guia/PLANTILLAS/CIERRE_DE_FASE.md` y se guarda en `docs/evidence/PHASE-XX.md`, con SHA exacto, URL real del workflow de Actions, comandos ejecutados y resultados literales. Las afirmaciones sin evidencia se marcan `NO VERIFICADO` y bloquean el avance.

## Reporte de errores

Abre un issue usando la plantilla `docs/guia/PLANTILLAS/INCIDENCIA.md`: reproducción paso a paso, resultado esperado vs. obtenido, módulo y logs relevantes.
