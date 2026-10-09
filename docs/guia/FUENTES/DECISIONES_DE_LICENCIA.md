# Decisiones de licencia y atribución

## Licencia recomendada para código propio

MIT, con un copyright inicial del proyecto, por ejemplo:

`Copyright (c) 2026 Leandro (@lean0311g)`

El archivo `LICENSE` debe copiar el texto oficial completo de MIT y completar correctamente titular/año. No afirmar que el código queda bajo “MIT modificada”: eso no sería la licencia estándar.

## Qué significa para quien reutilice el proyecto

MIT permite usar, modificar, copiar, distribuir y adaptar el proyecto, incluso como base para otros programas, siempre que se respeten las condiciones, entre ellas conservar el aviso de copyright y el texto de licencia en las copias o porciones sustanciales. El README puede solicitar el crédito visible “Basado en LBA_Restaurant_Engine por @lean0311g” y un enlace al origen.

**Límite importante:** MIT no garantiza una obligación universal de mostrar ese crédito en la interfaz, anuncio o README de cada derivado. Si el crédito visible obligatorio es una condición jurídica indispensable, se necesita evaluar otra licencia, no inventar una cláusula y seguir llamándola MIT. La guía prioriza licencia estándar, fácil de reutilizar y sin cláusulas comerciales raras.

## Dependencias y artefactos

- Las licencias de terceros siguen siendo las de terceros. No cambiar el texto de sus licencias.
- MIT no elimina obligaciones de Apache-2.0, ISC, BSD, zlib o licencias de fuentes/modelos.
- Para activos CC BY, conservar atribución, título, fuente, autor, licencia y cambios. Para CC0, se puede atribuir por cortesía, pero registrar la procedencia de todos modos.
- No incrustar contenido de un paquete sin inspeccionar el archivo de licencia incluido.
- `THIRD_PARTY_NOTICES.md` se genera y revisa en CI; no puede consistir en una lista inventada a mano que omita dependencias transitivas.
