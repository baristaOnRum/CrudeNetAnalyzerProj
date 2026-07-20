# Progreso de Módulos Back-End (netAnalyzer)

Este documento realiza un seguimiento del progreso real del desarrollo de backend en comparación con el diseño especificado en [backend_modules_outline.md](file:///c:/Users/Sebastian/Documents/netAnalyzer/docs/backend_modules_outline.md).

## Resumen de Progreso Real por Módulo

A continuación se detalla el estado real del backend para cada módulo, contrastando la existencia de la interfaz de servicio, su implementación, el controlador REST y los tests.

---

### 1. Módulo: Gestionar Autenticación (`AuthService` / `AuthController`)

*   **RF-3-1 Iniciar sesión**
    *   **Servicio:** `AuthService.login(Credentials)` -> Implementado en `AuthServiceImpl`. Obtiene el usuario del repositorio, valida credenciales y genera un token único persistente en el contexto de sesión.
    *   **REST Controller:** `POST /api/auth/login` -> Implementado en `AuthController`.
    *   **Pruebas:** `AuthServiceTest.testLogin_Success()`, `AuthServiceTest.testLogin_InvalidCredentials()` y `AuthFunctionalTest.testLogin_Success()`.
    *   **Estado:** ✅ Completado.
*   **RF-3-2 Cerrar sesión**
    *   **Servicio:** `AuthService.logout(String)` -> Implementado en `AuthServiceImpl`. Remueve el token de la lista de sesiones activas y limpia el usuario en `SessionManagerService`.
    *   **REST Controller:** `POST /api/auth/logout` -> Implementado en `AuthController`.
    *   **Pruebas:** `AuthServiceTest.testLogout_Success()`.
    *   **Estado:** ✅ Completado.
*   **RF-3-3 Iniciar sesión de invitado**
    *   **Servicio:** `AuthService.loginAsGuest()` -> Implementado en `AuthServiceImpl`. Crea y registra un token asignándole el rol `GUEST`.
    *   **REST Controller:** `POST /api/auth/guest` -> **Nuevo endpoint implementado** en `AuthController`.
    *   **Pruebas:** `AuthServiceTest.testLoginAsGuest_Success()`.
    *   **Estado:** ✅ Completado.

---

### 2. Módulo: Gestionar Análisis (`AnalysisService` / `AnalysisController`)

*   **RF-1-2 Analizar paquetes en la interfaz de red**
    *   **Servicio:** `AnalysisService.analyzePacketsOnInterface(String)` -> **Implementado con lógica real** en `AnalysisServiceImpl`. Invoca `PacketCaptureService.startCapture()` para iniciar la captura en la interfaz solicitada.
    *   **REST Controller:** `POST /api/analysis/interface/{interfaceId}/analyze` -> **Nuevo endpoint implementado** en `AnalysisController`.
    *   **Estado:** ✅ Completado.
*   **RF-1-3 Registrar Interfaz de Red**
    *   **Servicio:** `AnalysisService.registerNetworkInterface(InterfaceDto)` -> Implementado en `AnalysisServiceImpl` (retorna el ID recibido).
    *   **REST Controller:** `POST /api/analysis/interface` -> Implementado en `AnalysisController`.
    *   **Estado:** ✅ Completado (Mock).
*   **RF-1-4 Listar análisis**
    *   **Servicio:** `AnalysisService.listAnalyses()` -> **Ahora consulta la BD real** via `repository.findAll()` en `AnalysisServiceImpl`.
    *   **REST Controller:** `GET /api/analysis` -> Implementado en `AnalysisController`.
    *   **Estado:** ✅ Completado.
*   **RF-1-5 Registrar Análisis**
    *   **Servicio:** `AnalysisService.registerAnalysis(AnalysisDto)` -> Implementado en `AnalysisServiceImpl`. Crea un nuevo objeto `AnalisisRed`, le asigna la fecha y el usuario activo, y lo guarda en base de datos.
    *   **REST Controller:** `POST /api/analysis` -> Implementado en `AnalysisController`.
    *   **Estado:** ✅ Completado.
*   **RF-1-6 Cargar Análisis**
    *   **Servicio:** `AnalysisService.loadAnalysis(Long)` -> **Actualizado** en `AnalysisServiceImpl`. Ahora consulta la BD real con `repository.findById()` y lanza `RuntimeException` si no encuentra el registro.
    *   **REST Controller:** `GET /api/analysis/{id}` -> Implementado en `AnalysisController`.
    *   **Estado:** 🔄 Parcial (El controlador no captura la excepción `RuntimeException`, propagando un 500 en lugar de un 404 cuando el análisis no existe).

---

### 3. Módulo: Administrar Configuraciones (`ConfigurationService` / `ConfigurationController`)

*   **RF-5-1 Modificar Parámetro**
    *   **Servicio:** `ConfigurationService.modifyParameter(String, String)` -> Implementado en `ConfigurationServiceImpl` (guarda en `ConfigParameterRepository`).
    *   **REST Controller:** `PUT /api/config/{key}` -> Implementado en `ConfigurationController`.
    *   **Estado:** ✅ Completado.
*   **RF-5-2 Administrar conexión de base de datos**
    *   **Servicio:** `ConfigurationService.manageDatabaseConnection(DbConnectionDto)` -> Implementado en `ConfigurationServiceImpl`.
    *   **REST Controller:** `POST /api/config/db` -> Implementado en `ConfigurationController`.
    *   **Estado:** 🔄 Parcial (Inconsistencia de endpoint: la implementación usa `/api/config/db`, pero la especificación técnica requiere `/api/configurations/database`).

---

### 4. Módulo: Gestionar Reportes (`ReportService` / `ReportController`)

*   **RF-2-1 Generar Reportes**
    *   **Servicio:** `ReportService.generateReport(ReportCriteria)` -> Implementado únicamente como *stub/mock* en `ReportServiceImpl`. Requiere una implementación real que integre la lógica de recopilación de tráfico de red.
    *   **REST Controller:** `POST /api/reports/generate` -> Implementado en `ReportController`.
    *   **Estado:** ⏳ Por implementar (Solo estructura Mock).
    *   **Lineamientos de Implementación:**
        *   **Filtros de Reporte:** El servicio debe implementar filtros específicos de consulta que admitan:
            *   Rango de fechas (`startDate`, `endDate`).
            *   Identificador de la sesión de análisis (`analysisId`).
            *   Dirección IP de origen o destino (`ipAddress`).
            *   Protocolo utilizado (TCP, UDP, ICMP, etc.).
        *   **Consultas a Base de Datos:** Integrar consultas en `PacketRepository` y `AnalisisRedRepository` aplicando los filtros de forma condicional para armar el conjunto de datos del reporte.

*   **RF-2-2 Generar Estadísticas**
    *   **Servicio:** `ReportService.generateStatistics(DateRange)` -> Implementado únicamente como *stub/mock* en `ReportServiceImpl`.
    *   **REST Controller:** `POST /api/reports/statistics` -> Implementado en `ReportController`.
    *   **Estado:** ⏳ Por implementar (Solo estructura Mock).
    *   **Lineamientos de Implementación:**
        *   **Visualización de Datos:** El objeto `Statistics` retornado debe estructurarse de tal forma que facilite la construcción en el Frontend de los siguientes formatos gráficos:
            *   **Diagrama de Pareto:** Agrupación y ordenación descendente por volumen/frecuencia de paquetes por dirección IP o protocolo, con cálculo acumulativo.
            *   **Diagrama de Torta (Pie Chart):** Porcentaje de distribución de protocolos (ej. TCP vs UDP vs ICMP) detectados en el rango analizado.
        *   **Agregación Eficiente:** Realizar consultas con funciones de agregación (`COUNT`, `SUM`) directamente en el repositorio de paquetes para optimizar el rendimiento.

---

### 5. Módulo: Administrar Paquetes (`PacketService` / `PacketController`)

*   **RF-4-1 Registrar Paquete**
    *   **Servicio:** `PacketService.registerPacket(PacketDto)` -> Implementado en `PacketServiceImpl` (vincula el paquete con el análisis de red activo y lo guarda en `PacketRepository`).
    *   **REST Controller:** `POST /api/packets` -> Implementado en `PacketController`.
    *   **Estado:** ✅ Completado.
*   **RF-4-2 Listar Paquetes**
    *   **Servicio:** `PacketService.listPackets(PacketFilter)` -> Implementado en `PacketServiceImpl` (permite filtrar por tipo, origen y destino).
    *   **REST Controller:** `GET /api/packets` -> Implementado en `PacketController`.
    *   **Estado:** ✅ Completado.
*   **RF-4-3 Ver Detalle de Paquete**
    *   **Servicio:** `PacketService.getPacketDetails(Long)` -> Implementado en `PacketServiceImpl`.
    *   **REST Controller:** No expuesto (marcado como descartado en el outline original pero implementado a nivel de servicio).
    *   **Estado:** ➖ Descartado (Disponible en capa de Servicio).
*   **RF-4-4 Exportar Paquete**
    *   **Servicio:** `PacketService.exportPacket(Long, ExportFormat)` -> Implementado en `PacketServiceImpl`.
    *   **REST Controller:** No expuesto (marcado como descartado en el outline original pero implementado a nivel de servicio).
    *   **Estado:** ➖ Descartado (Disponible en capa de Servicio).

---

### 6. Módulo: Gestionar Eventos / Auditoría (`AuditService` / `AuditController`)

*   **Aclaratoria:** En el código el módulo fue renombrado a **Auditoría** (`AuditService`, `AuditController`, `Audit`, `AuditRepository`), corrigiendo el término "Eventos".
*   **RF-6-1 Registrar Evento / Auditoría**
    *   **Servicio:** `AuditService.registerAudit(AuditDto)` -> Implementado en `AuditServiceImpl`. Persiste los datos en `AuditRepository`.
    *   **REST Controller:** `POST /api/audits` -> Implementado en `AuditController`.
    *   **Estado:** ✅ Completado.
*   **RF-6-2 Listar Eventos / Auditorías**
    *   **Servicio:** `AuditService.listAudits(AuditFilter)` -> Implementado en `AuditServiceImpl` (permite filtrar por nombre del evento y usuario).
    *   **REST Controller:** `GET /api/audits` -> Implementado en `AuditController`.
    *   **Estado:** ✅ Completado.
*   **RF-6-3 Ver Detalle del Evento / Auditoría**
    *   **Servicio:** `AuditService.getAuditDetails(String)` -> Implementado en `AuditServiceImpl`.
    *   **REST Controller:** `GET /api/audits/{id}` -> **Nuevo endpoint implementado** en `AuditController`. Retorna 404 si no existe.
    *   **Estado:** ✅ Completado.
*   **RF-6-4 Exportar Evento / Auditoría**
    *   **Servicio:** `AuditService.exportAudit(String, ExportFormat)` -> Implementado en `AuditServiceImpl`.
    *   **REST Controller:** `GET /api/audits/{id}/export?format=CSV` -> **Nuevo endpoint implementado** en `AuditController`. Devuelve el archivo como attachment con `Content-Disposition` apropiado.
    *   **Estado:** ✅ Completado.

---

### 7. Módulo: Gestionar Usuarios (`UserService` / `UserController`)

*   **RF-7-1 Listar usuarios**
    *   **Servicio:** `UserService.listUsers()` -> Implementado en `UserServiceImpl`.
    *   **REST Controller:** `GET /api/users` -> Implementado en `UserController`.
    *   **Estado:** ✅ Completado.
*   **RF-7-2 Registrar usuario**
    *   **Servicio:** `UserService.registerUser(UserRegistrationDto)` -> **Actualizado** en `UserServiceImpl`. Ahora valida el rol usando `AppRole.valueOf()` en lugar de un String, lo que requiere que el campo `rol` en el JSON sea un valor válido del enum (`ADMIN`, `USER`, `GUEST`).
    *   **REST Controller:** `POST /api/users` -> Implementado en `UserController`.
    *   **Estado:** 🔄 Parcial (La prueba `testRegisterUser_Success()` puede seguir fallando si el payload de prueba usa un valor de rol inválido para el enum `AppRole`).
*   **RF-7-3 Eliminar usuario**
    *   **Servicio:** `UserService.deleteUser(Long)` -> Implementado en `UserServiceImpl`.
    *   **REST Controller:** `DELETE /api/users/{id}` -> Implementado en `UserController`.
    *   **Estado:** ✅ Completado.
*   **RF-7-4 Ver detalles del usuario**
    *   **Servicio:** `UserService.getUserDetails(Long)` -> Implementado en `UserServiceImpl`.
    *   **REST Controller:** `GET /api/users/{id}` -> **Nuevo endpoint implementado** en `UserController`. Retorna 404 si el usuario no existe.
    *   **Estado:** ✅ Completado.
*   **RF-7-6 Modificar usuario**
    *   **Servicio:** `UserService.modifyUser(Long, UserUpdateDto)` -> Implementado en `UserServiceImpl`.
    *   **REST Controller:** `PUT /api/users/{id}` -> Implementado en `UserController`.
    *   **Estado:** ✅ Completado.
