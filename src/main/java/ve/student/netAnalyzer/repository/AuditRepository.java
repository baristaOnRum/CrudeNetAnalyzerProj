package ve.student.netAnalyzer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ve.student.netAnalyzer.model.Audit;

public interface AuditRepository extends JpaRepository<Audit, String> {
}
