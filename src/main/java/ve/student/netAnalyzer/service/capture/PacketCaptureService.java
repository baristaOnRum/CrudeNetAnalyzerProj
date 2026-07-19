package ve.student.netAnalyzer.service.capture;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;

@Service
public class PacketCaptureService {

    private static final Logger logger = LoggerFactory.getLogger(PacketCaptureService.class);

    @Value("${capture.tshark.path:./tshark-portable/tshark}")
    private String tsharkPath;

    @Value("${capture.temp.dir:./temp-captures}")
    private String tempDir;

    private Process captureProcess;

    public void startCapture(String interfaceName, String outputFilename) throws IOException {
        if (captureProcess != null && captureProcess.isAlive()) {
            throw new IllegalStateException("A capture is already running.");
        }

        File dir = new File(tempDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }

        String outputPath = tempDir + File.separator + outputFilename;
        
        // Command to run tshark
        String executable = tsharkPath;
        if (System.getProperty("os.name").toLowerCase().contains("win") && !executable.endsWith(".exe")) {
            executable += ".exe";
        }

        ProcessBuilder pb = new ProcessBuilder(
                executable,
                "-i", interfaceName,
                "-w", outputPath,
                "-q" // quiet mode
        );

        pb.redirectErrorStream(true);
        // pb.redirectOutput(ProcessBuilder.Redirect.INHERIT);
        
        logger.info("Starting packet capture on interface {} to file {}", interfaceName, outputPath);
        captureProcess = pb.start();
    }

    public void stopCapture() {
        if (captureProcess != null && captureProcess.isAlive()) {
            logger.info("Stopping packet capture...");
            captureProcess.destroy();
            try {
                captureProcess.waitFor();
                logger.info("Packet capture stopped.");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                logger.error("Interrupted while stopping capture.", e);
            }
        } else {
            logger.warn("No capture is currently running.");
        }
    }
    
    @PreDestroy
    public void cleanup() {
        stopCapture();
    }
}
