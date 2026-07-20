package ve.student.netAnalyzer.dto;

/**
 * DTO para la solicitud de análisis activo con prueba de velocidad.
 * El proveedor determina el host/endpoint a usar.
 */
public class ActiveAnalysisRequest {

    /** Proveedor de la prueba: CLOUDFLARE, FAST, NPERF */
    private String provider;

    /** Tipo de prueba: DOWNLOAD o UPLOAD */
    private String testType;

    /** Tamaño en bytes del payload (ej. 10_000_000 = 10 MB) */
    private long sizeBytes;

    /** Nombre de la interfaz de captura ya seleccionada (viene del modal de interfaz) */
    private String interfaceName;

    /** ID de la sesión de análisis activa */
    private Long analysisId;

    public ActiveAnalysisRequest() {}

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getTestType() { return testType; }
    public void setTestType(String testType) { this.testType = testType; }

    public long getSizeBytes() { return sizeBytes; }
    public void setSizeBytes(long sizeBytes) { this.sizeBytes = sizeBytes; }

    public String getInterfaceName() { return interfaceName; }
    public void setInterfaceName(String interfaceName) { this.interfaceName = interfaceName; }

    public Long getAnalysisId() { return analysisId; }
    public void setAnalysisId(Long analysisId) { this.analysisId = analysisId; }
}
