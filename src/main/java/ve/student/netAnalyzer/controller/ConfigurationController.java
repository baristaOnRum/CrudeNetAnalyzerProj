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

    @PutMapping("/{key}")
    public ResponseEntity<ConfigParameter> modifyParameter(@PathVariable String key, @RequestBody String value) {
        try {
            ConfigParameter updated = configurationService.modifyParameter(key, value);
            
            AuditDto audit = new AuditDto();
            audit.setNombreAuditoria("Cambio de Parámetro");
            audit.setDetalleCambio("Se modificó el parámetro del sistema: " + key);
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
    public ResponseEntity<Void> manageDatabaseConnection(@RequestBody DbConnectionDto dbConfig) {
        configurationService.manageDatabaseConnection(dbConfig);
        
        AuditDto audit = new AuditDto();
        audit.setNombreAuditoria("Cambio de Configuración de Base de Datos");
        audit.setDetalleCambio("Se cambió el motor a " + dbConfig.getDbType() + " en host " + dbConfig.getHost());
        audit.setFechaHora(LocalDateTime.now());
        auditService.registerAudit(audit);
        
        return ResponseEntity.ok().build();
    }

    @PostMapping("/database/test")
    public ResponseEntity<Boolean> testDatabaseConnection(@RequestBody DbConnectionDto dbConfig) {
        boolean isValid = configurationService.testDatabaseConnection(dbConfig);
        if (isValid) {
            return ResponseEntity.ok(true);
        } else {
            return ResponseEntity.status(400).body(false);
        }
    }
}
