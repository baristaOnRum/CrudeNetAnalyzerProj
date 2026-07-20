package ve.student.netAnalyzer.service.capture;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import ve.student.netAnalyzer.model.AnalisisRed;
import ve.student.netAnalyzer.model.Packet;
import ve.student.netAnalyzer.repository.AnalisisRedRepository;
import ve.student.netAnalyzer.repository.PacketRepository;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class PacketCaptureService {

    private static final Logger logger = LoggerFactory.getLogger(PacketCaptureService.class);

    @Value("${capture.tshark.path:./tshark-portable/tshark}")
    private String tsharkPath;

    private Process captureProcess;
    private final ExecutorService executorService = Executors.newSingleThreadExecutor();

    private final PacketRepository packetRepository;
    private final AnalisisRedRepository analisisRedRepository;

    @Autowired
    public PacketCaptureService(PacketRepository packetRepository, AnalisisRedRepository analisisRedRepository) {
        this.packetRepository = packetRepository;
        this.analisisRedRepository = analisisRedRepository;
    }

    public void startCapture(String interfaceName, Long analysisId) throws IOException {
        if (captureProcess != null && captureProcess.isAlive()) {
            logger.warn("A capture is already running. Stopping it before starting a new one.");
            stopCapture();
        }

        String executable = tsharkPath;
        if (System.getProperty("os.name").toLowerCase().contains("win") && !executable.endsWith(".exe")) {
            executable += ".exe";
        }

        ProcessBuilder pb = new ProcessBuilder(
                executable,
                "-i", interfaceName,
                "-T", "fields",
                "-e", "ip.src",
                "-e", "ip.dst",
                "-e", "_ws.col.Protocol",
                "-e", "frame.len",
                "-e", "_ws.col.Info",
                "-E", "separator=|",
                "-l" // flush every line
        );

        pb.redirectErrorStream(true);
        
        logger.info("Starting real-time packet capture on interface {}", interfaceName);
        captureProcess = pb.start();

        BufferedReader reader = new BufferedReader(new InputStreamReader(captureProcess.getInputStream()));

        executorService.submit(() -> {
            try {
                AnalisisRed activeAnalysis = null;
                if (analysisId != null) {
                    activeAnalysis = analisisRedRepository.findById(analysisId.intValue()).orElse(null);
                }

                String line;
                java.util.List<Packet> buffer = new java.util.ArrayList<>();
                long lastSaveTime = System.currentTimeMillis();

                while ((line = reader.readLine()) != null) {
                    if (line.trim().isEmpty() || line.startsWith("Capturing on") || line.matches("\\d+ packets captured")) continue;
                    try {
                        String[] parts = line.split("\\|", -1);
                        if (parts.length >= 5) {
                            String srcIp = parts[0];
                            String dstIp = parts[1];
                            String proto = parts[2];
                            String lenStr = parts[3];
                            String info = parts[4];
                            
                            Packet p = new Packet();
                            p.setFuente(srcIp != null && !srcIp.isEmpty() ? srcIp : "N/A");
                            p.setDestino(dstIp != null && !dstIp.isEmpty() ? dstIp : "N/A");
                            p.setTipoPaquete(proto != null && !proto.isEmpty() ? proto : "Unknown");
                            p.setContenidos(info != null && !info.isEmpty() ? info : "No Info");
                            p.setTiempoRespuesta(0);
                            p.setRespuesta("Capturado en vivo");
                            p.setTimestamp(java.time.LocalDateTime.now());

                            int pktLen = 0;
                            if (lenStr != null && !lenStr.isEmpty()) {
                                try {
                                    String[] lengths = lenStr.split(",");
                                    for(String l : lengths) pktLen += Integer.parseInt(l.trim());
                                } catch(Exception ignored) {}
                            }
                            p.setLongitud(pktLen);

                            if (activeAnalysis != null) {
                                p.setAnalisisRed(activeAnalysis);
                            }
                            
                            buffer.add(p);
                            
                            if (buffer.size() >= 100 || (System.currentTimeMillis() - lastSaveTime) > 1000) {
                                if (!buffer.isEmpty()) {
                                    packetRepository.saveAll(buffer);
                                    buffer.clear();
                                    lastSaveTime = System.currentTimeMillis();
                                }
                            }
                        } else {
                            logger.warn("Tshark output (non-packet): " + line);
                        }
                    } catch (Exception e) {
                        logger.error("Error parsing tshark line: " + line, e);
                    }
                }
                
                if (!buffer.isEmpty()) {
                    packetRepository.saveAll(buffer);
                }
            } catch (Exception e) {
                logger.error("Error reading tshark output", e);
            }
        });
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
        executorService.shutdownNow();
    }

    public boolean isNpcapInstalled() {
        if (!System.getProperty("os.name").toLowerCase().contains("win")) return true; // Asume true en non-windows
        try {
            Process p = Runtime.getRuntime().exec("sc query npcap");
            p.waitFor();
            return p.exitValue() == 0;
        } catch (Exception e) {
            logger.error("Error comprobando Npcap", e);
            return false;
        }
    }

    public void installNpcap() {
        try {
            logger.info("Ejecutando instalador de Npcap...");
            java.io.File installer = new java.io.File("dependencies/npcap-1.79.exe");
            if (installer.exists()) {
                ProcessBuilder pb = new ProcessBuilder(installer.getAbsolutePath());
                Process installerProcess = pb.start();
                installerProcess.waitFor();
                logger.info("Instalador de Npcap finalizado.");
            } else {
                logger.error("No se encontró el instalador de Npcap en " + installer.getAbsolutePath());
                throw new RuntimeException("Instalador no encontrado.");
            }
        } catch (Exception e) {
            logger.error("Error ejecutando instalador Npcap", e);
            throw new RuntimeException("Error ejecutando instalador", e);
        }
    }

    public java.util.List<java.util.Map<String, String>> listAvailableInterfaces() {
        java.util.List<java.util.Map<String, String>> interfaces = new java.util.ArrayList<>();
        String executable = tsharkPath;
        if (System.getProperty("os.name").toLowerCase().contains("win") && !executable.endsWith(".exe")) {
            executable += ".exe";
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(executable, "-D");
            Process p = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                java.util.Map<String, String> ifaceMap = new java.util.HashMap<>();
                ifaceMap.put("name", line);
                
                String mac = "00:00:00:00:00:00";
                int start = line.indexOf('(');
                int end = line.lastIndexOf(')');
                if (start != -1 && end != -1 && end > start) {
                    String desc = line.substring(start + 1, end);
                    java.util.Enumeration<java.net.NetworkInterface> nets = java.net.NetworkInterface.getNetworkInterfaces();
                    for (java.net.NetworkInterface netint : java.util.Collections.list(nets)) {
                        if (netint.getDisplayName() != null && netint.getDisplayName().equals(desc)) {
                            byte[] macBytes = netint.getHardwareAddress();
                            if (macBytes != null) {
                                StringBuilder sb = new StringBuilder();
                                for (int i = 0; i < macBytes.length; i++) {
                                    sb.append(String.format("%02X%s", macBytes[i], (i < macBytes.length - 1) ? ":" : ""));
                                }
                                mac = sb.toString();
                                break;
                            }
                        }
                    }
                }
                ifaceMap.put("mac", mac);
                interfaces.add(ifaceMap);
            }
            p.waitFor();
        } catch (Exception e) {
            logger.error("Error listing interfaces with tshark -D", e);
        }
        return interfaces;
    }
}
