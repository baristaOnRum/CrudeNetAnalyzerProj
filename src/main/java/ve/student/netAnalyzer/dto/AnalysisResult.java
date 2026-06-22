package ve.student.netAnalyzer.dto;

public class AnalysisResult {
    private Long id;
    private String interfaceId;
    private String result;
    private int packetCount;

    public AnalysisResult() {}

    public AnalysisResult(Long id, String interfaceId, String result, int packetCount) {
        this.id = id;
        this.interfaceId = interfaceId;
        this.result = result;
        this.packetCount = packetCount;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getInterfaceId() { return interfaceId; }
    public void setInterfaceId(String interfaceId) { this.interfaceId = interfaceId; }
    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }
    public int getPacketCount() { return packetCount; }
    public void setPacketCount(int packetCount) { this.packetCount = packetCount; }
}
