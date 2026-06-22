package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.model.Audit;
import ve.student.netAnalyzer.dto.AuditDto;
import ve.student.netAnalyzer.dto.AuditFilter;
import ve.student.netAnalyzer.service.AuditService;

import java.util.List;

@RestController
@RequestMapping("/api/audits")

public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public List<Audit> listAudits() {
        return auditService.listAudits(new AuditFilter());
    }

    @PostMapping
    public ResponseEntity<Audit> registerAudit(@RequestBody AuditDto dto) {
        return ResponseEntity.ok(auditService.registerAudit(dto));
    }
}
