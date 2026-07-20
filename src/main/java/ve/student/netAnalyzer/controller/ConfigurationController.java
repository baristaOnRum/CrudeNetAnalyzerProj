package ve.student.netAnalyzer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.dto.DbConnectionDto;
import ve.student.netAnalyzer.model.ConfigParameter;
import ve.student.netAnalyzer.service.ConfigurationService;

@RestController
@RequestMapping("/api/configurations")
public class ConfigurationController {

    @Autowired
    private ConfigurationService configurationService;

    @PutMapping("/{key}")
    public ResponseEntity<ConfigParameter> modifyParameter(@PathVariable String key, @RequestBody String value) {
        try {
            return ResponseEntity.ok(configurationService.modifyParameter(key, value));
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
        return ResponseEntity.ok().build();
    }
}
