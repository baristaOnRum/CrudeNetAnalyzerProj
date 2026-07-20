package ve.student.netAnalyzer.dto;

/**
 * DTO con los resultados de la prueba de velocidad activa.
 */
public class ActiveAnalysisResult {

    private String provider;
    private String testType;
    private long sizeBytes;
    private long durationMs;
    /** Velocidad en Mbps calculada: (sizeBytes * 8) / (durationMs / 1000.0) / 1_000_000 */
    private double speedMbps;
    private boolean success;
    private String errorMessage;
    private int httpStatus;

    public ActiveAnalysisResult() {}

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }

    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }

    public long getDurationMs() { return durationMs; }
    public void setDurationMs(long durationMs) { this.durationMs = durationMs; }

    public double getSpeedMbps() { return speedMbps; }
    public void setSpeedMbps(double speedMbps) { this.speedMbps = speedMbps; }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public int getHttpStatus() { return httpStatus; }
    public void setHttpStatus(int httpStatus) { this.httpStatus = httpStatus; }
}
