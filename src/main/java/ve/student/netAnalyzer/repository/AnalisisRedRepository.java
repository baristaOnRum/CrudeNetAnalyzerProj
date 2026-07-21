package ve.student.netAnalyzer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import ve.student.netAnalyzer.model.AnalisisRed;

public interface AnalisisRedRepository extends JpaRepository<AnalisisRed, Integer>, JpaSpecificationExecutor<AnalisisRed> {
}
