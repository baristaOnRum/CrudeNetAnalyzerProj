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
    private final ve.student.netAnalyzer.repository.AuditRepository auditRepository;

    public AuditController(AuditService auditService, ve.student.netAnalyzer.repository.AuditRepository auditRepository) {
        this.auditService = auditService;
        this.auditRepository = auditRepository;
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
            if (fmt == ExportFormat.PDF) {
                headers.add(HttpHeaders.CONTENT_TYPE, "application/pdf");
            } else {
                headers.add(HttpHeaders.CONTENT_TYPE, "application/octet-stream");
            }

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    @PostMapping("/search")
    public ResponseEntity<org.springframework.data.domain.Page<Audit>> searchAudits(
            @RequestBody ve.student.netAnalyzer.dto.AuditSearchCriteria criteria,
            org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<Audit> spec = ve.student.netAnalyzer.specification.AuditSpecification.withCriteria(criteria);
        return ResponseEntity.ok(auditRepository.findAll(spec, pageable));
    }

    @GetMapping("/metadata")
    public ResponseEntity<java.util.Map<String, Object>> getMetadata() {
        // Find min and max dates
        List<Audit> all = auditRepository.findAll(org.springframework.data.domain.Sort.by("fechaHora"));
        java.util.Map<String, Object> meta = new java.util.HashMap<>();
        if (!all.isEmpty()) {
            meta.put("minDate", all.get(0).getFechaHora());
            meta.put("maxDate", all.get(all.size() - 1).getFechaHora());
        }
        return ResponseEntity.ok(meta);
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> exportFilteredAudits(
            @RequestParam(defaultValue = "CSV") String format,
            @RequestBody ve.student.netAnalyzer.dto.AuditSearchCriteria criteria) {
        try {
            ExportFormat fmt = ExportFormat.valueOf(format.toUpperCase());
            org.springframework.data.jpa.domain.Specification<Audit> spec = ve.student.netAnalyzer.specification.AuditSpecification.withCriteria(criteria);
            List<Audit> audits = auditRepository.findAll(spec);
            
            if (fmt == ExportFormat.PDF) {
                byte[] fileContent = ve.student.netAnalyzer.service.impl.AuditExporter.exportListToPdf(audits);
                HttpHeaders headers = new HttpHeaders();
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=audits.pdf");
                headers.add(HttpHeaders.CONTENT_TYPE, "application/pdf");
                return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
            }
            
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
