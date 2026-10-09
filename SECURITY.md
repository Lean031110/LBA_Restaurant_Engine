# Política de seguridad

## Secretos y credenciales

- **Nunca** se suben tokens, contraseñas, claves API ni archivos `.env` al repositorio, a los logs ni a los artefactos de CI.
- El token de GitHub del entorno de desarrollo vive únicamente en el _credential store_ local del equipo del desarrollador (`~/.git-credentials`, permisos `600`), jamás en el código.
- El `.gitignore` excluye `.env*`, `*.pem`, `*.key`, `secrets/`, `credentials/`.

## Datos de usuario

- La aplicación se ejecuta **100 % en local**: escenarios, logs e historiales no se envían a ningún servidor.
- Los logs de diagnóstico se sanitizan (ver logger de la app) y son exportables/borrables por el usuario.
- No hay telemetría remota por defecto.

## Ejecución

- La simulación no ejecuta código de terceros en runtime ni descarga recursos dinámicos de Internet.
- Los escenarios importados (JSON) se validan contra esquemas versionados antes de cargarse; un archivo inválido produce un error comprensible con ruta de campo, sin romper la aplicación.

## Reporte de vulnerabilidades

Abre un issue privado de seguridad (Security Advisories) o contacta al propietario del repositorio. No publiques explícitamente la explotación de una vulnerabilidad.

## Alcance de las garantías

Este software se ofrece tal cual (licencia MIT). La simulación **no certifica** inocuidad alimentaria, accesibilidad, seguridad física ni cumplimiento normativo; sus valores son estimaciones editables etiquetadas por procedencia.
