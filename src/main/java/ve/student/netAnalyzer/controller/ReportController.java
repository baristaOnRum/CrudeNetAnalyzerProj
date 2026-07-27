package ve.student.netAnalyzer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.dto.DateRange;
import ve.student.netAnalyzer.dto.Report;
import ve.student.netAnalyzer.dto.ReportCriteria;
import ve.student.netAnalyzer.dto.Statistics;
import ve.student.netAnalyzer.service.ReportService;
import ve.student.netAnalyzer.service.AuditService;
import ve.student.netAnalyzer.dto.AuditDto;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private AuditService auditService;

    @PostMapping("/generate")
    public ResponseEntity<Report> generateReport(@RequestBody ReportCriteria criteria) {
        Report report = reportService.generateReport(criteria);
        
        String humanReportType = "General de Análisis de Red";
        if (criteria != null && criteria.getReportType() != null) {
            String rt = criteria.getReportType().toUpperCase();
            if (rt.contains("PDF")) humanReportType = "Documento PDF";
            else if (rt.contains("CSV")) humanReportType = "Archivo de Datos CSV";
            else humanReportType = criteria.getReportType();
        }

        AuditDto audit = new AuditDto();
        audit.setNombreAuditoria("Generación e Impresión de Reporte");
        audit.setDetalleCambio("Se generó y emitió exitosamente un reporte técnico de diagnóstico en formato " + humanReportType + ".");
        audit.setFechaHora(LocalDateTime.now());
        auditService.registerAudit(audit);
        
        return ResponseEntity.ok(report);
    }

    @PostMapping("/statistics")
    public ResponseEntity<Statistics> generateStatistics(@RequestBody ReportCriteria criteria) {
        return ResponseEntity.ok(reportService.generateStatistics(criteria));
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<org.springframework.core.io.Resource> downloadReport(@PathVariable String filename) {
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get("reports").resolve(filename).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());
            if (resource.exists()) {
                return ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
