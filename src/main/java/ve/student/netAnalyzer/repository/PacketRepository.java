package ve.student.netAnalyzer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import ve.student.netAnalyzer.model.Packet;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PacketRepository extends JpaRepository<Packet, Long>, JpaSpecificationExecutor<Packet> {
    List<Packet> findByAnalisisRedFechaEjecucionBetween(LocalDateTime start, LocalDateTime end);
    List<Packet> findByAnalisisRedId(Integer id);
    List<Packet> findByAnalisisRedIdAndIdGreaterThan(Integer id, Long sinceId);
    org.springframework.data.domain.Page<Packet> findByAnalisisRedId(Integer id, org.springframework.data.domain.Pageable pageable);
    List<Packet> findByIdGreaterThan(Long sinceId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p), SUM(p.longitud), MIN(p.timestamp), MAX(p.timestamp) FROM Packet p WHERE p.analisisRed.id = :analysisId")
    List<Object[]> getAnalysisSummary(@org.springframework.data.repository.query.Param("analysisId") Integer analysisId);

    @org.springframework.data.jpa.repository.Query("SELECT p.tipoPaquete, COUNT(p) FROM Packet p WHERE p.analisisRed.id = :analysisId GROUP BY p.tipoPaquete")
    List<Object[]> getProtocolDistribution(@org.springframework.data.repository.query.Param("analysisId") Integer analysisId);

    @org.springframework.data.jpa.repository.Query("SELECT p.fuente, COUNT(p) FROM Packet p WHERE p.analisisRed.id = :analysisId GROUP BY p.fuente ORDER BY COUNT(p) DESC")
    List<Object[]> findTopSourceIps(@org.springframework.data.repository.query.Param("analysisId") Integer analysisId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p.destino, COUNT(p) FROM Packet p WHERE p.analisisRed.id = :analysisId GROUP BY p.destino ORDER BY COUNT(p) DESC")
    List<Object[]> findTopDestIps(@org.springframework.data.repository.query.Param("analysisId") Integer analysisId, org.springframework.data.domain.Pageable pageable);
}
