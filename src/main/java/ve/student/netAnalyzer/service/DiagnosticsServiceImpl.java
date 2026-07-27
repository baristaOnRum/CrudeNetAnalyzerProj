package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.dto.PacketDto;
import ve.student.netAnalyzer.dto.PingResponseDto;
import ve.student.netAnalyzer.dto.TraceHopDto;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ve.student.netAnalyzer.repository.DiagnosticPacketRepository;
import ve.student.netAnalyzer.model.DiagnosticPacket;
import ve.student.netAnalyzer.model.AnalisisRed;
import java.time.LocalDateTime;

@Service
public class DiagnosticsServiceImpl implements DiagnosticsService {

    private final PacketService packetService;
    private final SessionManagerService sessionManagerService;
    private final DiagnosticPacketRepository diagnosticPacketRepository;

    public DiagnosticsServiceImpl(PacketService packetService, SessionManagerService sessionManagerService, DiagnosticPacketRepository diagnosticPacketRepository) {
        this.packetService = packetService;
        this.sessionManagerService = sessionManagerService;
        this.diagnosticPacketRepository = diagnosticPacketRepository;
    }

    @Override
    public PingResponseDto executePing(String target) {
        PingResponseDto response = new PingResponseDto();
        response.setSuccess(false);

        try {
            ProcessBuilder pb = new ProcessBuilder("ping", "-n", "1", target);
            Process process = pb.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            Integer latency = null;
            Integer ttl = null;
            String ip = target;

            Pattern replyPattern = Pattern.compile("Reply from (.*?): bytes=.*? time[=<](\\d+)ms TTL=(\\d+)", Pattern.CASE_INSENSITIVE);

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

            AnalisisRed analisis = sessionManagerService.getActiveAnalysis();
            DiagnosticPacket dp = new DiagnosticPacket();
            dp.setComponente("PING");
            dp.setTipoPaquete("ICMP");
            dp.setFuente("Local");
            dp.setDestino(ip);
            dp.setContenidos("ICMP Echo Request (32 bytes)");
            if (response.isSuccess()) {
                dp.setRespuesta("Echo Reply (TTL=" + ttl + ")");
                dp.setTiempoRespuesta(latency);
            } else {
                dp.setRespuesta(null);
                dp.setTiempoRespuesta(null);
            }
            dp.setTimestamp(LocalDateTime.now());
            dp.setAnalisisRed(analisis);
            diagnosticPacketRepository.save(dp);

        } catch (Exception e) {
            response.setRawOutput("Failed to execute ping: " + e.getMessage());
        }

        return response;
    }

    /**
     * Ejecuta tracert (Windows) y devuelve la lista de saltos parseados.
     * Líneas típicas de tracert en Windows (CP850):
     *   1    <1 ms    <1 ms    <1 ms  192.168.1.1
     *   2     8 ms     7 ms     8 ms  10.200.1.1
     *   3     *        *        *     Tiempo de espera agotado.
     */
    @Override
    public List<TraceHopDto> executeTraceroute(String target) {
        List<TraceHopDto> hops = new ArrayList<>();

        try {
            // -d: no resolver DNS (más rápido), -w 2000: timeout 2s por salto
            ProcessBuilder pb = new ProcessBuilder("tracert", "-d", "-w", "2000", target);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // tracert usa codepage CP850 en Windows
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), "CP850")
            );

            // Detectar número de salto al inicio de la línea
            Pattern linePattern   = Pattern.compile("^\\s*(\\d+)\\b(.*)$");
            Pattern timeoutPattern = Pattern.compile("(?:timed out|agotado|\\* +\\* +\\*)", Pattern.CASE_INSENSITIVE);
            Pattern msPattern     = Pattern.compile("(\\d+|<1)\\s*ms");
            Pattern ipPattern     = Pattern.compile("(\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b|\\b(?:[a-fA-F0-9]{1,4}:){1,7}[a-fA-F0-9]{1,4}\\b|::1)");
            String line;
            while ((line = reader.readLine()) != null) {
                Matcher lineMatcher = linePattern.matcher(line);
                if (!lineMatcher.find()) continue;

                int hopNum;
                try {
                    hopNum = Integer.parseInt(lineMatcher.group(1).trim());
                } catch (NumberFormatException e) {
                    continue;
                }

                boolean isTimeout = timeoutPattern.matcher(line).find();
                if (isTimeout) {
                    hops.add(new TraceHopDto(hopNum, "*", "Tiempo de espera agotado", null, true));
                    continue;
                }

                // Latencia: primer valor ms encontrado
                Integer latency = null;
                Matcher msMatcher = msPattern.matcher(line);
                if (msMatcher.find()) {
                    String val = msMatcher.group(1);
                    latency = val.equals("<1") ? 0 : Integer.parseInt(val);
                }

                // IP: último valor IPv4 de la línea (los ms también son números, la IP va al final)
                String ip = null;
                Matcher ipMatcher = ipPattern.matcher(line);
                while (ipMatcher.find()) {
                    ip = ipMatcher.group(1);
                }
                if (ip == null) ip = "*";

                String hopLabel = (hopNum == 1) ? "Router Local / Pasarela" : (ip.equalsIgnoreCase(target) ? "Destino Final Alcanzado" : "Router / Salto Intermedio");

                hops.add(new TraceHopDto(hopNum, ip, hopLabel, latency, false));

                AnalisisRed analisis = sessionManagerService.getActiveAnalysis();
                DiagnosticPacket dp = new DiagnosticPacket();
                dp.setComponente("TRACEROUTE");
                dp.setTipoPaquete("ICMP");
                dp.setFuente("Local");
                dp.setDestino(ip);
                dp.setContenidos("TRACE_HOP_" + hopNum);
                dp.setRespuesta(hopLabel);
                dp.setTiempoRespuesta(latency);
                dp.setTimestamp(LocalDateTime.now());
                dp.setAnalisisRed(analisis);
                diagnosticPacketRepository.save(dp);
            }

            process.waitFor();

        } catch (Exception e) {
            hops.add(new TraceHopDto(hops.size() + 1, "error", "Error: " + e.getMessage(), null, true));
        }

        return hops;
    }
}
