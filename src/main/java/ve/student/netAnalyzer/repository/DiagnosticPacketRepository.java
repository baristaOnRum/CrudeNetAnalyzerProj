package ve.student.netAnalyzer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ve.student.netAnalyzer.model.DiagnosticPacket;

import java.util.List;

@Repository
public interface DiagnosticPacketRepository extends JpaRepository<DiagnosticPacket, Long> {
    
    // Método para obtener los paquetes de diagnóstico asociados a un análisis específico
    List<DiagnosticPacket> findByAnalisisRedId(Integer idAnalisis);

    List<DiagnosticPacket> findByAnalisisRedFechaEjecucionBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);

}
