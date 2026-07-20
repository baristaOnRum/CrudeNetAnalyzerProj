package ve.student.netAnalyzer.dto;

public class TraceHopDto {
    private int hop;
    private String ip;
    private String hostname;
    private Integer latency; // null si timeout
    private boolean timeout;

    public TraceHopDto() {}

    public TraceHopDto(int hop, String ip, String hostname, Integer latency, boolean timeout) {
        this.hop = hop;
        this.ip = ip;
        this.hostname = hostname;
        this.latency = latency;
        this.timeout = timeout;
    }

    public int getHop() { return hop; }
    public void setHop(int hop) { this.hop = hop; }
    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
    public String getHostname() { return hostname; }
    public void setHostname(String hostname) { this.hostname = hostname; }
    public Integer getLatency() { return latency; }
    public void setLatency(Integer latency) { this.latency = latency; }
    public boolean isTimeout() { return timeout; }
    public void setTimeout(boolean timeout) { this.timeout = timeout; }
}
