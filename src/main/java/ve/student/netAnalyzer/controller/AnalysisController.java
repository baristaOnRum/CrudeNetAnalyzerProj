package ve.student.netAnalyzer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.dto.ActiveAnalysisRequest;
import ve.student.netAnalyzer.dto.ActiveAnalysisResult;
import ve.student.netAnalyzer.dto.AnalysisDto;
import ve.student.netAnalyzer.dto.AnalysisResult;
import ve.student.netAnalyzer.dto.InterfaceDto;
import ve.student.netAnalyzer.model.AnalisisRed;
import ve.student.netAnalyzer.service.AnalysisService;
import ve.student.netAnalyzer.service.speedtest.ActiveAnalysisService;
import ve.student.netAnalyzer.service.AuditService;
import ve.student.netAnalyzer.service.IpResolutionService;
import ve.student.netAnalyzer.dto.AuditDto;
import java.time.LocalDateTime;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    @Autowired
    private AnalysisService analysisService;

    @Autowired
    private ActiveAnalysisService activeAnalysisService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private IpResolutionService ipResolutionService;

    @PostMapping("/interface")
    public ResponseEntity<String> registerInterface(@RequestBody InterfaceDto dto) {
        return ResponseEntity.ok(analysisService.registerNetworkInterface(dto));
    }

    @GetMapping("/interface")
    public ResponseEntity<InterfaceDto> getActiveInterface() {
        InterfaceDto active = analysisService.getActiveInterface();
        if (active == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(active);
    }

    @GetMapping("/interfaces")
    public ResponseEntity<List<java.util.Map<String, String>>> listInterfaces() {
        return ResponseEntity.ok(analysisService.listInterfaces());
    }

    @GetMapping("/npcap-status")
    public ResponseEntity<Boolean> isNpcapInstalled() {
        return ResponseEntity.ok(analysisService.isNpcapInstalled());
    }

    @PostMapping("/install-npcap")
    public ResponseEntity<Void> installNpcap() {
        analysisService.installNpcap();
        return ResponseEntity.ok().build();
    }

    @PostMapping("/interface/analyze")
    public ResponseEntity<AnalysisResult> analyzeInterface(@RequestBody java.util.Map<String, String> payload) {
        String interfaceId = payload.get("interfaceId");
        String ip = ipResolutionService.getPublicIp();
        AuditDto audit = new AuditDto();
        audit.setNombreAuditoria("Ejecución de Análisis Pasivo");
        audit.setDetalleCambio("Se inició un análisis pasivo en la interfaz: " + interfaceId + ". IP Pública detectada: " + ip);
        audit.setFechaHora(LocalDateTime.now());
        auditService.registerAudit(audit);

        return ResponseEntity.ok(analysisService.analyzePacketsOnInterface(interfaceId));
    }

    @PostMapping("/stop")
    public ResponseEntity<Void> stopCapture() {
        analysisService.stopCapture();
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<?> listAnalyses(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            return ResponseEntity.ok(analysisService.getAnalyses(page, size));
        }
        return ResponseEntity.ok(analysisService.listAnalyses());
    }

    @PostMapping
    public ResponseEntity<AnalisisRed> registerAnalysis(@RequestBody AnalysisDto dto) {
        return ResponseEntity.ok(analysisService.registerAnalysis(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnalisisRed> loadAnalysis(@PathVariable Long id) {
        return ResponseEntity.ok(analysisService.loadAnalysis(id));
    }

    /** Devuelve la lista de proveedores de speed test disponibles para el frontend */
    @GetMapping("/active/providers")
    public ResponseEntity<List<Map<String, String>>> getSpeedTestProviders() {
        return ResponseEntity.ok(activeAnalysisService.getAvailableProviders());
    }

    /**
     * Ejecuta un análisis activo completo:
     * 1. Inicia Tshark con filtro BPF en la interfaz indicada.
     * 2. Ejecuta la prueba HTTP al proveedor seleccionado.
     * 3. Detiene Tshark y devuelve métricas.
     */
    @PostMapping("/active/speedtest")
    public ResponseEntity<?> runActiveSpeedTest(@RequestBody ActiveAnalysisRequest request) {
        try {
            String ip = ipResolutionService.getPublicIp();
            AuditDto audit = new AuditDto();
            audit.setNombreAuditoria("Ejecución de Análisis Activo");
            audit.setDetalleCambio("Se inició un análisis activo (proveedor: " + request.getProvider() + ") usando interfaz: " + request.getInterfaceName() + ". IP Pública: " + ip);
            audit.setFechaHora(LocalDateTime.now());
            auditService.registerAudit(audit);

            ActiveAnalysisResult result = activeAnalysisService.executeActiveAnalysis(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }


    @GetMapping("/{id}/summary")
    public ResponseEntity<ve.student.netAnalyzer.dto.AnalysisSummary> getAnalysisSummary(@PathVariable Long id) {
        return ResponseEntity.ok(analysisService.getAnalysisSummary(id));
    }
}
