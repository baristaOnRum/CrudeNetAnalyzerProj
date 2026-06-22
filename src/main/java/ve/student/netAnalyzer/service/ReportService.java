package ve.student.netAnalyzer.service;

import ve.student.netAnalyzer.dto.DateRange;
import ve.student.netAnalyzer.dto.Report;
import ve.student.netAnalyzer.dto.ReportCriteria;
import ve.student.netAnalyzer.dto.Statistics;

public interface ReportService {
    Report generateReport(ReportCriteria criteria);
    Statistics generateStatistics(DateRange range);
}
