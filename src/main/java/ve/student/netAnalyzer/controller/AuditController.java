package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.model.Audit;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.AuditDto;
import ve.student.netAnalyzer.dto.AuditFilter;
import ve.student.netAnalyzer.service.AuditService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

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

    @GetMapping("/{id}")
    public ResponseEntity<Audit> getAuditDetails(@PathVariable String id) {
        Audit audit = auditService.getAuditDetails(id);
        if (audit == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(audit);
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportAudit(@PathVariable String id, @RequestParam(defaultValue = "CSV") String format) {
        try {
            ExportFormat fmt = ExportFormat.valueOf(format.toUpperCase());
            byte[] fileContent = auditService.exportAudit(id, fmt);
            
            if (fileContent.length == 0) {
                return ResponseEntity.notFound().build();
            }

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audit_" + id + "." + fmt.name().toLowerCase());
            headers.add(HttpHeaders.CONTENT_TYPE, "application/octet-stream");

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAudits(@RequestParam(defaultValue = "CSV") String format) {
        try {
            ExportFormat fmt = ExportFormat.valueOf(format.toUpperCase());
            List<Audit> audits = auditService.listAudits(new AuditFilter());
            
            StringBuilder sb = new StringBuilder();
            if (fmt == ExportFormat.CSV) {
                sb.append("idSesion,nombreAuditoria,detalleCambio,fechaHora,idUsuario\n");
                for (Audit audit : audits) {
                    sb.append(audit.getIdSesion() != null ? audit.getIdSesion() : "").append(",")
                      .append(audit.getNombreAuditoria() != null ? audit.getNombreAuditoria() : "").append(",")
                      .append(audit.getDetalleCambio() != null ? audit.getDetalleCambio().replace("\n", " ").replace(",", ";") : "").append(",")
                      .append(audit.getFechaHora() != null ? audit.getFechaHora() : "").append(",")
                      .append(audit.getUsuario() != null ? audit.getUsuario().getId() : "").append("\n");
                }
            } else if (fmt == ExportFormat.JSON) {
                sb.append("[\n");
                for (int i = 0; i < audits.size(); i++) {
                    Audit audit = audits.get(i);
                    sb.append("  {\n")
                      .append("    \"idSesion\": \"").append(audit.getIdSesion()).append("\",\n")
                      .append("    \"nombreAuditoria\": \"").append(audit.getNombreAuditoria()).append("\",\n")
                      .append("    \"detalleCambio\": \"").append(audit.getDetalleCambio() != null ? audit.getDetalleCambio().replace("\n", "\\n") : "").append("\",\n")
                      .append("    \"fechaHora\": \"").append(audit.getFechaHora()).append("\",\n")
                      .append("    \"idUsuario\": \"").append(audit.getUsuario() != null ? audit.getUsuario().getId() : "").append("\"\n")
                      .append("  }");
                    if (i < audits.size() - 1) sb.append(",");
                    sb.append("\n");
                }
                sb.append("]");
            }
            
            byte[] fileContent = sb.toString().getBytes();
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audits." + fmt.name().toLowerCase());
            headers.add(HttpHeaders.CONTENT_TYPE, "application/octet-stream");
            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
