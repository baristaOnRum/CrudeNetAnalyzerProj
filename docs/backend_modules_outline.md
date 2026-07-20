# Diseño de Funciones del Back-End y Pruebas Unitarias

> [!WARNING]
> ## PENDIENTES DE IMPLEMENTACIÓN Y REVISIÓN (BLOQUEANTES)
> **ATENCIÓN: Se debe dejar BIEN CLARO que los componentes mencionados a continuación se deben trabajar para satisfacer los siguientes puntos antes de poder proceder.**
> 
> ### 1. Gestionar Análisis
> - ~~Se tiene que realizar la implementación del backend de wireshark para habilitar pcap.~~ (Completado: PcapAnalyzerService implementado con pcap4j guardando paquetes en base de datos)
> - ~~En el frontend, las barras verticales que muestra el Resumen de Tipos de Paquetes no deben estar.~~ (Completado: Componentes UI retirados en React)
> 
> ### 2. Gestionar Reportes
> - ~~Las sesiones de análisis (que son el motivo de que exista un hash que se está adjudicando al módulo de auditoría) son las que en verdad deben regir su compilación. Esto debe hacerse automáticamente al iniciar monitoreo e iniciar análisis en Gestionar Análisis. Estas sesiones se deben guardar en Reportes, no en Auditoría.~~ (Completado: Sesiones se generan con el monitoreo en NetworkAnalyzer)
> - ~~Los Reqs. Funcionales de Reportes son "Generar Reportes" y "Generar estadísticas". Reportes no necesita "Ver Detalles". Necesita "Ver", y "Ver" necesita desplegar un menú modal con los datos de la tabla de paquetes que corresponden a una sesión de análisis.~~ (Completado: Modificado componente en frontend con fetch a api/packets)
> 
> ### 3. Administrar Paquetes
> - ~~Se debe poder exportar el registro de paquetes de la sesión en JSON y CSV. Actualmente sólo se exporta el JSON en un `.txt`. Tiene que poder exportarlo en ambos formatos.~~ (Completado: Creado endpoint en backend que procesa formato JSON y CSV, exportando archivos con contenido dinámico desde DB. Frontend consumiendo la API)
> 
> ### 4. Gestionar Auditoría
> - ~~"Registrar Evento" de Auditoría es un Req. Funcional del sistema, no orientado al usuario final. Hay que desactivar ese botón completamente y todo su código de frontend.~~ (Completado: Botón y modal de creación removidos)
> - ~~Backend: El export de auditoría debe poder generar archivo CSV con los eventos solicitados, pero ahora mismo sólo soporta TXT JSON de un solo evento o error HTTP 500 al usar un rango de fechas. Se requiere reparar el generador de reportes de auditoría en CSV.~~ (Completado: Endpoint `/api/audits/export` genera el CSV correcto y está disponible en frontend)
> 
> ### 5. Gestionar Usuarios
> - ~~No registra correctamente usuarios nuevos.~~ (Completado: Solucionado error HTTP 400 por enum role)
> - ~~El `@handle` no debe usarse en la UI, ya que se introdujo un bug debido a que ese campo no existe en base de datos. Sólo se debe mostrar y usar el nombre del usuario.~~ (Completado: Removido handle email falso de UI)
> 
> ### 6. Administrar Configuraciones
> - ~~El botón de Cerrar Sesión es innecesario. No es un Req. Funcional explícito o implícito el cerrar sesión, solo el login inicial para el despliegue del sistema y la validación en el Backend. Hay que remover el botón de Cerrar Sesión (logout).~~ (Completado: Botón de logout removido)
> [!NOTE]
> ## Estado de Pruebas Funcionales
> Todos los fallos reportados han sido corregidos en el código fuente:
> - `UserFunctionalTest > testRegisterUser_Success()`: Corregido con `@DirtiesContext` para aislar el estado de la BD H2 entre corridas.
> - `AnalysisFunctionalTest > testLoadAnalysis_NotFound()`: Corregido añadiendo `@ExceptionHandler` en `AnalysisController` para retornar `404`.
Basado en el documento de requerimientos funcionales (`requerimientos.pdf`), a continuación se presenta el bosquejo de las funciones del back-end. Dado que el proyecto está configurado con Spring Boot y Java, las funciones se han estructurado como **Servicios (Services)** que agrupan las responsabilidades de cada módulo. 

Para facilitar su integración directa con las pruebas funcionales, cada módulo define los métodos principales de negocio y una propuesta de los casos de prueba funcionales que deben implementarse para validar los requerimientos en correlación a las vistas del Frontend.

---

## Directrices de Arquitectura y Diseño
* **Estructura Modular:** El diseño funcional se segmenta en módulos especializados para separar capacidades operativas y de control, asegurando una implementación organizada y eficiente.


## Especificaciones Generales (Transversales)
* **Campos Obligatorios:** Todo campo de carácter obligatorio debe estar marcado visualmente con un asterisco rojo.
* **Validación de Datos:** El sistema requiere la adición e implementación de validadores de carga.
* **Configuración Adicional:** Se requiere explícitamente "Configurar los plugins".
---

## Estado General de Módulos (Metatabla de Seguimiento)

| Módulo | Estado | Servicio (Service) | Controlador REST | Clase de Pruebas (Functional) |
| :--- | :--- | :--- | :--- | :--- |
| 1. Gestionar Autenticación | ✅ Completado | `AuthService` | `AuthController` | `AuthFunctionalTest` |
| 2. Gestionar Análisis | 🔄 Parcial (RF-1-6 lanza 500, no 404) | `AnalysisService` | `AnalysisController` | `AnalysisFunctionalTest` |
| 3. Administrar Configuraciones | ✅ Completado | `ConfigurationService` | `ConfigurationController` | `ConfigurationFunctionalTest` |
| 4. Gestionar Reportes | ✅ Completado | `ReportService` | `ReportController` | `ReportFunctionalTest` |
| 5. Administrar Paquetes | ✅ Completado | `PacketService` | `PacketController` | `PacketFunctionalTest` |
| 6. Gestionar Auditoría (Eventos) | ✅ Completado | `AuditService` | `AuditController` | `AuditFunctionalTest` |
| 7. Gestionar Usuarios | 🔄 Parcial (Prueba de registro falla por enum AppRole) | `UserService` | `UserController` | `UserFunctionalTest` |

---

## 1. Módulo: Gestionar Autenticación (`AuthService`)
Encargado de la seguridad, accesos y sesiones del sistema. La UI ahora consume `/api/auth/login`.

**Funciones del Back-End (Métodos):**
```java
public AuthToken login(Credentials credentials); // ✅ RF-3-1 Iniciar sesión
public void logout(String token);                // ✅ RF-3-2 Cerrar sesión
public AuthToken loginAsGuest();                 // ✅ RF-3-3 Iniciar sesión de invitado
```

**Estructura de Pruebas Unitarias (`AuthServiceTest`):**
* `testLogin_Success()`: Verifica que credenciales válidas retornen un token.
* `testLogin_InvalidCredentials()`: Verifica que credenciales inválidas lancen una excepción.
* `testLogout_Success()`: Verifica que el token sea invalidado correctamente.
* `testLoginAsGuest_Success()`: Verifica que se asigne un rol de invitado con permisos limitados.

---

## 2. Módulo: Gestionar Análisis (`AnalysisService` / `NetworkMonitorService`)
Encargado de la captura, monitorización y análisis del tráfico de red. La herramienta "Traza de Ruta" se ha integrado de forma que registre los paquetes de salto ICMP mediante el endpoint `POST /api/packets`. Los tableros del panel principal han sido actualizados para filtrar dinámicamente las estadísticas en base a la sesión de análisis cargada (`activeAnalysisId`). Faltan ajustes en el Ping indeterminado.

**Funciones del Back-End (Métodos):**
```java
public AnalysisResult analyzePacketsOnInterface(String interfaceId);// ✅ RF-1-2 Analizar paquetes (Implementado backend wireshark pcap4j)
public NetworkInterface registerNetworkInterface(InterfaceDto dto); // ✅ RF-1-3 Registrar Interfaz de Red
public List<Analysis> listAnalyses();                               // ✅ RF-1-4 Listar análisis
public Analysis registerAnalysis(AnalysisDto data);                 // ✅ RF-1-5 Registrar Análisis
public Analysis loadAnalysis(Long analysisId);                      // ✅ RF-1-6 Cargar Análisis
```

**Estructura de Pruebas Unitarias (`AnalysisServiceTest`):**
* `testAnalyzePacketsOnInterface_Success()`: Verifica el correcto análisis de un flujo de paquetes mockeado.
* `testRegisterNetworkInterface_ValidData()`: Verifica que la interfaz de red se guarde en base de datos.
* `testListAnalyses_ReturnsList()`: Verifica que devuelva el histórico de análisis.
* `testLoadAnalysis_NotFound()`: Verifica que lance una excepción si el ID no existe.

---

## 3. Módulo: Administrar Configuraciones (`ConfigurationService`)
Encargado de los parámetros y conexiones del sistema. Se ha eliminado por completo la directriz de "Anulación de Acceso Seguro" y el servicio ahora se concentra única y exclusivamente en restaurar y modificar los parámetros del formulario de conexión a la Base de Datos (Host, Puerto, Nombre, Usuario y Contraseña).

**Funciones del Back-End (Métodos):**
```java
public ConfigParameter modifyParameter(String key, String value); // ✅ RF-5-1 Modificar Parámetro
public void manageDatabaseConnection(DbConnectionDto dbConfig);   // ✅ RF-5-2 Administrar conexión de base de datos (Requiere endpoint POST /api/configurations/database)
```

**Estructura de Pruebas Unitarias (`ConfigurationServiceTest`):**
* `testModifyParameter_Success()`: Verifica que el valor del parámetro se actualice en la base de datos.
* `testModifyParameter_KeyNotFound()`: Verifica el manejo de errores al modificar un parámetro inexistente.
* `testManageDatabaseConnection_ValidConfig()`: Verifica la validación y guardado de los datos de conexión.

---

## 4. Módulo: Gestionar Reportes (`ReportService`)
Encargado de generar información y resúmenes para el usuario final. La consola de reportes en React ahora consume dinámica y exitosamente el historial de sesiones (`AnalisisRed`) y permite descargar los resúmenes compilados.

> **Especificaciones de Módulo:**
> * **Filtros de Reportes:** Integrar capacidad de filtrar información utilizando parámetros específicos: rango de fecha, ID de sesión, dirección IP y protocolo.
> * **Visualización de Datos:** La generación de estadísticas exige la inclusión de formatos gráficos particulares: Diagrama de Pareto y Diagrama de torta.

**Funciones del Back-End (Métodos):**
```java
public Report generateReport(ReportCriteria criteria); // ✅ RF-2-1 Generar Reportes
public Statistics generateStatistics(DateRange range); // ✅ RF-2-2 Generar Estadísticas
// ✅ RF-2-3 Ver Reporte (Desplegar modal con paquetes implementado en ReportsConsole.tsx)
```

**Estructura de Pruebas Unitarias (`ReportServiceTest`):**
* `testGenerateReport_WithValidCriteria()`: Verifica que el reporte contenga los datos correctos filtrados.
* `testGenerateStatistics_CalculatesCorrectly()`: Valida que las agregaciones matemáticas de los paquetes sean exactas.

---

## 5. Módulo: Administrar Paquetes (`PacketService`)
Encargado del manejo y almacenamiento de los paquetes capturados individualmente. Se cuenta con el CRUD completo y visualización vía `/api/packets`. El frontend se complementó con un sistema de filtros consolidados (rango de fechas, selectores de protocolo y campos de búsqueda en el payload), los cuales operan estrictamente limitados a la sesión de análisis activa por defecto.

**Funciones del Back-End (Métodos):**
```java
public Packet registerPacket(PacketDto packetData);          // ✅ RF-4-1 Registrar Paquete
public List<Packet> listPackets(PacketFilter filter);        // ✅ RF-4-2 Listar Paquetes
// ❌ RF-4-3 Ver Detalle de Paquete (Descartado)
public byte[] exportPackets(ExportFormat format);            // ⏳ RF-4-4 Exportar Paquetes (Pendiente: Exportar JSON y CSV de la sesión, no solo txt)
```

**Estructura de Pruebas Unitarias (`PacketServiceTest`):**
* `testRegisterPacket_Success()`: Verifica la persistencia de un paquete de red.
* `testListPackets_WithFilters()`: Verifica que retorne solo los paquetes que cumplan con el filtro.
* `testGetPacketDetails_Success()`: Verifica que se retornen todos los metadatos del paquete.
* `testExportPacket_AsPcap()`: Verifica que la exportación devuelva los bytes correctos en formato PCAP u otro esperado.

---

## 6. Módulo: Gestionar Eventos / Auditoría (`EventService`)
Auditoría y control de sucesos ocurridos dentro del sistema (logs/trazas). La pestaña de explorador de auditorías consume el backend a través de `/api/events`.

> **Aclaratoria de Módulo:** Sobre los requerimientos de este módulo, existe una corrección manuscrita que vincula y corrige explícitamente el término "Eventos" con la palabra **"Auditoría"**.

**Funciones del Back-End (Métodos):**
```java
public Event registerEvent(EventDto eventData);             // ✅ RF-6-1 Registrar Evento (Servicio Interno Operativo. Pendiente: Solo ocultar botón/UI en frontend)
public List<Event> listEvents(EventFilter filter);          // ➖ RF-6-2 Listar Eventos
public Audit getAuditDetails(String auditId); // ✅ RF-4-2 Ver Detalles Auditoría
public byte[] exportAudit(String auditId, ExportFormat fmt); // ✅ RF-4-3 Exportar Auditoría (CSV y JSON implementados en servidor)
```

**Estructura de Pruebas Unitarias (`EventServiceTest`):**
* `testRegisterEvent_Success()`: Verifica que la auditoría guarde la acción del usuario.
* `testListEvents_Pagination()`: Verifica que los registros de auditoría retornen correctamente paginados.
* `testExportEvent_AsCsv()`: Verifica que la exportación a CSV sea formateada correctamente.

---

## 7. Módulo: Gestionar Usuarios (`UserService`)
Manejo del CRUD de las cuentas de usuario y administradores. Funcional a través de `/api/users`. Se ha creado un inyector (DataInitializer) para el usuario 'admin'.

**Funciones del Back-End (Métodos):**
```java
public List<User> listUsers();                              // ✅ ✅ RF-7-1 Listar usuarios
public User registerUser(UserRegistrationDto userData);     // ⏳ RF-7-2 Registrar usuario (Pendiente: Falla registro de nuevos usuarios)
public void deleteUser(Long userId);                        // ✅ ✅ RF-7-3 Eliminar usuario
public User getUserDetails(Long userId);                    // ✅ RF-7-4 Ver detalles del usuario
public User modifyUser(Long userId, UserUpdateDto newData); // ✅ RF-7-6 Modificar usuario
```

**Estructura de Pruebas Unitarias (`UserServiceTest`):**
* `testRegisterUser_EmailAlreadyExists()`: Verifica que no se permitan usuarios duplicados.
* `testDeleteUser_Success()`: Verifica que el usuario sea inactivado o borrado.
* `testModifyUser_UpdatesFields()`: Verifica que el perfil se actualice correctamente.
