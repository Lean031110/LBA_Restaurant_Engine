# Cómo trabajar con ChatGPT para auditar cada respuesta de Codex

Este archivo es el protocolo para el ciclo de trabajo del usuario, Codex y ChatGPT.

## Ciclo obligatorio

1. En Codex, ejecutar un solo prompt numerado del archivo de la fase activa.
2. Pedirle que incluya en su respuesta el SHA del commit, rama o PR, enlace real del workflow de Actions, resultados, logs y artefactos.
3. No avanzar al prompt siguiente si faltan evidencias que el prompt actual exige.
4. Compartir aquí en ChatGPT: el informe de Codex, URL del commit/PR, URL de Actions y la salida o archivos relevantes. Si el artefacto no se puede compartir directamente, pega su contenido o capturas del resultado, sin credenciales.
5. La revisión contrastará la entrega con el prompt maestro, el archivo de fase y el criterio de aceptación. El informe de Codex es una afirmación que debe verificarse, no prueba en sí misma.
6. Si hay diferencias, se devuelve a Codex una lista numerada de correcciones, vinculada a requisitos y tests. Se mantiene la misma fase hasta quedar aprobada.

## Qué se puede verificar desde cada prueba

- **Commit/PR:** prueba qué código quedó guardado y qué archivos cambiaron; por sí solo no demuestra que funciona.
- **GitHub Actions verde:** demuestra solo los pasos ejecutados por ese workflow y ese SHA. Revisar si los pasos importantes no fueron omitidos o marcados `continue-on-error`.
- **Log:** ayuda a explicar qué ocurrió, pero no demuestra por sí solo que el comportamiento es correcto.
- **Test:** evidencia el caso que cubre; revisar las assertions, no solo el conteo de verde.
- **Captura/video:** demuestra el estado visual observado, no la lógica interna ni todos los casos.
- **Reporte de cobertura:** muestra código ejecutado; no demuestra que las assertions detecten errores.
- **Benchmark:** solo sirve con escenario, hardware/entorno, semilla, cantidad de entidades y versión registrados.

## Plantilla de mensaje

Usa `PLANTILLAS/MENSAJE_PARA_REVISION.md`. No pegues secretos, tokens de GitHub ni cookies. Si deseas una revisión más profunda, comparte el ZIP del artefacto de Actions o los ficheros de reportes/capturas.

## Regla de aprobación

Una fase solo queda aprobada cuando cada criterio obligatorio del archivo de fase está marcado como `PASS` con evidencia verificable. `NO EJECUTADO`, `NO VERIFICADO`, `FALLÓ` y “debería funcionar” no equivalen a aprobado. Las pruebas que requieran dispositivo físico o medición real se marcan explícitamente como no verificadas en hardware y se dejan como limitación.
