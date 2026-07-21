package ve.student.netAnalyzer.dto;

import java.time.LocalDateTime;

public class AnalysisSearchCriteria {
    private String term;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
}
