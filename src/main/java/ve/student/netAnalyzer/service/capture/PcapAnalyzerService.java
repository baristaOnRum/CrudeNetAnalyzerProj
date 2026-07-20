package ve.student.netAnalyzer.service.capture;

import org.pcap4j.core.NotOpenException;
import org.pcap4j.core.PcapHandle;
import org.pcap4j.core.PcapNativeException;
import org.pcap4j.core.Pcaps;
import org.pcap4j.packet.Packet;
import org.pcap4j.packet.IpV4Packet;
import org.pcap4j.packet.TcpPacket;
import org.pcap4j.packet.UdpPacket;
import ve.student.netAnalyzer.dto.PacketDto;
import ve.student.netAnalyzer.service.PacketService;
import ve.student.netAnalyzer.service.SessionManagerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
@EnableScheduling
public class PcapAnalyzerService {

    private static final Logger logger = LoggerFactory.getLogger(PcapAnalyzerService.class);

    @Value("${capture.temp.dir:./temp-captures}")
    private String tempDir;

    private final PacketService packetService;
    private final SessionManagerService sessionManagerService;

    public PcapAnalyzerService(PacketService packetService, SessionManagerService sessionManagerService) {
        this.packetService = packetService;
        this.sessionManagerService = sessionManagerService;
    }

    private String currentCaptureFilename = "capture.pcap";
    private boolean isAnalyzing = false;
    private long lastReadPosition = 0; // In case we want to track position, though pcap4j offline doesn't easily support resuming from byte offset

    public void startAnalysis(String filename) {
        this.currentCaptureFilename = filename;
        this.isAnalyzing = true;
        this.lastReadPosition = 0;
        logger.info("Started periodic analysis on file {}", filename);
    }

    public void stopAnalysis() {
        this.isAnalyzing = false;
        logger.info("Stopped periodic analysis");
    }

    // Read the file periodically every 1 second
    @Scheduled(fixedDelay = 1000)
    public void analyzePeriodically() {
        if (!isAnalyzing) {
            return;
        }

        String filePath = tempDir + File.separator + currentCaptureFilename;
        File pcapFile = new File(filePath);

        if (!pcapFile.exists()) {
            // File might not be created by tshark yet
            return;
        }

        try {
            // NOTE: Reading a growing PCAP file from the beginning every second is inefficient for large files.
            // A more advanced implementation would keep the handle open and read new packets as they arrive,
            // or track the byte offset and skip already processed bytes. 
            // For now, we simulate reading new packets by opening and reading it. 
            // In a real scenario, you'd likely want to rotate files or stream from tshark stdout.
            
            PcapHandle handle = Pcaps.openOffline(filePath);
            
            Packet packet;
            int packetCount = 0;
            long currentCount = 0;
            while ((packet = handle.getNextPacket()) != null) {
                currentCount++;
                if (currentCount <= lastReadPosition) {
                    continue;
                }
                
                packetCount++;
                
                try {
                    PacketDto dto = new PacketDto();
                    if (packet.contains(IpV4Packet.class)) {
                        IpV4Packet ipv4 = packet.get(IpV4Packet.class);
                        dto.setFuente(ipv4.getHeader().getSrcAddr().getHostAddress());
                        dto.setDestino(ipv4.getHeader().getDstAddr().getHostAddress());
                        dto.setTipoPaquete(ipv4.getHeader().getProtocol().name());
                        
                        if (packet.contains(TcpPacket.class)) {
                            TcpPacket tcp = packet.get(TcpPacket.class);
                            dto.setFuente(dto.getFuente() + ":" + tcp.getHeader().getSrcPort().valueAsInt());
                            dto.setDestino(dto.getDestino() + ":" + tcp.getHeader().getDstPort().valueAsInt());
                            if (tcp.getPayload() != null) {
                                dto.setContenidos(new String(tcp.getPayload().getRawData()));
                            }
                        } else if (packet.contains(UdpPacket.class)) {
                            UdpPacket udp = packet.get(UdpPacket.class);
                            dto.setFuente(dto.getFuente() + ":" + udp.getHeader().getSrcPort().valueAsInt());
                            dto.setDestino(dto.getDestino() + ":" + udp.getHeader().getDstPort().valueAsInt());
                            if (udp.getPayload() != null) {
                                dto.setContenidos(new String(udp.getPayload().getRawData()));
                            }
                        }
                    } else {
                        dto.setTipoPaquete("Unknown");
                    }
                    
                    if (sessionManagerService.getActiveAnalysis() != null && sessionManagerService.getActiveAnalysis().getId() != null) {
                        dto.setIdAnalisis(sessionManagerService.getActiveAnalysis().getId().intValue());
                    }
                    
                    if (dto.getContenidos() == null) {
                        dto.setContenidos("N/A");
                    }
                    
                    packetService.registerPacket(dto);
                } catch (Exception ex) {
                    logger.error("Error guardando paquete: ", ex);
                }
            }
            
            lastReadPosition = currentCount;
            
            handle.close();
            
            if (packetCount > 0) {
                logger.debug("Analyzed {} packets from {}", packetCount, filePath);
            }
            
        } catch (PcapNativeException | NotOpenException e) {
            logger.error("Error analyzing PCAP file: ", e);
        }
    }
}
