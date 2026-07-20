package ve.student.netAnalyzer.dto;

import java.util.Map;

public class AnalysisSummary {
    private Long idAnalisis;
    private Long totalPackets;
    private Long totalBytes;
    private Long durationSeconds;
    private Map<String, Long> protocolDistribution;
    
    public AnalysisSummary() {}

    public Long getIdAnalisis() { return idAnalisis; }
    public void setIdAnalisis(Long idAnalisis) { this.idAnalisis = idAnalisis; }

    public Long getTotalPackets() { return totalPackets; }
    public void setTotalPackets(Long totalPackets) { this.totalPackets = totalPackets; }

    public Long getTotalBytes() { return totalBytes; }
    public void setTotalBytes(Long totalBytes) { this.totalBytes = totalBytes; }

    public Long getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Long durationSeconds) { this.durationSeconds = durationSeconds; }

    public Map<String, Long> getProtocolDistribution() { return protocolDistribution; }
    public void setProtocolDistribution(Map<String, Long> protocolDistribution) { this.protocolDistribution = protocolDistribution; }
}
