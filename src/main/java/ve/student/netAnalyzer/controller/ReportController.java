package ve.student.netAnalyzer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.dto.DateRange;
import ve.student.netAnalyzer.dto.Report;
import ve.student.netAnalyzer.dto.ReportCriteria;
import ve.student.netAnalyzer.dto.Statistics;
import ve.student.netAnalyzer.service.ReportService;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @PostMapping("/generate")
    public ResponseEntity<Report> generateReport(@RequestBody ReportCriteria criteria) {
        return ResponseEntity.ok(reportService.generateReport(criteria));
    }

    @PostMapping("/statistics")
    public ResponseEntity<Statistics> generateStatistics(@RequestBody DateRange range) {
        return ResponseEntity.ok(reportService.generateStatistics(range));
    }
}
