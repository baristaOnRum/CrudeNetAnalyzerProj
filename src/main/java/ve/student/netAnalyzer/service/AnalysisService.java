package ve.student.netAnalyzer.service;

import java.util.List;
import ve.student.netAnalyzer.dto.AnalysisDto;
import ve.student.netAnalyzer.dto.AnalysisResult;
import ve.student.netAnalyzer.dto.InterfaceDto;
import ve.student.netAnalyzer.model.AnalisisRed;

public interface AnalysisService {
    void monitorPacketBehavior();
    AnalysisResult analyzePacketsOnInterface(String interfaceId);
    String registerNetworkInterface(InterfaceDto dto);
    List<AnalisisRed> listAnalyses();
    AnalisisRed registerAnalysis(AnalysisDto data);
    AnalisisRed loadAnalysis(Long analysisId);
}
