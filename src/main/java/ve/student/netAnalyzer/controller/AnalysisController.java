package ve.student.netAnalyzer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.dto.AnalysisDto;
import ve.student.netAnalyzer.dto.AnalysisResult;
import ve.student.netAnalyzer.dto.InterfaceDto;
import ve.student.netAnalyzer.model.AnalisisRed;
import ve.student.netAnalyzer.service.AnalysisService;

import java.util.List;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    @Autowired
    private AnalysisService analysisService;

    @PostMapping("/interface")
    public ResponseEntity<String> registerInterface(@RequestBody InterfaceDto dto) {
        return ResponseEntity.ok(analysisService.registerNetworkInterface(dto));
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

    @PostMapping("/interface/{interfaceId}/analyze")
    public ResponseEntity<AnalysisResult> analyzeInterface(@PathVariable String interfaceId) {
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

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleNotFound(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }

    @GetMapping("/{id}/summary")
    public ResponseEntity<ve.student.netAnalyzer.dto.AnalysisSummary> getAnalysisSummary(@PathVariable Long id) {
        return ResponseEntity.ok(analysisService.getAnalysisSummary(id));
    }
}
