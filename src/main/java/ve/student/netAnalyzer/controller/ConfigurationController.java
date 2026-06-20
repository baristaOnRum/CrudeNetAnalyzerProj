package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.dto.DbConnectionDto;
import ve.student.netAnalyzer.service.ConfigurationService;

@RestController
@RequestMapping("/api/config")
public class ConfigurationController {

    private final ConfigurationService configService;

    public ConfigurationController(ConfigurationService configService) {
        this.configService = configService;
    }

    @GetMapping("/db")
    public ResponseEntity<DbConnectionDto> getDbConfig() {
        return ResponseEntity.ok(configService.getCurrentDatabaseConnection());
    }

    @PostMapping("/db")
    public ResponseEntity<String> updateDbConfig(@RequestBody DbConnectionDto dbConfig) {
        configService.manageDatabaseConnection(dbConfig);
        return ResponseEntity.ok("{\"status\":\"success\", \"message\":\"Configuración guardada.\"}");
    }
}
