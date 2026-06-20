package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.dto.PacketDto;
import ve.student.netAnalyzer.dto.PingResponseDto;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class DiagnosticsServiceImpl implements DiagnosticsService {

    private final PacketService packetService;

    public DiagnosticsServiceImpl(PacketService packetService) {
        this.packetService = packetService;
    }

    @Override
    public PingResponseDto executePing(String target) {
        PingResponseDto response = new PingResponseDto();
        response.setSuccess(false);

        try {
            // Windows ping command: ping -n 1 target
            ProcessBuilder pb = new ProcessBuilder("ping", "-n", "1", target);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            Integer latency = null;
            Integer ttl = null;
            String ip = target; // fallback
            
            // Typical Windows ping output for success:
            // Reply from 8.8.8.8: bytes=32 time=14ms TTL=115
            Pattern replyPattern = Pattern.compile("Reply from (.*?): bytes=.*? time[=<](\\d+)ms TTL=(\\d+)", Pattern.CASE_INSENSITIVE);
            // Sometimes it matches time<1ms, so we handle = or <
            
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                Matcher m = replyPattern.matcher(line);
                if (m.find()) {
                    ip = m.group(1).trim();
                    latency = Integer.parseInt(m.group(2));
                    ttl = Integer.parseInt(m.group(3));
                    response.setSuccess(true);
                }
            }

            process.waitFor();
            
            response.setIp(ip);
            response.setLatency(latency);
            response.setTtl(ttl);
            response.setRawOutput(output.toString().trim());

            // Register packet in DB
            PacketDto packet = new PacketDto();
            packet.setTipoPaquete("ICMP");
            packet.setFuente("Local");
            packet.setDestino(ip);
            packet.setContenidos("ICMP Echo Request (32 bytes)");
            if (response.isSuccess()) {
                packet.setRespuesta("Echo Reply (TTL=" + ttl + ")");
                packet.setTiempoRespuesta(latency);
            } else {
                packet.setRespuesta(null); // Lost packet
                packet.setTiempoRespuesta(null);
            }
            packetService.registerPacket(packet);

        } catch (Exception e) {
            response.setRawOutput("Failed to execute ping: " + e.getMessage());
        }

        return response;
    }
}
