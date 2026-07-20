package ve.student.netAnalyzer.service.speedtest;

import ve.student.netAnalyzer.dto.ActiveAnalysisResult;
import ve.student.netAnalyzer.dto.ActiveAnalysisRequest;

/**
 * Interfaz estrategia para proveedores de prueba de velocidad.
 * Cada proveedor implementa su propio protocolo de descarga/subida.
 */
public interface SpeedTestProvider {

    /** Identificador único del proveedor (ej. "CLOUDFLARE", "FAST") */
    String getProviderId();

    /** Nombre amigable para la UI */
    String getDisplayName();

    /** Hostname o IP del servidor que se usará para filtrar en Tshark */
    String getTargetHost();

    /**
     * Ejecuta la prueba de velocidad y devuelve las métricas.
     * El método es síncrono; Tshark ya debe estar escuchando antes de llamarlo.
     */
    ActiveAnalysisResult runTest(ActiveAnalysisRequest request) throws Exception;
}
