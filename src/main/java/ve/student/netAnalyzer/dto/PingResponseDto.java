package ve.student.netAnalyzer.dto;

public class PingResponseDto {
    private boolean success;
    private String ip;
    private Integer latency;
    private Integer ttl;
    private String rawOutput;

    public PingResponseDto() {}

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public Integer getLatency() { return latency; }
    public void setLatency(Integer latency) { this.latency = latency; }
    public Integer getTtl() { return ttl; }
    public void setTtl(Integer ttl) { this.ttl = ttl; }
    public String getRawOutput() { return rawOutput; }
    public void setRawOutput(String rawOutput) { this.rawOutput = rawOutput; }
}
