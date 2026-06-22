package ve.student.netAnalyzer.dto;

public class ReportCriteria {
    private String reportType;
    private String sessionId;
    private String filterOptions;
    private DateRange dateRange;

    public ReportCriteria() {}

    public ReportCriteria(String reportType, String sessionId, String filterOptions, DateRange dateRange) {
        this.reportType = reportType;
        this.sessionId = sessionId;
        this.filterOptions = filterOptions;
        this.dateRange = dateRange;
    }

    public String getReportType() { return reportType; }
    public void setReportType(String reportType) { this.reportType = reportType; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getFilterOptions() { return filterOptions; }
    public void setFilterOptions(String filterOptions) { this.filterOptions = filterOptions; }
    public DateRange getDateRange() { return dateRange; }
    public void setDateRange(DateRange dateRange) { this.dateRange = dateRange; }
}
