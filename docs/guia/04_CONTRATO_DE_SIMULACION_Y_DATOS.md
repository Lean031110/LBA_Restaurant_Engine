# Contrato del motor y modelo de datos

Este documento define las reglas que toda implementación deberá preservar.

## 1. Tiempo y eventos

El motor será de **eventos discretos**. Mantendrá `simulationTimeSeconds` y una cola de eventos ordenada por `(time, priority, sequence)`. El orden del mismo instante tiene que ser determinista. Procesar un evento puede generar otros eventos futuros. La UI puede ejecutar todos los eventos hasta una hora, ejecutar uno, avanzar a velocidad 1x/10x, pausar o reiniciar sin alterar las reglas matemáticas.

No usar `setInterval`, animación CSS o reloj del navegador como reloj verdadero del dominio. Las animaciones solo interpolan entre estados ya calculados.

Invariantes:
- el tiempo jamás retrocede;
- los eventos se ejecutan en orden definido y estable;
- una misma semilla + escenario + configuración debe producir la misma salida lógica;
- recurso con capacidad 1 no puede estar asignado a dos tareas incompatibles al mismo tiempo;
- una tarea no empieza antes de que se cumplan sus precondiciones/dependencias;
- una tarea fallida, cancelada o interrumpida libera recursos correctamente;
- reset devuelve el escenario al estado inicial y elimina tareas/locks del run anterior;
- un bloqueo o condición imposible se refleja en el registro y no se arregla silenciosamente.

## 2. Entidades principales

- `Scenario`: versión del esquema, geometría, catálogo, personas, roles, pedidos, flujos, parámetros y semilla.
- `WorldObject`: pared, puerta, ventana, mueble, mesa, equipo, zona, pasillo, estación, salida u objeto de inventario físico.
- `Zone`: límites, categoría, permisos, capacidad, estación/función y reglas de acceso.
- `Agent`: id, nombre visible, rol, habilidades, posición, orientación, velocidad, zona asignada, tareas, política, estado y traza actual.
- `TaskTemplate`: nombre, precondiciones, pasos, dependencias, recursos requeridos, duración, efectos, prioridad, condición de interrupción y alternativa ante bloqueo.
- `TaskInstance`: plantilla + pedido/persona/recurso afectado + estados `blocked/ready/queued/running/completed/failed/cancelled` + tiempos.
- `Order`: items, notas, prioridad, tiempos de creación/promesa/entrega y estados configurables.
- `Recipe`: componentes, cantidades, pasos, paralelismo, recursos, temperatura/tiempos estimados y condición final.
- `Equipment`: capacidad, estado `off/starting/heating/ready/in-use/cooling/fault/cleaning`, tiempos, temperatura opcional y reglas de uso.
- `InventoryItem`: unidad, stock, reserva, consumo, reposición y ubicación física.
- `SimulationEvent`: timestamp simulado, secuencia, eventCode, actor/target, cambios y ruleId.
- `ParameterRecord`: valor, unidad, fuente, confianza, supuestos y override por escenario.

IDs estables no basados en la posición del array. Validar tipos y rangos al importar. `schemaVersion` permite migrar escenarios antiguos de forma explícita.

## 3. Modelo de objetos predefinidos

Objetos iniciales: pared, puerta abatible/corredera, ventana, mesa con capacidad, silla, banco/booth, mostrador, estantería, encimera, zona cocina/salón/bar/VIP/pizzería/fregado/almacén/baño/salida, plancha, cocina, freidora, horno, horno de pizza, nevera, congelador, batidora, fregadero, lavavajillas, impresora de tickets, caja/POS, bandeja de entrega, tabla de cortar, cubetas de ingredientes, carrito de limpieza, contenedores, pila de platos limpios/sucios, estación de lavado de manos y punto de recogida.

Cada objeto comparte id, tipo, posición, rotación, dimensiones, huella/colisión, punto de interacción, zona, etiquetas, capa, material/color predefinido y propiedades editables. Las propiedades avanzadas van plegadas por defecto.

## 4. Flujos por rol

Los flujos son grafos de tareas con condiciones y dependencias. Ejemplo conceptual de hamburguesa:
1. recibir ticket y reconocer variante;
2. validar receta, modificadores y tiempos prometidos;
3. comprobar existencias de carne, pan, queso, ingredientes, utensilios y plato/embalaje;
4. si la plancha está apagada, encenderla y programar evento de disponibilidad;
5. preparar tareas independientes mientras la plancha se calienta, si el agente y las zonas permiten hacerlo;
6. reservar una posición/capacidad de plancha y comenzar la carne solo al cumplir la condición de listo;
7. calentar/tostar pan según receta y disponibilidad;
8. montar componentes, validar variantes dobles/queso extra, presentar el pedido y notificar entrega;
9. liberar estación, actualizar inventario y cerrar tareas;
10. si no hay pedidos útiles, elegir una tarea secundaria permitida: revisar preparación, reponer, lavar, limpiar o ayudar otra estación.

Los pasos concretos deben poder editarse y reordenarse, incluyendo bifurcaciones como “si no hay carne preparada”, “si el equipo no está listo”, “si faltan platos” o “si la impresora no tiene papel”. No codificar toda la receta en un `if` gigante.

## 5. Decisiones locales de agentes

Cada ciclo de decisión observa el mundo; crea candidatas de acciones legales; comprueba rol, zona, dependencias, inventario, recursos y seguridad operacional; asigna puntuaciones/urgencias; elige una acción de manera determinista con desempate explícito; y registra `observationSummary`, `candidateActions`, `chosenAction`, `ruleId`, `reasonCode`, `blockedBy`, `nextExpectedAction` y consecuencia esperada. La UI puede mostrar una versión legible y compacta.

Prioridades orientativas y editables: emergencia/bloqueo peligroso; tareas en curso que deban finalizar; pedidos urgentes; trabajo de la estación/rol; tareas necesarias para desbloquear a otro; limpieza/reposición; ayuda de otra área; ocio/espera. Esto no debe quedar codificado como verdad universal: el usuario podrá editar prioridades y restricciones.

No usar un LLM remoto por persona o por tick. Las reglas programadas son rápidas, reproducibles, probables de testear y no requieren Internet. Cualquier recomendación generativa futura es solo auxiliar y el simulador verificará sus consecuencias.

## 6. Movimiento y geometría

El mundo usa unidades reales abstractas (m/cm) y proyección a píxeles solo en pantalla. Paredes y muebles generan obstáculos; puertas y pasos abren conexiones. La ruta inicial puede ser una cuadrícula/grafo. Agentes tienen radio, velocidad, destino e interacción de estación. La llegada a una tarea requiere estar dentro de una tolerancia del punto de interacción. Registrar distancias, intentos de ruta, colisiones, esperas y desvíos.

La capacidad del pasillo y las normas de despeje son parámetros del escenario; no presentar el resultado como aprobación de accesibilidad o normativa de construcción.

## 7. Equipos y tiempos

El estado de encendido/calefacción de un equipo es una máquina de estados y un evento futuro. `warmupSeconds`, `powerOnSeconds`, `targetTemperatureC`, `heatRecoverySeconds`, `cycleSeconds`, `capacity`, `cleaningSeconds`, `cooldownSeconds` son parámetros separados. No sumar siempre tiempos que ocurren paralelos; el motor programa dependencias y comparte recursos correctamente.

Una receta separa calentamiento de equipo, cocción/proceso del alimento, montaje y emplatado. Cualquier curva térmica simple debe documentar supuestos y estar probada. Temperatura de superficie, ambiente y núcleo son variables distintas. Los valores no sustituyen mediciones físicas.

## 8. Reproducibilidad y métricas

Cada ejecución registra semilla, hash/versión del escenario, parámetros y versión del motor. Comparaciones A/B usan misma semilla y demanda cuando sea posible. Métricas mínimas: tiempo de pedido, espera total y por etapa, tiempo de trabajo/walking/waiting, utilización de estaciones/personas, longitud y p90 de cola, pedidos atrasados, distancias, rutas bloqueadas, rotación de mesas, falta de existencias y porcentaje de tareas replanificadas.

Nunca mostrar solo el promedio si una cola extrema importa: incluir percentiles y distribución cuando haya muestras suficientes. Mostrar qué supuestos impulsan la conclusión.
