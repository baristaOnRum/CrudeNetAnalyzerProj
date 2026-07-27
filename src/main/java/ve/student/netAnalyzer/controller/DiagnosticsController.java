package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.dto.PingRequestDto;
import ve.student.netAnalyzer.dto.PingResponseDto;
import ve.student.netAnalyzer.dto.TraceHopDto;
import ve.student.netAnalyzer.model.DiagnosticPacket;
import ve.student.netAnalyzer.repository.DiagnosticPacketRepository;
import ve.student.netAnalyzer.service.DiagnosticsService;

import java.util.List;

@RestController
@RequestMapping("/api/diagnostics")

public class DiagnosticsController {

    private final DiagnosticsService diagnosticsService;
    private final DiagnosticPacketRepository diagnosticPacketRepository;

    public DiagnosticsController(DiagnosticsService diagnosticsService, DiagnosticPacketRepository diagnosticPacketRepository) {
        this.diagnosticsService = diagnosticsService;
        this.diagnosticPacketRepository = diagnosticPacketRepository;
    }

    @PostMapping("/ping")
    public ResponseEntity<PingResponseDto> executePing(@RequestBody PingRequestDto request) {
        PingResponseDto response = diagnosticsService.executePing(request.getTarget());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/traceroute")
    public ResponseEntity<List<TraceHopDto>> executeTraceroute(@RequestBody PingRequestDto request) {
        List<TraceHopDto> hops = diagnosticsService.executeTraceroute(request.getTarget());
        return ResponseEntity.ok(hops);
    }

    @GetMapping("/analysis/{analysisId}")
    public ResponseEntity<List<DiagnosticPacket>> getDiagnosticsByAnalysis(@PathVariable Integer analysisId) {
        return ResponseEntity.ok(diagnosticPacketRepository.findByAnalisisRedId(analysisId));
    }
}
