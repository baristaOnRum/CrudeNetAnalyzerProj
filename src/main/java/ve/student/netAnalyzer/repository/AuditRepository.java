package ve.student.netAnalyzer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import ve.student.netAnalyzer.model.Audit;

public interface AuditRepository extends JpaRepository<Audit, String>, JpaSpecificationExecutor<Audit> {
}
