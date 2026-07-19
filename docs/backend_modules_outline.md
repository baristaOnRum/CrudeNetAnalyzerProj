# Diseño de Funciones del Back-End y Pruebas Unitarias

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
| 1. Gestionar Autenticación | ➖ Sin estado | `AuthService` | `AuthController` | `AuthFunctionalTest` |
| 2. Gestionar Análisis | ⏳ Por implementar | `AnalysisService` | `AnalysisController` | `AnalysisFunctionalTest` |
| 3. Administrar Configuraciones | ➖ Sin estado | `ConfigurationService` | `ConfigurationController` | `ConfigurationFunctionalTest` |
| 4. Gestionar Reportes | ⏳ Por implementar | `ReportService` | `ReportController` | `ReportFunctionalTest` |
| 5. Administrar Paquetes | ➖ Sin estado | `PacketService` | `PacketController` | `PacketFunctionalTest` |
| 6. Gestionar Eventos | ⏳ Por implementar | `EventService` | `EventController` | `EventFunctionalTest` |
| 7. Gestionar Usuarios | ⏳ Por implementar | `UserService` | `UserController` | `UserFunctionalTest` |

---

## 1. Módulo: Gestionar Autenticación (`AuthService`)
Encargado de la seguridad, accesos y sesiones del sistema. La UI ahora consume `/api/auth/login`.

**Funciones del Back-End (Métodos):**
```java
public AuthToken login(Credentials credentials); // ✅ RF-3-1 Iniciar sesión
public void logout(String token);                // ✅ RF-3-2 Cerrar sesión
public AuthToken loginAsGuest();                 // ⏳ RF-3-3 Iniciar sesión de invitado
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
public AnalysisResult analyzePacketsOnInterface(String interfaceId);// ⏳ RF-1-2 Analizar paquetes en la interfaz de red
public NetworkInterface registerNetworkInterface(InterfaceDto dto); // ⏳ RF-1-3 Registrar Interfaz de Red
public List<Analysis> listAnalyses();                               // ⏳ RF-1-4 Listar análisis
public Analysis registerAnalysis(AnalysisDto data);                 // ⏳ RF-1-5 Registrar Análisis
public Analysis loadAnalysis(Long analysisId);                      // ⏳ RF-1-6 Cargar Análisis
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
public ConfigParameter modifyParameter(String key, String value); // ⏳ RF-5-1 Modificar Parámetro
public void manageDatabaseConnection(DbConnectionDto dbConfig);   // 🔍 RF-5-2 Administrar conexión de base de datos
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
public Report generateReport(ReportCriteria criteria); // ⏳ RF-2-1 Generar Reportes
public Statistics generateStatistics(DateRange range); // ⏳ RF-2-2 Generar Estadísticas
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
// ❌ RF-4-4 Exportar Paquete (Descartado)
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
public Event registerEvent(EventDto eventData);             // ➖ RF-6-1 Registrar Evento
public List<Event> listEvents(EventFilter filter);          // ➖ RF-6-2 Listar Eventos
public Event getEventDetails(Long eventId);                 // ⏳ RF-6-3 Ver Detalle del Evento
public byte[] exportEvent(Long eventId, ExportFormat fmt);  // ➖ RF-6-4 Exportar Evento
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
public List<User> listUsers();                              // ⏳ ✅ RF-7-1 Listar usuarios
public User registerUser(UserRegistrationDto userData);     // ⏳ ✅ RF-7-2 Registrar usuario
public void deleteUser(Long userId);                        // ⏳ ✅ RF-7-3 Eliminar usuario
public User getUserDetails(Long userId);                    // ⏳ RF-7-4 Ver detalles del usuario
public User modifyUser(Long userId, UserUpdateDto newData); // ⏳ RF-7-6 Modificar usuario
```

**Estructura de Pruebas Unitarias (`UserServiceTest`):**
* `testRegisterUser_EmailAlreadyExists()`: Verifica que no se permitan usuarios duplicados.
* `testDeleteUser_Success()`: Verifica que el usuario sea inactivado o borrado.
* `testModifyUser_UpdatesFields()`: Verifica que el perfil se actualice correctamente.
