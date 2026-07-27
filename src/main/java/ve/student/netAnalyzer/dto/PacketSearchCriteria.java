package ve.student.netAnalyzer.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class PacketSearchCriteria {
    private String term;
    
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime startDate;
    
    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", shape = JsonFormat.Shape.STRING)
    private LocalDateTime endDate;
    private Integer minLength;
    private Integer maxLength;
    private Integer minResponseTime;
    private Integer maxResponseTime;
    private Integer analysisId;
    private String type;
    private Boolean resolveDns = true;

    public String getTerm() { return term; }
    public void setTerm(String term) { this.term = term; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public Integer getMinLength() { return minLength; }
    public void setMinLength(Integer minLength) { this.minLength = minLength; }

    public Integer getMaxLength() { return maxLength; }
    public void setMaxLength(Integer maxLength) { this.maxLength = maxLength; }

    public Integer getMinResponseTime() { return minResponseTime; }
    public void setMinResponseTime(Integer minResponseTime) { this.minResponseTime = minResponseTime; }

    public Integer getMaxResponseTime() { return maxResponseTime; }
    public void setMaxResponseTime(Integer maxResponseTime) { this.maxResponseTime = maxResponseTime; }

    public Integer getAnalysisId() { return analysisId; }
    public void setAnalysisId(Integer analysisId) { this.analysisId = analysisId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Boolean getResolveDns() { return resolveDns; }
    public void setResolveDns(Boolean resolveDns) { this.resolveDns = resolveDns; }
}
