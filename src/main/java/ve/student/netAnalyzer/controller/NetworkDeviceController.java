package ve.student.netAnalyzer.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.model.NetworkDevice;
import ve.student.netAnalyzer.service.NetworkDeviceService;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
public class NetworkDeviceController {

    private final NetworkDeviceService service;

    @Autowired
    public NetworkDeviceController(NetworkDeviceService service) {
        this.service = service;
    }

    @GetMapping
    public List<NetworkDevice> getAllDevices() {
        return service.getAllDevices();
    }

    @PostMapping
    public NetworkDevice createDevice(@RequestBody NetworkDevice device) {
        return service.saveDevice(device);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NetworkDevice> getDeviceById(@PathVariable Long id) {
        return service.getDeviceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDevice(@PathVariable Long id) {
        service.deleteDevice(id);
        return ResponseEntity.noContent().build();
    }
}
