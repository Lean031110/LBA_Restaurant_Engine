# Recursos reutilizables, licencias y parámetros

## Política general

El programa y sus dependencias deben ser gratuitos para desarrollar y ejecutar, con código reutilizable y sin suscripciones obligatorias. “Gratis en una página” no significa “libre de condiciones”. Antes de usar algo se registra: nombre, versión, URL oficial, licencia SPDX o texto de licencia, finalidad, modificaciones locales, dependencias transitivas y archivo/asset incorporado. Las licencias se verifican otra vez al instalar, no solo al escribir esta guía.

## Selección recomendada

| Recurso | Licencia verificada/esperada | Papel | Decisión |
|---|---|---|---|
| React | MIT | Interfaz | Usar como base de la web. |
| Vite | MIT (con licencias de dependencias transitivas que se deben conservar) | Desarrollo/build | Usar, generar informe de dependencias cuando sea posible. |
| TypeScript | Apache-2.0 | Tipado y toolchain | Usar; conservar avisos. |
| Konva + React Konva | MIT | Editor gráfico 2D | Selección principal para paredes, objetos, drag/drop y transformaciones. |
| XYFlow / React Flow | MIT | Editor visual de nodos y enlaces | Introducir cuando se construyan flujos visuales; no usarlo para simular el proceso. |
| Three.js | MIT | Vista 3D posterior | Mantener en módulo separado y añadir en fase 10. |
| Vitest | MIT | Test unitario/integración y cobertura | Usar como herramienta de test JS/TS. |
| Playwright | Apache-2.0 | Pruebas end-to-end, capturas y trazas | Usar cuando existan flujos de UI estables. |
| Zustand | MIT | Estado de UI opcional | Usar solo si reduce complejidad; no convertirlo en motor de simulación. |
| Zod | MIT | Validación de datos/escenarios | Recomendado si encaja con el stack elegido. |
| Dexie | Apache-2.0 | API cómoda para IndexedDB | Opcional. Si se evita, documentar la persistencia nativa escogida. |
| Recast Navigation JS | Wrapper MIT; el código original Recast/Detour usa zlib | Navegación basada en navmesh | No obligatorio al inicio; evaluar licencia de la versión exacta y dependencias. |
| RVO2 | Apache-2.0 | Evitación recíproca de colisiones en 2D | Referencia/opción futura, no integrar sin necesidad y prueba de compatibilidad. |
| SimPy | MIT | Referencia didáctica del enfoque de eventos discretos | No usar como segunda implementación en runtime: el motor de producto será TypeScript. |
| Lucide | ISC; determinados iconos heredados incluyen avisos MIT | Iconos | Registrar y conservar notices según versión. |
| Kenney assets | CC0 según su política; revisar el archivo incluido en cada pack | Arte 2D/3D básico | Fuente candidata para placeholders, con registro de cada pack. |
| Poly Haven | CC0 para los assets descritos en su página de licencia | Texturas/modelos/HDRI para la futura vista 3D | Descargar de forma controlada; no depender de su API en ejecución. |

No son necesidades iniciales: PixiJS si Konva cubre la edición 2D; Sweet Home 3D como código incrustado (su proyecto está bajo GPL, incompatible con la política permisiva de esta guía); un motor comercial de simulación; un servicio remoto de IA; un motor de juego completo; servidores o bases de datos en la nube.

## Alternativas permitidas, pero requieren decisión escrita

- **PixiJS (MIT):** excelente renderizador 2D, pero no se añade en paralelo a Konva sin un benchmark que pruebe beneficio. Konva está mejor orientado al editor interactivo de objetos del MVP.
- **Recast Navigation JS (MIT para ese wrapper):** puede generar navmesh y calcular rutas para movimiento menos cuadriculado. Se incorpora únicamente cuando las pruebas de la navegación inicial indiquen que el grid/graph no cumple. No se debe asumir que el wrapper elimina la necesidad de respetar la licencia del código base, sus paquetes wasm y sus assets de ejemplo.
- **RVO2:** evitar colisiones agente-agente; integración WASM/C++ añade complejidad. Primero implementar y probar reserva de posiciones, pasillos y bloqueo por recursos.
- **Sweet Home 3D:** puede servir como inspiración para interacción de plano y formatos, pero no se copia ni incrusta bajo la política inicial. GPL supone obligaciones de distribución diferentes.
- **Datos de alimentos:** si se usa un conjunto de datos externo, auditar licencia de base de datos e imágenes por separado. Open Food Facts, por ejemplo, declara ODbL para la base y CC BY-SA para contenido visual en su documentación; no se importará masivamente sin revisar esas condiciones.

## Política mínima de licencias

1. Licencia del código propio recomendada: **MIT**, con titularidad y aviso `Copyright (c) 2026 Leandro (@lean0311g)` y el texto completo de MIT.
2. Mantener `THIRD_PARTY_NOTICES.md`, `assets/ATTRIBUTION.md` y un inventario de dependencias/activos. No cambiar la licencia del software de terceros por la del proyecto.
3. Lista inicial preferida para software: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC y zlib. Otras licencias se deben evaluar de forma explícita antes de incluirlas. CC0 para recursos y CC BY si se documenta la atribución exacta.
4. Bloquear dependencias con licencia desconocida, propietaria, no comercial, sin derivados, con acceso o actualización pagada obligatoria, o con condiciones de servicio que impidan el objetivo. También bloquear GPL/AGPL/LGPL por defecto para no introducir obligaciones de distribución no deseadas; revisar toda dependencia transitiva.
5. No descargar recursos de páginas de recopilación sin volver a la fuente original. Cada textura, icono, modelo, audio y fuente tipográfica conserva archivo de licencia/atribución, URL y fecha.
6. No hacer requests a APIs externas para que se pueda ejecutar la aplicación. Assets de terceros se incluyen localmente solo tras revisar licencia/tamaño y posibilidad de redistribución.
7. Crear un workflow que produzca un informe de licencias y falle ante estado desconocido/no permitido. Una excepción debe quedar aprobada en un ADR y documentada.

### Nota honesta sobre créditos

MIT exige conservar los avisos de copyright y el texto de licencia en copias o partes sustanciales. No garantiza, por sí sola, que todo proyecto derivado muestre un crédito prominente en su interfaz o README. Si la prioridad es usar una licencia estándar, sencilla y muy permisiva, MIT es una buena elección y el README puede pedir que se reconozca el origen, por ejemplo: “Basado en LBA_Restaurant_Engine, por @lean0311g”. Si el crédito visible obligatorio es una condición legal innegociable, habría que revisar una licencia distinta con asesoramiento especializado; inventar una cláusula y seguir llamándola MIT sería engañoso.

## Registro de parámetros realistas

Cada duración/temperatura/capacidad del catálogo incluye:
- `value` y `unit`, límites razonables y si puede editarse;
- `sourceType`: `measured`, `official_source`, `manufacturer`, `estimated`, `user_calibrated`;
- `sourceUrl`, `checkedAt`, descripción del supuesto y nivel de confianza;
- `scenarioOverride`, para que un local pueda usar sus propios tiempos;
- comentarios sobre lo que no representa el valor.

Ejemplos de propiedades de equipo:
- plancha: `powerOnSeconds`, `targetTemperatureC`, `warmupSeconds`, `heatRecoverySeconds`, `maxItems`, `cooldownSeconds`, `cleaningSeconds`;
- batidora: `startupSeconds`, `cycleSeconds`, `maxBatchUnits`, `cleaningSeconds`, `requiresFreeContainer`;
- impresora: `ticketPrintSeconds`, `queueCapacity`, `paperAvailable`;
- fregadero/lavavajillas: `capacity`, `washSeconds`, `drySeconds`, `cleaningSeconds`;
- horno de pizza: `warmupSeconds`, `targetTemperatureC`, `bakeSeconds`, `capacity`, `recoverySeconds`;
- mesa: `seats`, `cleaningSeconds`, `accessibleClearance`;
- cada acción: duración base, recursos requeridos, precondiciones, efecto, bloqueo y estrategia si falla.

Los valores iniciales deben estar etiquetados como **estimaciones de ejemplo** si no existe una fuente fiable para ese modelo exacto de equipo. El calentamiento de una plancha concreta depende de potencia, masa térmica, voltaje/combustible, ambiente y carga; no se inventará una duración universal.

La temperatura de la superficie no es lo mismo que la temperatura interior del alimento. Si se muestra una referencia de seguridad alimentaria (por ejemplo, la recomendación USDA para carne molida), se cita la fuente, se registra la fecha y se aclara que las normas locales pueden diferir. La simulación no puede declararse certificadora ni reemplazar un termómetro, el manual del equipo o la normativa local.
