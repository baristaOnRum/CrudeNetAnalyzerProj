package ve.student.netAnalyzer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ve.student.netAnalyzer.model.Packet;

public interface PacketRepository extends JpaRepository<Packet, Long> {
}
