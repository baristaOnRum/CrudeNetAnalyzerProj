package ve.student.netAnalyzer.service.speedtest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.dto.ActiveAnalysisRequest;
import ve.student.netAnalyzer.dto.ActiveAnalysisResult;
import ve.student.netAnalyzer.service.capture.PacketCaptureService;

import java.net.InetAddress;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Servicio orquestador del análisis activo.
 * Flujo:
 *   1. Resuelve el host del proveedor a IP.
 *   2. Inicia Tshark con filtro BPF "host <ip>".
 *   3. Espera 500ms para asegurar que Tshark esté escuchando.
 *   4. Ejecuta la prueba HTTP a través del proveedor.
 *   5. Detiene Tshark.
 *   6. Devuelve métricas.
 */
@Service
public class ActiveAnalysisService {

    private static final Logger logger = LoggerFactory.getLogger(ActiveAnalysisService.class);

    private final PacketCaptureService packetCaptureService;
    private final ve.student.netAnalyzer.service.SessionManagerService sessionManagerService;
    private final Map<String, SpeedTestProvider> providers;
    private final ve.student.netAnalyzer.service.DiagnosticsService diagnosticsService;

    @Autowired
    public ActiveAnalysisService(PacketCaptureService packetCaptureService,
                                 ve.student.netAnalyzer.service.SessionManagerService sessionManagerService,
                                 ve.student.netAnalyzer.service.DiagnosticsService diagnosticsService,
                                 List<SpeedTestProvider> providerList) {
        this.packetCaptureService = packetCaptureService;
        this.sessionManagerService = sessionManagerService;
        this.diagnosticsService = diagnosticsService;
        this.providers = providerList.stream()
                .collect(Collectors.toMap(SpeedTestProvider::getProviderId, Function.identity()));
    }

    /**
     * Devuelve la lista de proveedores disponibles para el selector del frontend.
     */
    public List<Map<String, String>> getAvailableProviders() {
        return providers.values().stream()
                .map(p -> Map.of(
                        "id", p.getProviderId(),
                        "displayName", p.getDisplayName(),
                        "targetHost", p.getTargetHost()
                ))
                .collect(Collectors.toList());
    }

    /**
     * Ejecuta el análisis activo completo: captura + prueba de velocidad.
     */
    public ActiveAnalysisResult executeActiveAnalysis(ActiveAnalysisRequest request) throws Exception {
        SpeedTestProvider provider = providers.get(request.getProvider().toUpperCase());
        if (provider == null) {
            throw new IllegalArgumentException("Proveedor no soportado: " + request.getProvider());
        }

        // Fallback de interfaz si no viene en el request
        String interfaceName = request.getInterfaceName();
        if ((interfaceName == null || interfaceName.isBlank()) && sessionManagerService.getActiveInterface() != null) {
            interfaceName = sessionManagerService.getActiveInterface().getNombreInterfaz();
        }

        // Fallback de ID de análisis si no viene en el request
        Long analysisId = request.getAnalysisId();
        if (analysisId == null && sessionManagerService.getActiveAnalysis() != null) {
            analysisId = (long) sessionManagerService.getActiveAnalysis().getId();
        }

        // 1. Resolver TODAS las IPs del host objetivo (IPv4 e IPv6) para el filtro BPF completo
        String targetHost = provider.getTargetHost();
        StringBuilder bpfBuilder = new StringBuilder();
        try {
            InetAddress[] addrs = InetAddress.getAllByName(targetHost);
            for (InetAddress addr : addrs) {
                if (bpfBuilder.length() > 0) {
                    bpfBuilder.append(" or ");
                }
                bpfBuilder.append("host ").append(addr.getHostAddress());
            }
            logger.info("Filtro BPF generado para {}: {}", targetHost, bpfBuilder);
        } catch (Exception e) {
            logger.warn("No se pudieron resolver las IPs para {}, se usará filtro genérico TCP", targetHost);
        }

        String captureFilter = bpfBuilder.length() > 0 ? bpfBuilder.toString() : "tcp port 443 or tcp port 80";

        // 2. Iniciar captura Tshark con el filtro BPF amplio
        packetCaptureService.startCaptureWithFilter(
                interfaceName,
                analysisId,
                captureFilter
        );

        // Ejecutar un traceroute y un ping en segundo plano (diagnóstico base) a 8.8.8.8 o google.com (solo si no es interfaz USB)
        String activeInterface = sessionManagerService.getActiveInterface() != null ? sessionManagerService.getActiveInterface().getNombreInterfaz() : "";
        if (!activeInterface.toLowerCase().contains("usbpcap")) {
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    diagnosticsService.executePing("8.8.8.8");
                    diagnosticsService.executeTraceroute("8.8.8.8");
                } catch (Exception ignored) {}
            });
        }

        // 3. Pausa para asegurar que Tshark esté escuchando antes del tráfico HTTP
        Thread.sleep(1000);

        // 4. Ejecutar la prueba HTTP
        ActiveAnalysisResult result;
        try {
            result = provider.runTest(request);
        } finally {
            // 5. Breve pausa para capturar paquetes de cierre (FIN/ACK) antes de matar Tshark
            Thread.sleep(1000);
            packetCaptureService.stopCapture();
        }

        return result;
    }
}
