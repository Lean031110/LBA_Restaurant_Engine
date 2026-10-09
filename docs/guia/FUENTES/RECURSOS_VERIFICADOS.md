# Fuentes oficiales y recursos revisados

**Fecha de revisión de esta guía:** 2026-10-09. Las versiones, condiciones y mantenimiento de software cambian; vuelve a abrir la página oficial justo antes de instalar.

## Interfaz y gráficos

- React, licencia MIT: https://github.com/facebook/react
- Vite, licencia MIT y detalles de dependencias incluidas: https://github.com/vitejs/vite/blob/main/packages/vite/LICENSE.md
- Konva, lienzo interactivo 2D, MIT: https://github.com/konvajs/konva
- React Konva, componentes React para Konva, MIT: https://github.com/konvajs/react-konva
- XYFlow / React Flow, editor de flujos de nodos, licencia MIT declarada por el proyecto: https://xyflow.com/open-source
- Three.js, renderizador 3D, MIT: https://threejs.org/license/
- Lucide, iconos, licencia ISC con avisos de determinados iconos derivados: https://github.com/lucide-icons/lucide/blob/main/LICENSE
- shadcn/ui, componentes accesibles y código personalizable bajo MIT: https://github.com/shadcn-ui/ui

## Simulación, navegación y persistencia

- SimPy, explicación útil de simulación de eventos discretos y recursos compartidos; MIT: https://simpy.readthedocs.io/en/stable/
- Recast Navigation (Recast/Detour), biblioteca de navegación con licencia zlib: https://github.com/recastnavigation/recastnavigation
- Recast Navigation JS, wrapper WebAssembly para JavaScript, licencia MIT del wrapper: https://github.com/isaac-mason/recast-navigation-js
- RVO2, evitación recíproca de colisiones en 2D, Apache-2.0: https://github.com/snape/RVO2
- RBush, índice espacial 2D para consultas rápidas, MIT: https://github.com/mourner/rbush
- Zustand, estado de interfaz, MIT: https://github.com/pmndrs/zustand
- Dexie.js, API de IndexedDB, Apache-2.0: https://github.com/dexie/Dexie.js

## Pruebas y automatización

- Vitest, licencia MIT: https://github.com/vitest-dev/vitest
- Cobertura de Vitest: https://vitest.dev/guide/coverage.html
- Playwright, proyecto oficial: https://github.com/microsoft/playwright
- GitHub Actions: artefactos de ejecución (logs, reportes, capturas y otros resultados): https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts
- Acción oficial para subir artefactos, y notas de versiones: https://github.com/actions/upload-artifact
- Calendario oficial de Node.js; la versión LTS debe comprobarse el día que se inicie el código: https://github.com/nodejs/Release#release-schedule

## Recursos visuales

- Kenney: preguntas frecuentes sobre assets CC0 y atribución no obligatoria; revisar también el archivo de licencia incluido en el paquete concreto: https://kenney.nl/support
- Catálogo de assets Kenney: https://kenney.nl/assets
- Poly Haven: licencia CC0 para sus assets, con ToS separado para el acceso a su web/API; descargar y guardar localmente los archivos necesarios: https://polyhaven.com/license
- Open Food Facts: licencia de base de datos ODbL y condiciones separadas para contenidos/imágenes: https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/tutorials/license-be-on-the-legal-side.md

## Parámetros de preparación de alimentos

- USDA FSIS, tabla de temperaturas mínimas internas: https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart
- USDA FSIS, carne molida y recomendaciones de seguridad: https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/meat/ground-beef-and-food-safety

Estas fuentes son referencia informativa. La aplicación debe expresar que las recomendaciones de USDA son de ese organismo y pueden no coincidir con las obligaciones legales del lugar donde se opere. No inferir un tiempo de cocción universal a partir de una temperatura. El modelo de simulación requiere temperatura interna/condiciones de proceso y, para una validación real, medición física/calibración.

## Recursos no seleccionados como dependencia del proyecto

- Sweet Home 3D puede ayudar como referencia de interacción/edición, pero su licencia GPL supone condiciones de distribución distintas de la licencia permisiva elegida para este proyecto. No incorporar código suyo al repositorio bajo la regla actual: https://www.sweethome3d.com/license/
- PixiJS es MIT y puede renderizar 2D, pero introducirlo junto a Konva duplicaría el stack gráfico sin beneficio demostrado. Solo reconsiderar con un ADR y un benchmark: https://github.com/pixijs/pixijs

## Cómo tratar esta lista

La lista no autoriza automáticamente cada versión o asset. Codex debe revisar la versión exacta, release, archivo LICENSE, dependencias transitivas, advisories de seguridad y política de licencia antes de instalar. Si la licencia no está clara, bloquear y proponer alternativa conocida.
