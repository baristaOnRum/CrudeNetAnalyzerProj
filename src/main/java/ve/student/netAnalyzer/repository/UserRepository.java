package ve.student.netAnalyzer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ve.student.netAnalyzer.model.AppUser;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<AppUser, Long> {
    
    Optional<AppUser> findByUsuario(String usuario);
    
}
