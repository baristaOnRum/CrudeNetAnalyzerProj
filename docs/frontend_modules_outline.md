# Frontend Modules Outline - Mantenibilidad e Integración

Tras realizar una revisión de la funcionalidad del frontend (ubicado en `./frontend`) en contraste con los requerimientos definidos en `backend_modules_outline.md`, se han identificado las siguientes problemáticas de mantenibilidad e integración REST:

## 1. Módulo de Configuración (Desconexión de API)
- **Problema:** El componente `SettingsPanel.tsx` no realiza ninguna petición HTTP al backend.
- **Detalle:** La función para guardar la configuración de la base de datos es puramente estática (mock). Muestra un mensaje de éxito con `Swal.fire` pero nunca envía los datos de configuración actualizados (Host, Puerto, Nombre, Usuario, Contraseña) hacia el backend (se esperaba un llamado al servicio `ConfigurationService`).
- **Estado:** ✅ Resuelto. Se implementó un llamado HTTP POST a `/api/configurations/database`.

## 2. Módulo de Auditoría (Inconsistencia de Endpoints)
- **Problema:** Inconsistencia en la ruta de consumo del endpoint.
- **Detalle:** El componente `AuditExplorer.tsx` en el frontend está intentando consumir los datos de auditoría realizando una petición `GET` a `/api/audits`. Sin embargo, de acuerdo a la documentación y al diseño del Módulo 6 en el backend, el endpoint oficial provisto es `/api/events`. Esta discrepancia provocará errores 404 al visualizar la pestaña de auditoría.
- **Estado:** ✅ Resuelto. Se corrigió el consumo hacia `/api/events`.

## Observaciones Adicionales
- **Traza de Ruta (Módulo Análisis):** Se verificó en `NetworkAnalyzer.tsx` que la funcionalidad de Traza de Ruta realiza iteraciones mockeadas localmente (`hopsData`), pero registra apropiadamente cada salto enviando un POST a `/api/packets` de acuerdo a lo requerido.
- **Autenticación (Módulo 1):** Consumo verificado sobre `/api/auth/login`.
- **Usuarios (Módulo 7):** Consumo verificado sobre `/api/users`.
- **Análisis/Paquetes (Módulos 2 y 5):** Consumo verificado sobre `/api/packets` y `/api/diagnostics/ping`.
