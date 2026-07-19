package ve.student.netAnalyzer.capture;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import ve.student.netAnalyzer.service.capture.PacketCaptureService;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class PacketCaptureServiceTest {

    @Autowired
    private PacketCaptureService packetCaptureService;

    @Test
    void contextLoads() {
        assertNotNull(packetCaptureService);
    }
}
