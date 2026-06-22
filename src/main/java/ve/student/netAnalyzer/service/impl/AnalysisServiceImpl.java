package ve.student.netAnalyzer.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import ve.student.netAnalyzer.dto.AnalysisDto;
import ve.student.netAnalyzer.dto.AnalysisResult;
import ve.student.netAnalyzer.dto.InterfaceDto;
import ve.student.netAnalyzer.model.AnalisisRed;
import ve.student.netAnalyzer.service.AnalysisService;
import ve.student.netAnalyzer.repository.AnalisisRedRepository;
import ve.student.netAnalyzer.service.SessionManagerService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AnalysisServiceImpl implements AnalysisService {

    private final AnalisisRedRepository repository;
    private final SessionManagerService sessionManagerService;

    @Autowired
    public AnalysisServiceImpl(AnalisisRedRepository repository, SessionManagerService sessionManagerService) {
        this.repository = repository;
        this.sessionManagerService = sessionManagerService;
    }

    @Override
    public void monitorPacketBehavior() {
        // Logica para monitorear el comportamiento
    }

    @Override
    public AnalysisResult analyzePacketsOnInterface(String interfaceId) {
        return new AnalysisResult(1L, interfaceId, "Success", 100);
    }

    @Override
    public String registerNetworkInterface(InterfaceDto dto) {
        return dto.getInterfaceId();
    }

    @Override
    public List<AnalisisRed> listAnalyses() {
        return new ArrayList<>();
    }

    @Override
    public AnalisisRed registerAnalysis(AnalysisDto data) {
        AnalisisRed ar = new AnalisisRed();
        ar.setFechaEjecucion(LocalDateTime.now());
        
        // Asignar el usuario que lo ejecutó desde la sesión activa
        if (sessionManagerService.getActiveUser() != null) {
            ar.setUsuarioEjecutado(sessionManagerService.getActiveUser());
        }

        ar = repository.save(ar);
        
        // Set this analysis as the currently active one
        sessionManagerService.setActiveAnalysis(ar);
        
        return ar;
    }

    @Override
    public AnalisisRed loadAnalysis(Long analysisId) {
        AnalisisRed ar = new AnalisisRed();
        if (analysisId != null) {
            ar.setId(analysisId.intValue());
        }
        return ar;
    }
}
