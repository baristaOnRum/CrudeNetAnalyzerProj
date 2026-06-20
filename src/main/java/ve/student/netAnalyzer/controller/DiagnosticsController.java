package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.dto.PingRequestDto;
import ve.student.netAnalyzer.dto.PingResponseDto;
import ve.student.netAnalyzer.service.DiagnosticsService;

@RestController
@RequestMapping("/api/diagnostics")
@CrossOrigin(origins = "http://localhost:5173")
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
}
