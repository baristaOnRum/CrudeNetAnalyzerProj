# Diseño de Funciones del Back-End y Pruebas Unitarias

Basado en el documento de requerimientos funcionales (`requerimientos.pdf`), a continuación se presenta el bosquejo de las funciones del back-end. Dado que el proyecto está configurado con Spring Boot y Java, las funciones se han estructurado como **Servicios (Services)** que agrupan las responsabilidades de cada módulo. 

Para facilitar su integración directa con las pruebas unitarias (por ejemplo, usando JUnit 5 y Mockito), cada módulo define los métodos principales de negocio y una propuesta de los casos de prueba unitarios que deben implementarse para validar los requerimientos.

---

## 1. Módulo: Gestionar Autenticación (`AuthService`) - [IMPLEMENTADO]
Encargado de la seguridad, accesos y sesiones del sistema. La UI ahora consume `/api/auth/login`.

**Funciones del Back-End (Métodos):**
```java
public AuthToken login(Credentials credentials); // RF-3-1 Iniciar sesión
public void logout(String token);              // RF-3-2 Cerrar sesión
public AuthToken loginAsGuest();               // RF-3-3 Iniciar sesión de invitado
```

**Estructura de Pruebas Unitarias (`AuthServiceTest`):**
* `testLogin_Success()`: Verifica que credenciales válidas retornen un token.
* `testLogin_InvalidCredentials()`: Verifica que credenciales inválidas lancen una excepción.
* `testLogout_Success()`: Verifica que el token sea invalidado correctamente.
* `testLoginAsGuest_Success()`: Verifica que se asigne un rol de invitado con permisos limitados.

---

## 2. Módulo: Gestionar Análisis (`AnalysisService` / `NetworkMonitorService`) - [PENDIENTE]
Encargado de la captura, monitorización y análisis del tráfico de red. Falta implementar la lógica de las opciones "Iniciar Monitoreo (Pasivo)" e "Iniciar Análisis (Activo)", así como rellenar las métricas de tráfico y la distribución de protocolos en la UI. Adicionalmente, falta implementar un endpoint real para ejecutar el Ping Indeterminado o la Traza de Ruta.

**Funciones del Back-End (Métodos):**
```java
public void monitorPacketBehavior();                                // RF-1-1 Monitorear el comportamiento
public AnalysisResult analyzePacketsOnInterface(String interfaceId);// RF-1-2 Analizar paquetes en la interfaz
public NetworkInterface registerNetworkInterface(InterfaceDto dto); // RF-1-3 Registrar Interfaz de Red
public List<Analysis> listAnalyses();                               // RF-1-4 Listar análisis
public Analysis registerAnalysis(AnalysisDto data);                 // RF-1-5 Registrar Análisis
public Analysis loadAnalysis(Long analysisId);                      // RF-1-6 Cargar Análisis
```

**Estructura de Pruebas Unitarias (`AnalysisServiceTest`):**
* `testAnalyzePacketsOnInterface_Success()`: Verifica el correcto análisis de un flujo de paquetes mockeado.
* `testRegisterNetworkInterface_ValidData()`: Verifica que la interfaz de red se guarde en base de datos.
* `testListAnalyses_ReturnsList()`: Verifica que devuelva el histórico de análisis.
* `testLoadAnalysis_NotFound()`: Verifica que lance una excepción si el ID no existe.

---

## 3. Módulo: Administrar Configuraciones (`ConfigurationService`) - [PENDIENTE]
Encargado de los parámetros y conexiones del sistema. Falta integración final con un módulo UI para editar las variables en tiempo real.

**Funciones del Back-End (Métodos):**
```java
public ConfigParameter modifyParameter(String key, String value); // RF-5-1 Modificar Parámetro
public void manageDatabaseConnection(DbConnectionDto dbConfig);   // RF-5-2 Administrar conexión de BD
```

**Estructura de Pruebas Unitarias (`ConfigurationServiceTest`):**
* `testModifyParameter_Success()`: Verifica que el valor del parámetro se actualice en la base de datos.
* `testModifyParameter_KeyNotFound()`: Verifica el manejo de errores al modificar un parámetro inexistente.
* `testManageDatabaseConnection_ValidConfig()`: Verifica la validación y guardado de los datos de conexión.

---

## 4. Módulo: Gestionar Reportes (`ReportService`) - [PENDIENTE]
Encargado de generar información y resúmenes para el usuario final. La consola de reportes en React aún necesita integrarse con estos endpoints de agregación y generación.

**Funciones del Back-End (Métodos):**
```java
public Report generateReport(ReportCriteria criteria); // RF-2-1 Generar Reportes
public Statistics generateStatistics(DateRange range); // RF-2-2 Generar Estadísticas
```

**Estructura de Pruebas Unitarias (`ReportServiceTest`):**
* `testGenerateReport_WithValidCriteria()`: Verifica que el reporte contenga los datos correctos filtrados.
* `testGenerateStatistics_CalculatesCorrectly()`: Valida que las agregaciones matemáticas de los paquetes sean exactas.

---

## 5. Módulo: Gestionar Paquetes (`PacketService`) - [IMPLEMENTADO]
Encargado del manejo y almacenamiento de los paquetes capturados individualmente. Se cuenta con el CRUD completo y visualización en vivo vía `/api/packets`.

**Funciones del Back-End (Métodos):**
```java
public Packet registerPacket(PacketDto packetData);          // RF-4-1 Registrar Paquete
public List<Packet> listPackets(PacketFilter filter);        // RF-4-2 Listar Paquetes
public Packet getPacketDetails(Long packetId);               // RF-4-3 Ver Detalle de Paquete
public byte[] exportPacket(Long packetId, ExportFormat fmt); // RF-4-4 Exportar Paquete
```

**Estructura de Pruebas Unitarias (`PacketServiceTest`):**
* `testRegisterPacket_Success()`: Verifica la persistencia de un paquete de red.
* `testListPackets_WithFilters()`: Verifica que retorne solo los paquetes que cumplan con el filtro.
* `testGetPacketDetails_Success()`: Verifica que se retornen todos los metadatos del paquete.
* `testExportPacket_AsPcap()`: Verifica que la exportación devuelva los bytes correctos en formato PCAP u otro esperado.

---

## 6. Módulo: Gestionar Usuarios (`UserService`) - [IMPLEMENTADO]
Manejo del CRUD de las cuentas de usuario y administradores. Funcional a través de `/api/users`. Se ha creado un inyector (DataInitializer) para el usuario 'admin'.

**Funciones del Back-End (Métodos):**
```java
public List<User> listUsers();                              // RF-7-1 Listar usuarios
public User registerUser(UserRegistrationDto userData);     // RF-7-2 Registrar usuario
public void deleteUser(Long userId);                        // RF-7-3 Eliminar usuario
public User getUserDetails(Long userId);                    // RF-7-4 Ver detalles del usuario
public User modifyUser(Long userId, UserUpdateDto newData); // RF-7-6 Modificar usuario
```

**Estructura de Pruebas Unitarias (`UserServiceTest`):**
* `testRegisterUser_EmailAlreadyExists()`: Verifica que no se permitan usuarios duplicados.
* `testDeleteUser_Success()`: Verifica que el usuario sea inactivado o borrado.
* `testModifyUser_UpdatesFields()`: Verifica que el perfil se actualice correctamente.

---

## 7. Módulo: Gestionar Eventos (`EventService`) - [IMPLEMENTADO]
Auditoría y control de sucesos ocurridos dentro del sistema (logs/eventos). La pestaña de explorador de registros consume el backend a través de `/api/events`.

**Funciones del Back-End (Métodos):**
```java
public Event registerEvent(EventDto eventData);             // RF-6-1 Registrar Evento
public List<Event> listEvents(EventFilter filter);          // RF-6-2 Listar Eventos
public Event getEventDetails(Long eventId);                 // RF-6-3 Ver Detalle del Evento
public byte[] exportEvent(Long eventId, ExportFormat fmt);  // RF-6-4 Exportar Evento
```

**Estructura de Pruebas Unitarias (`EventServiceTest`):**
* `testRegisterEvent_Success()`: Verifica que la auditoría guarde la acción del usuario.
* `testListEvents_Pagination()`: Verifica que los eventos retornen correctamente paginados.
* `testExportEvent_AsCsv()`: Verifica que la exportación a CSV sea formateada correctamente.
