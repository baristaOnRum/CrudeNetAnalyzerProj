package ve.student.netAnalyzer.dto;

public class Statistics {
    private long totalPackets;
    private double peakThroughput;
    private String primaryProtocol;

    public Statistics() {}

    public Statistics(long totalPackets, double peakThroughput, String primaryProtocol) {
        this.totalPackets = totalPackets;
        this.peakThroughput = peakThroughput;
        this.primaryProtocol = primaryProtocol;
    }

    public long getTotalPackets() { return totalPackets; }
    public void setTotalPackets(long totalPackets) { this.totalPackets = totalPackets; }
    public double getPeakThroughput() { return peakThroughput; }
    public void setPeakThroughput(double peakThroughput) { this.peakThroughput = peakThroughput; }
    public String getPrimaryProtocol() { return primaryProtocol; }
    public void setPrimaryProtocol(String primaryProtocol) { this.primaryProtocol = primaryProtocol; }
}
