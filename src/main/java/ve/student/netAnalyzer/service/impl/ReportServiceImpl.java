package ve.student.netAnalyzer.service.impl;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.dto.DateRange;
import ve.student.netAnalyzer.dto.Report;
import ve.student.netAnalyzer.dto.ReportCriteria;
import ve.student.netAnalyzer.dto.Statistics;
import ve.student.netAnalyzer.service.ReportService;

@Service
public class ReportServiceImpl implements ReportService {

    @Override
    public Report generateReport(ReportCriteria criteria) {
        return new Report("REP-123", "Resumen de Red", "2026-06-20", "Contenido del reporte generado mockeado");
    }

    @Override
    public Statistics generateStatistics(DateRange range) {
        return new Statistics(1500L, 10.5, "TCP");
    }
}
