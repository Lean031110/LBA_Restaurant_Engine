# Matriz global de aceptación de LBA_Restaurant_Engine

Este archivo ayuda a revisar la versión integrada. Cada elemento debe vincularse a un test, evidencia y archivo que lo implementa.

## Editor 2D
- [ ] Dibujo de pared por arrastre de punto inicial a final y edición de grosor/material/color.
- [ ] Puertas, ventanas, mesas, sillas, mostradores, zonas y equipos desde catálogo predefinido.
- [ ] Snap grid, zoom/pan, selección, mover, rotar, duplicar, borrar, multi-select, undo/redo.
- [ ] Inspector básico y avanzado; validación de dimensiones y persistencia.
- [ ] Guardar, autosave si procede, importar/exportar escenario versionado.
- [ ] Objetos con metadatos para colisión, punto de interacción y parámetros de simulación.

## Simulación y datos
- [ ] Motor separado de la UI con reloj/eventos deterministas.
- [ ] Pausar/reanudar/paso de evento/reset/velocidad sin cambiar el resultado lógico.
- [ ] Dependencias, recursos, locks, capacidades, stock y errores consistentes.
- [ ] Calentamiento/equipo listo/proceso/recuperación/enfriamiento/limpieza según parámetros configurables.
- [ ] Recetas con versiones, variantes, tareas paralelas y límites de equipos.
- [ ] Logs diagnósticos separados del historial de eventos simulado.

## Personas y áreas
- [ ] Roles principales: dependiente, cocinero, pizzero, bartender, lunchero/preparador, fregador, con capacidad para roles custom.
- [ ] Reglas/flujo personalizable por rol, zona, prioridad, skill, recursos y estado.
- [ ] Panel de próximo paso/motivo/regla y bloqueos, siempre derivado de la decisión real.
- [ ] Acciones secundarias en tiempos ociosos y ayuda entre áreas bajo reglas explícitas.
- [ ] Clientes, grupos, espera, llamada, mesas limpias/sucias, cocina, bar, pizzería, VIP, pedidos y entrega.
- [ ] Trayectorias con obstáculos, puertas, pasillos estrechos, colas, bloqueos y rutas alternas.

## Analítica
- [ ] Duración de pedido por etapa, mediana/percentiles, colas, utilización y distancias.
- [ ] Reportes de ruta bloqueada, falta de stock y tareas que impiden el flujo.
- [ ] Escenarios A/B y exportación reproducible con semilla, versión y supuestos.
- [ ] Aclaraciones visibles sobre datos estimados y límites de validez.

## Vista 3D
- [ ] Se construye desde los mismos datos/estados del modelo 2D.
- [ ] Cámara/orbita/zoom/selección y seguimiento de agentes.
- [ ] No ejecuta un reloj, recetas o lógica propios.
- [ ] Error o WebGL no compatible no impiden usar 2D.

## Ingeniería de calidad
- [ ] Todos los botones/herramientas/propiedades/tipos de objeto inventariados con tests.
- [ ] Unit/integration/e2e, cobertura de la lógica crítica y test de escenarios integrados.
- [ ] CI con permisos mínimos, logs y reportes adjuntos incluso al fallar.
- [ ] Informe de dependencias/licencias y notices completos.
- [ ] No se necesita un servidor, cloud o API para usar la aplicación.
- [ ] README documenta requisitos, instalación, ejecución, import/export, logs, tests, backup y errores comunes.
- [ ] No se declara validación de seguridad alimentaria, accesibilidad o seguridad física sin mediciones/revisión competente.

## Definición de “funcional”

“Funcional” significa que los flujos listados ejecutan y producen resultados que se comprueban con pruebas, que el usuario puede guardar/reabrir sus escenarios, que los errores muestran causas rastreables y que la misma entrada reproducible da la misma salida lógica. No significa que los tiempos coincidan automáticamente con un restaurante real; eso necesita calibración con observaciones del negocio.
