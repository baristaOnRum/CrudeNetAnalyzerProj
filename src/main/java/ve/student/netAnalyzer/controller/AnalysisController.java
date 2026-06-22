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

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    @Autowired
    private AnalysisService analysisService;

    @PostMapping("/interface")
    public ResponseEntity<String> registerInterface(@RequestBody InterfaceDto dto) {
        return ResponseEntity.ok(analysisService.registerNetworkInterface(dto));
    }

    @GetMapping
    public ResponseEntity<List<AnalisisRed>> listAnalyses() {
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
}
