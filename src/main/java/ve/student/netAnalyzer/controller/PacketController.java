package ve.student.netAnalyzer.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PacketController {

    // Swap this representation with your JPA Repository calls once your entity
    // mapping is ready.
    @GetMapping("/packets")
    public List<Map<String, Object>> getActivePackets() {
        return List.of(
                Map.of("id", "PKT-42012", "timestamp", "12:04:15.882", "sourceIp", "192.168.1.104", "destIp",
                        "10.0.0.12", "protocol", "TCP", "length", 512),
                Map.of("id", "PKT-42013", "timestamp", "12:04:16.102", "sourceIp", "10.0.0.5", "destIp", "8.8.8.8",
                        "protocol", "UDP", "length", 64));
    }
}