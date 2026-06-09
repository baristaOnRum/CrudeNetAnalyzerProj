package ve.student.netAnalyzer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ve.student.netAnalyzer.model.NetworkDevice;

@Repository
public interface NetworkDeviceRepository extends JpaRepository<NetworkDevice, Long> {
}
