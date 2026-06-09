package ve.student.netAnalyzer.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.NetworkDevice;
import ve.student.netAnalyzer.repository.NetworkDeviceRepository;

import java.util.List;
import java.util.Optional;

@Service
public class NetworkDeviceService {

    private final NetworkDeviceRepository repository;

    @Autowired
    public NetworkDeviceService(NetworkDeviceRepository repository) {
        this.repository = repository;
    }

    public List<NetworkDevice> getAllDevices() {
        return repository.findAll();
    }

    public Optional<NetworkDevice> getDeviceById(Long id) {
        return repository.findById(id);
    }

    public NetworkDevice saveDevice(NetworkDevice device) {
        return repository.save(device);
    }

    public void deleteDevice(Long id) {
        repository.deleteById(id);
    }
}
