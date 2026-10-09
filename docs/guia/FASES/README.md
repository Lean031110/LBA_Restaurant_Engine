# Cómo ejecutar los prompts de fase

La secuencia oficial es FASE 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11. No se salta una fase por estar “casi terminada”.

En cada archivo:
- **Prompt A**: inspección/contrato o diseño detallado.
- **Prompt B**: implementación del incremento mínimo de la fase.
- **Prompt C**: pruebas, integración y corrección.
- **Prompt D**: auditoría, evidencia y decisión de salida.

Pega solo un prompt por interacción. Si la implementación resulta demasiado grande, el agente debe dividir el trabajo dentro del alcance y detenerse en un informe, no comprimir tres interacciones en una sola. Los prompts futuros describen el destino, pero no autorizan a implementarlos antes.
