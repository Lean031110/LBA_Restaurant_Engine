# Cierre de fase XX — Título

- Estado: `APROBADA / INCOMPLETA / BLOQUEADA`
- Fecha UTC:
- Rama y PR:
- Commit SHA exacto:
- Workflow de GitHub Actions:
- Artefacto(s) de evidencia:
- Archivo de fase y revisión:

## Cambios realizados

| Archivo/módulo | Cambio | Requisito relacionado |
|---|---|---|

## Tests ejecutados

| Comando/workflow | Resultado real | Conteo/detalle | Evidencia |
|---|---|---|---|

## Criterios de salida

| ID | Criterio | Estado (`PASS/FAIL/NO VERIFICADO/NO EJECUTADO`) | Evidencia concreta |
|---|---|---|---|

## Capturas/logs/reportes

Enlaces exactos, nombres de artefactos y descripción de lo que se comprobó. No usar “todo bien” sin enlace o salida.

## Licencias, assets y supply chain

Dependencias nuevas, versión, licencia, notices añadidos, análisis de licencia y seguridad. Confirmar ausencia de secretos en artefactos.

## Bugs y limitaciones pendientes

Cada problema debe tener reproducción, impacto, módulo y próxima acción. No ocultar defectos conocidos para poder aprobar.

## Riesgos/diferencias

- Requisitos parcialmente implementados:
- Pruebas que no pudieron ejecutarse:
- Supuestos de simulación no medidos:
- Cambios de alcance con ADR:

## Verificación previa al merge (política de integración)

Conforme a la autorización expresa del propietario (2026-10-09), el merge (squash) de un PR solo se ejecuta si TODO lo siguiente está verificado:

- [ ] Checks obligatorios en verde sobre el SHA final exacto (sin ejecuciones canceladas, checks omitidos ni fallos ignorados).
- [ ] Conflictos de integración resueltos preservando los cambios válidos de ambas partes; GitHub informa el PR como fusionable.
- [ ] La integración no pierde cambios válidos de `main`.
- [ ] Pruebas y auditorías (licencias, seguridad) ejecutadas y en verde; sin aserciones debilitadas para conseguir resultados verdes.
- [ ] Evidencias y artefactos publicados e inspeccionados.
- [ ] Sin problemas de seguridad pendientes que invaliden la entrega.

Si alguna condición falla: no fusionar; corregir, volver a ejecutar las verificaciones y dejar registro en este informe.

## Decisión

- [ ] Se puede avanzar a la fase siguiente.
- [ ] No se avanza; corregir los puntos señalados.

Justificación basada en cada criterio de salida y sus evidencias:
