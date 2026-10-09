# LBA_Restaurant_Engine

> **Simulador profesional de operaciones de restaurante** — editor 2D + motor de simulación determinista de eventos discretos. Gratuito, de código abierto (MIT), ejecutable 100 % en local.

**LBA Restaurant Engine** es un laboratorio virtual de operaciones: dibuja tu local en 2D (paredes, puertas, mesas, equipos, zonas), define roles, recetas, equipos e inventario, y ejecuta simulaciones reproducibles para **identificar cuellos de botella antes de abrir o reorganizar un negocio**. La vista 3D (fase 10) será una forma más de observar la misma simulación, no un segundo motor.

|              |                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Estado**   | 🚧 En desarrollo — FASE 01 (base técnica, CI y logs)                                                                              |
| **Stack**    | TypeScript 6 · React 19 · Vite 8 · Konva (editor 2D, fase 03) · motor propio de eventos discretos · Vitest 5 · Three.js (fase 10) |
| **Licencia** | [MIT](LICENSE) — `Copyright (c) 2026 Leandro (@lean0311g)`                                                                        |
| **Idioma**   | Español (documentación y UI)                                                                                                      |

## Guía maestra del proyecto

El desarrollo está gobernado por una guía maestra completa que se conserva en este repositorio para que **las instrucciones nunca se pierdan** y cualquier persona o agente pueda seguirlas siempre:

- [README de la guía](docs/guia/README.md) — índice completo y mapa de fases
- [Prompt maestro del agente](docs/guia/00_PROMPT_MAESTRO_CODEX.md) — reglas no negociables
- [Arquitectura y estructura](docs/guia/01_ARQUITECTURA_Y_ESTRUCTURA.md)
- [Recursos, licencias y parámetros](docs/guia/02_RECURSOS_LICENCIAS_Y_PARAMETROS.md)
- [GitHub Actions, logs y evidencias](docs/guia/03_GITHUB_ACTIONS_LOGS_EVIDENCIAS.md)
- [Contrato del motor y modelo de datos](docs/guia/04_CONTRATO_DE_SIMULACION_Y_DATOS.md)
- [Flujo de revisión con auditoría externa](docs/guia/05_FLUJO_DE_REVISION_CON_CHATGPT.md)
- [Fases 00–11](docs/guia/FASES/README.md) · [Matriz de aceptación global](docs/guia/MATRIZ_DE_ACEPTACION_GLOBAL.md)

> **Regla de oro:** una fase no se considera terminada porque la IA afirme que lo está. Se cierra únicamente cuando el código, las pruebas, GitHub Actions, los logs y las evidencias verificables cumplen los criterios de esa fase.

## Documentación del proyecto

| Documento                                                                                    | Contenido                                                 |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [Alcance y exclusiones](docs/alcance.md)                                                     | Qué se construye, qué queda fuera y por qué               |
| [Mapa de módulos](docs/arquitectura/mapa-modulos.md)                                         | Estructura del repo y límites de responsabilidad          |
| [ADR-0001 — Stack inicial](docs/decisions/ADR-0001-stack-inicial.md)                         | Decisiones técnicas con versiones y licencias verificadas |
| [ADR-0002 — Excepciones de licencia](docs/decisions/ADR-0002-licencias-transitivas-build.md) | Evaluación de licencias transitivas del toolchain         |
| [Backlog maestro](docs/backlog.md)                                                           | Fases 00–11 con criterios de salida                       |
| [Riesgos y supuestos](docs/riesgos.md)                                                       | Inventario de riesgos con mitigaciones                    |
| [Evidencias de fase](docs/evidence/)                                                         | Informes de cierre por fase (SHA, Actions, artefactos)    |

## Ejecutar en local

Requisitos: Node.js 24 LTS (la versión exacta está fijada en `.nvmrc`).

```bash
npm ci               # instala dependencias exactas del lockfile
npm run dev          # app de desarrollo → http://localhost:5173
npm test             # pruebas unitarias/integración con cobertura (Vitest)
npm run lint         # ESLint
npm run typecheck    # TypeScript sin emitir
npm run build        # build de producción (apps/web/dist)
npm run audit:licenses  # informe de licencias de dependencias
npm run audit:security  # npm audit (nivel high)
```

La pantalla base muestra el layout del producto (controles de simulación, herramientas, lienzo, inspector, eventos/estadísticas) con los paneles de fases futuras deshabilitados y su fase prevista, más el **panel de diagnóstico**: registro estructurado de la aplicación con niveles, códigos de evento, sanitización de secretos y exportación JSONL.

## Cómo contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Resumen: rama + PR por entrega, fases sin saltar, evidencia verificable, licencias permisivas, sin secretos. Para vulnerabilidades: [SECURITY.md](SECURITY.md).

## Créditos y licencias de terceros

Proyecto bajo [MIT](LICENSE). Las licencias de las dependencias se detallan en [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) y se auditan automáticamente en CI. Si construyes sobre este proyecto, se agradece el reconocimiento: _“Basado en LBA_Restaurant_Engine, por @lean0311g”_.
