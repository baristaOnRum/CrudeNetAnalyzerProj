package ve.student.netAnalyzer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.dto.DbConnectionDto;
import ve.student.netAnalyzer.model.ConfigParameter;
import ve.student.netAnalyzer.service.ConfigurationService;
import ve.student.netAnalyzer.service.AuditService;
import ve.student.netAnalyzer.dto.AuditDto;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/configurations")
public class ConfigurationController {

    @Autowired
    private ConfigurationService configurationService;

    @Autowired
    private AuditService auditService;

    @GetMapping("/{key}")
    public ResponseEntity<ConfigParameter> getParameter(@PathVariable String key) {
        return ResponseEntity.ok(configurationService.getParameter(key));
    }

    @PutMapping("/{key}")
    public ResponseEntity<ConfigParameter> modifyParameter(@PathVariable String key, @RequestBody String value) {
        try {
            ConfigParameter updated = configurationService.modifyParameter(key, value);
            
            String humanKeyName;
            switch (key) {
                case "CRITICAL_LATENCY_MS": humanKeyName = "Umbral de Latencia Crítica (ms)"; break;
                case "CRITICAL_JITTER_MS": humanKeyName = "Umbral de Jitter Crítico (ms)"; break;
                case "CRITICAL_ERROR_RATE": humanKeyName = "Umbral de Tasa Crítica de Errores (%)"; break;
                case "MIN_SUSTAINED_DOWNLOAD_RATE_KBPS": humanKeyName = "Ancho de Banda Sostenido Mínimo (KB/s)"; break;
                case "MIN_PEAK_DOWNLOAD_RATE_KBPS": humanKeyName = "Tasa de Descarga Pico Mínima (KB/s)"; break;
                case "SCORE_EXCELLENT": humanKeyName = "Puntuación de Calidad - Nivel Excelente"; break;
                case "SCORE_GOOD": humanKeyName = "Puntuación de Calidad - Nivel Bueno"; break;
                case "SCORE_REGULAR": humanKeyName = "Puntuación de Calidad - Nivel Regular"; break;
                case "SCORE_DEFICIENT": humanKeyName = "Puntuación de Calidad - Nivel Deficiente"; break;
                case "DEFAULT_PING_TARGET": humanKeyName = "Servidor Objetivo por Defecto para Ping"; break;
                case "DEFAULT_TRACEROUTE_TARGET": humanKeyName = "Servidor Objetivo por Defecto para Traza de Ruta"; break;
                case "DEFAULT_AUTO_DNS_RESOLVE": humanKeyName = "Resolución Automática de Dominios DNS"; break;
                default: humanKeyName = key.replace("_", " ").toLowerCase(); break;
            }

            AuditDto audit = new AuditDto();
            audit.setNombreAuditoria("Modificación de Configuración del Sistema");
            audit.setDetalleCambio("Se actualizó el parámetro '" + humanKeyName + "' a su nuevo valor: " + value + ".");
            audit.setFechaHora(LocalDateTime.now());
            auditService.registerAudit(audit);
            
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/database")
    public ResponseEntity<DbConnectionDto> getDatabaseConnection() {
        return ResponseEntity.ok(configurationService.getCurrentDatabaseConnection());
    }

    @PostMapping("/database")
    public ResponseEntity<?> manageDatabaseConnection(@RequestBody DbConnectionDto dbConfig) {
        try {
            configurationService.manageDatabaseConnection(dbConfig);
            
            try {
                AuditDto audit = new AuditDto();
                audit.setNombreAuditoria("Actualización de Conexión a Base de Datos");
                audit.setDetalleCambio("Se configuró el motor de base de datos a " + (dbConfig.getDbType() != null ? dbConfig.getDbType().toUpperCase() : "PostgreSQL") + " en el servidor " + (dbConfig.getHost() != null ? dbConfig.getHost() : "local") + ".");
                audit.setFechaHora(LocalDateTime.now());
                auditService.registerAudit(audit);
            } catch (Exception e) {
                System.err.println("Could not register audit for DB change: " + e.getMessage());
            }
            
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error al guardar la configuración: " + e.getMessage());
        }
    }

    @PostMapping("/database/test")
    public ResponseEntity<Boolean> testDatabaseConnection(@RequestBody DbConnectionDto dbConfig) {
        System.out.println("TEST CONNECTION REQUEST RECEIVED:");
        System.out.println("dbType: " + dbConfig.getDbType());
        System.out.println("host: " + dbConfig.getHost());
        System.out.println("port: " + dbConfig.getPort());
        System.out.println("name: " + dbConfig.getName());
        System.out.println("username: " + dbConfig.getUsername());
        System.out.println("password: " + dbConfig.getPassword());
        
        boolean isValid = configurationService.testDatabaseConnection(dbConfig);
        if (isValid) {
            return ResponseEntity.ok(true);
        } else {
            return ResponseEntity.status(400).body(false);
        }
    }
}
