package ve.student.netAnalyzer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ve.student.netAnalyzer.model.ConfigParameter;
import java.util.Optional;

public interface ConfigParameterRepository extends JpaRepository<ConfigParameter, Integer> {
    Optional<ConfigParameter> findByNombreConfiguracion(String nombreConfiguracion);
}
