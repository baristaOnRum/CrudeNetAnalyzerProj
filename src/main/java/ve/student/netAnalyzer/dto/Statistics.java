package ve.student.netAnalyzer.dto;

import java.util.Map;

public class Statistics {
    private long totalPackets;
    private double peakThroughput;
    private String primaryProtocol;
    private Map<String, Long> protocolDistribution;
    private Map<String, Long> topSourceIps;
    private Map<String, Long> topDestIps;
    private Map<String, Long> errorDistribution;
    
    // Nuevas estadísticas avanzadas
    private double averageJitter;
    private double downloadRate;
    private double packetRate;
    private double jitterP50;
    private double jitter90thPercentile;
    private double jitterP99;
    private double sizeP50;
    private double size90thPercentile;
    private double sizeP99;
    private double errorRate; // Tasa de errores

    // Métricas de Puntuación de Red y Latencia Percentil
    private double networkScore;
    private double latencyMin;
    private double latencyP25;
    private double latencyMean;
    private double latencyP50;
    private double latencyP75;
    private double latencyP90;
    private double latencyP99;
    private double latencyMax;

    public Statistics() {}

    public Statistics(long totalPackets, double peakThroughput, String primaryProtocol) {
        this.totalPackets = totalPackets;
        this.peakThroughput = peakThroughput;
        this.primaryProtocol = primaryProtocol;
    }
    
    public Statistics(long totalPackets, double peakThroughput, String primaryProtocol,
                      Map<String, Long> protocolDistribution, 
                      Map<String, Long> topSourceIps, 
                      Map<String, Long> topDestIps) {
        this.totalPackets = totalPackets;
        this.peakThroughput = peakThroughput;
        this.primaryProtocol = primaryProtocol;
        this.protocolDistribution = protocolDistribution;
        this.topSourceIps = topSourceIps;
        this.topDestIps = topDestIps;
    }

    public Statistics(long totalPackets, double peakThroughput, String primaryProtocol,
                      Map<String, Long> protocolDistribution,
                      Map<String, Long> topSourceIps,
                      Map<String, Long> topDestIps,
                      double averageJitter, double downloadRate, double packetRate,
                      double jitter90thPercentile, double size90thPercentile, double errorRate) {
        this.totalPackets = totalPackets;
        this.peakThroughput = peakThroughput;
        this.primaryProtocol = primaryProtocol;
        this.protocolDistribution = protocolDistribution;
        this.topSourceIps = topSourceIps;
        this.topDestIps = topDestIps;
        this.averageJitter = averageJitter;
        this.downloadRate = downloadRate;
        this.packetRate = packetRate;
        this.jitter90thPercentile = jitter90thPercentile;
        this.size90thPercentile = size90thPercentile;
        this.errorRate = errorRate;
    }

    public long getTotalPackets() { return totalPackets; }
    public void setTotalPackets(long totalPackets) { this.totalPackets = totalPackets; }
    
    public double getPeakThroughput() { return peakThroughput; }
    public void setPeakThroughput(double peakThroughput) { this.peakThroughput = peakThroughput; }
    
    public String getPrimaryProtocol() { return primaryProtocol; }
    public void setPrimaryProtocol(String primaryProtocol) { this.primaryProtocol = primaryProtocol; }
    
    public Map<String, Long> getProtocolDistribution() { return protocolDistribution; }
    public void setProtocolDistribution(Map<String, Long> protocolDistribution) { this.protocolDistribution = protocolDistribution; }
    
    public Map<String, Long> getTopSourceIps() { return topSourceIps; }
    public void setTopSourceIps(Map<String, Long> topSourceIps) { this.topSourceIps = topSourceIps; }
    
    public Map<String, Long> getTopDestIps() { return topDestIps; }
    public void setTopDestIps(Map<String, Long> topDestIps) { this.topDestIps = topDestIps; }

    public Map<String, Long> getErrorDistribution() { return errorDistribution; }
    public void setErrorDistribution(Map<String, Long> errorDistribution) { this.errorDistribution = errorDistribution; }

    public double getAverageJitter() { return averageJitter; }
    public void setAverageJitter(double averageJitter) { this.averageJitter = averageJitter; }

    public double getDownloadRate() { return downloadRate; }
    public void setDownloadRate(double downloadRate) { this.downloadRate = downloadRate; }

    public double getPacketRate() { return packetRate; }
    public void setPacketRate(double packetRate) { this.packetRate = packetRate; }

    public double getJitterP50() { return jitterP50; }
    public void setJitterP50(double jitterP50) { this.jitterP50 = jitterP50; }

    public double getJitter90thPercentile() { return jitter90thPercentile; }
    public void setJitter90thPercentile(double jitter90thPercentile) { this.jitter90thPercentile = jitter90thPercentile; }

    public double getJitterP99() { return jitterP99; }
    public void setJitterP99(double jitterP99) { this.jitterP99 = jitterP99; }

    public double getSizeP50() { return sizeP50; }
    public void setSizeP50(double sizeP50) { this.sizeP50 = sizeP50; }

    public double getSize90thPercentile() { return size90thPercentile; }
    public void setSize90thPercentile(double size90thPercentile) { this.size90thPercentile = size90thPercentile; }

    public double getSizeP99() { return sizeP99; }
    public void setSizeP99(double sizeP99) { this.sizeP99 = sizeP99; }

    public double getNetworkScore() { return networkScore; }
    public void setNetworkScore(double networkScore) { this.networkScore = networkScore; }

    public double getLatencyMin() { return latencyMin; }
    public void setLatencyMin(double latencyMin) { this.latencyMin = latencyMin; }

    public double getLatencyP25() { return latencyP25; }
    public void setLatencyP25(double latencyP25) { this.latencyP25 = latencyP25; }

    public double getLatencyMean() { return latencyMean; }
    public void setLatencyMean(double latencyMean) { this.latencyMean = latencyMean; }

    public double getLatencyP50() { return latencyP50; }
    public void setLatencyP50(double latencyP50) { this.latencyP50 = latencyP50; }

    public double getLatencyP75() { return latencyP75; }
    public void setLatencyP75(double latencyP75) { this.latencyP75 = latencyP75; }

    public double getLatencyP90() { return latencyP90; }
    public void setLatencyP90(double latencyP90) { this.latencyP90 = latencyP90; }

    public double getLatencyP99() { return latencyP99; }
    public void setLatencyP99(double latencyP99) { this.latencyP99 = latencyP99; }

    public double getLatencyMax() { return latencyMax; }
    public void setLatencyMax(double latencyMax) { this.latencyMax = latencyMax; }

    public double getErrorRate() { return errorRate; }
    public void setErrorRate(double errorRate) { this.errorRate = errorRate; }
}
