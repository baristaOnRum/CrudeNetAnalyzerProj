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
import ve.student.netAnalyzer.service.capture.PacketCaptureService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AnalysisServiceImpl implements AnalysisService {

    private final AnalisisRedRepository repository;
    private final SessionManagerService sessionManagerService;
    private final PacketCaptureService packetCaptureService;

    private final ve.student.netAnalyzer.repository.PacketRepository packetRepository;

    @Autowired
    public AnalysisServiceImpl(AnalisisRedRepository repository, SessionManagerService sessionManagerService, PacketCaptureService packetCaptureService, ve.student.netAnalyzer.repository.PacketRepository packetRepository) {
        this.repository = repository;
        this.sessionManagerService = sessionManagerService;
        this.packetCaptureService = packetCaptureService;
        this.packetRepository = packetRepository;
    }

    @Override
    public void monitorPacketBehavior() {
        // Logica para monitorear el comportamiento
    }

    @Override
    public AnalysisResult analyzePacketsOnInterface(String interfaceId) {
        try {
            Long analysisId = null;
            if (sessionManagerService.getActiveAnalysis() != null) {
                analysisId = (long) sessionManagerService.getActiveAnalysis().getId();
            }
            packetCaptureService.startCapture(interfaceId, analysisId);
            return new AnalysisResult(1L, interfaceId, "Iniciado", 0);
        } catch (Exception e) {
            throw new RuntimeException("Error al iniciar captura en interfaz: " + interfaceId, e);
        }
    }

    @Override
    public String registerNetworkInterface(InterfaceDto dto) {
        return dto.getInterfaceId();
    }

    @Override
    public List<AnalisisRed> listAnalyses() {
        return repository.findAll();
    }

    @Override
    public org.springframework.data.domain.Page<AnalisisRed> getAnalyses(int page, int size) {
        return repository.findAll(org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id")));
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
        if (analysisId == null) {
            throw new IllegalArgumentException("Analysis ID cannot be null");
        }
        AnalisisRed ar = repository.findById(analysisId.intValue())
                .orElseThrow(() -> new RuntimeException("Analysis not found with ID: " + analysisId));
        
        // Cargar y establecer como la sesión de análisis activa por defecto para visualización
        sessionManagerService.setActiveAnalysis(ar);
        
        return ar;
    }

    @Override
    public java.util.List<java.util.Map<String, String>> listInterfaces() {
        return packetCaptureService.listAvailableInterfaces();
    }

    @Override
    public boolean isNpcapInstalled() {
        return packetCaptureService.isNpcapInstalled();
    }

    @Override
    public void installNpcap() {
        packetCaptureService.installNpcap();
    }

    @Override
    public void stopCapture() {
        packetCaptureService.stopCapture();
    }

    @Override
    public ve.student.netAnalyzer.dto.AnalysisSummary getAnalysisSummary(Long analysisId) {
        ve.student.netAnalyzer.dto.AnalysisSummary summary = new ve.student.netAnalyzer.dto.AnalysisSummary();
        summary.setIdAnalisis(analysisId);
        
        List<Object[]> basicStats = packetRepository.getAnalysisSummary(analysisId.intValue());
        if (basicStats != null && !basicStats.isEmpty() && basicStats.get(0)[0] != null) {
            Object[] stats = basicStats.get(0);
            summary.setTotalPackets(((Number) stats[0]).longValue());
            summary.setTotalBytes(stats[1] != null ? ((Number) stats[1]).longValue() : 0L);
            
            if (stats[2] != null && stats[3] != null) {
                java.time.LocalDateTime minTime = (java.time.LocalDateTime) stats[2];
                java.time.LocalDateTime maxTime = (java.time.LocalDateTime) stats[3];
                long seconds = java.time.temporal.ChronoUnit.SECONDS.between(minTime, maxTime);
                summary.setDurationSeconds(Math.max(1L, seconds));
            } else {
                AnalisisRed analisis = repository.findById(analysisId.intValue()).orElse(null);
                summary.setDurationSeconds((analisis != null && analisis.getDuracionAnalisis() != null) ? Math.max(1L, (long)analisis.getDuracionAnalisis()) : 1L);
            }
        } else {
            summary.setTotalPackets(0L);
            summary.setTotalBytes(0L);
            summary.setDurationSeconds(1L);
        }
        
        List<Object[]> protocols = packetRepository.getProtocolDistribution(analysisId.intValue());
        java.util.Map<String, Long> protocolMap = new java.util.HashMap<>();
        if (protocols != null) {
            for (Object[] row : protocols) {
                String proto = (String) row[0];
                Long count = ((Number) row[1]).longValue();
                protocolMap.put(proto != null ? proto : "Desconocido", count);
            }
        }
        summary.setProtocolDistribution(protocolMap);
        
        return summary;
    }
}
