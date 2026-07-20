package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.dto.PingRequestDto;
import ve.student.netAnalyzer.dto.PingResponseDto;
import ve.student.netAnalyzer.dto.TraceHopDto;
import ve.student.netAnalyzer.service.DiagnosticsService;

import java.util.List;

@RestController
@RequestMapping("/api/diagnostics")

public class DiagnosticsController {

    private final DiagnosticsService diagnosticsService;

    public DiagnosticsController(DiagnosticsService diagnosticsService) {
        this.diagnosticsService = diagnosticsService;
    }

    @PostMapping("/ping")
    public ResponseEntity<PingResponseDto> executePing(@RequestBody PingRequestDto request) {
        PingResponseDto response = diagnosticsService.executePing(request.getTarget());
        return ResponseEntity.ok(response);
    }

    /**
     * Ejecuta tracert en el servidor (Windows) contra el objetivo dado.
     * Es síncrono porque tracert puede tardar hasta ~maxHops * 2s = ~60s en el peor caso.
     * Se recomienda llamar con un timeout largo en el cliente.
     */
    @PostMapping("/traceroute")
    public ResponseEntity<List<TraceHopDto>> executeTraceroute(@RequestBody PingRequestDto request) {
        List<TraceHopDto> hops = diagnosticsService.executeTraceroute(request.getTarget());
        return ResponseEntity.ok(hops);
    }
}
