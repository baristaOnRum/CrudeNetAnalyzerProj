package ve.student.netAnalyzer.service.impl;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.dto.DateRange;
import ve.student.netAnalyzer.dto.Report;
import ve.student.netAnalyzer.dto.ReportCriteria;
import ve.student.netAnalyzer.dto.Statistics;
import ve.student.netAnalyzer.service.ReportService;
import ve.student.netAnalyzer.repository.PacketRepository;
import ve.student.netAnalyzer.model.Packet;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private final PacketRepository packetRepository;
    private final ve.student.netAnalyzer.repository.DiagnosticPacketRepository diagnosticPacketRepository;
    private final ve.student.netAnalyzer.service.ConfigurationService configurationService;

    public ReportServiceImpl(PacketRepository packetRepository,
                             ve.student.netAnalyzer.repository.DiagnosticPacketRepository diagnosticPacketRepository,
                             ve.student.netAnalyzer.service.ConfigurationService configurationService) {
        this.packetRepository = packetRepository;
        this.diagnosticPacketRepository = diagnosticPacketRepository;
        this.configurationService = configurationService;
    }

    @Override
    public Report generateReport(ReportCriteria criteria) {
        List<Packet> packets;
        List<ve.student.netAnalyzer.model.DiagnosticPacket> diagPackets;
        
        if (criteria.getSessionId() != null && !criteria.getSessionId().isEmpty()) {
            packets = packetRepository.findByAnalisisRedId(Integer.parseInt(criteria.getSessionId()));
            diagPackets = diagnosticPacketRepository.findByAnalisisRedId(Integer.parseInt(criteria.getSessionId()));
        } else if (criteria.getDateRange() != null && criteria.getDateRange().getStartDate() != null) {
            LocalDateTime start = parseDate(criteria.getDateRange().getStartDate(), true);
            LocalDateTime end = parseDate(criteria.getDateRange().getEndDate(), false);
            packets = packetRepository.findByAnalisisRedFechaEjecucionBetween(start, end);
            diagPackets = diagnosticPacketRepository.findByAnalisisRedFechaEjecucionBetween(start, end);
        } else {
            packets = packetRepository.findAll();
            diagPackets = diagnosticPacketRepository.findAll();
        }

        Statistics stats = calculateStatsFromPackets(packets, diagPackets);

        String reportContent = "Reporte analítico generado para " + packets.size() + " paquetes interceptados.";
        if (criteria.getFilterOptions() != null && !criteria.getFilterOptions().isEmpty()) {
            reportContent += " Filtros aplicados: " + criteria.getFilterOptions();
        }
        
        File generatedFile = null;
        String format = criteria.getReportType() != null ? criteria.getReportType().toUpperCase() : "PDF";
        if ("CSV".equals(format)) {
            generatedFile = ReportExporter.exportToCsv(packets, "Reporte");
        } else if ("PDF_PACKETS".equals(format)) {
            generatedFile = ReportExporter.exportToPdf(packets, null, "Reporte_Paquetes");
        } else {
            generatedFile = ReportExporter.exportToPdf(packets, stats, "Reporte_Estadistico");
        }

        String date = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        
        String filePath = generatedFile != null ? generatedFile.getAbsolutePath() : "";
        String downloadUrl = generatedFile != null ? "/api/reports/download/" + generatedFile.getName() : "";
        
        return new Report("REP-" + System.currentTimeMillis(), "Reporte de Análisis de Red", date, reportContent, filePath, downloadUrl);
    }

    @Override
    public Statistics generateStatistics(ReportCriteria criteria) {
        List<Packet> packets;
        List<ve.student.netAnalyzer.model.DiagnosticPacket> diagPackets;
        
        if (criteria != null && criteria.getSessionId() != null && !criteria.getSessionId().isEmpty()) {
            packets = packetRepository.findByAnalisisRedId(Integer.parseInt(criteria.getSessionId()));
            diagPackets = diagnosticPacketRepository.findByAnalisisRedId(Integer.parseInt(criteria.getSessionId()));
        } else if (criteria != null && criteria.getDateRange() != null && criteria.getDateRange().getStartDate() != null) {
            LocalDateTime start = parseDate(criteria.getDateRange().getStartDate(), true);
            LocalDateTime end = parseDate(criteria.getDateRange().getEndDate(), false);
            packets = packetRepository.findByAnalisisRedFechaEjecucionBetween(start, end);
            diagPackets = diagnosticPacketRepository.findByAnalisisRedFechaEjecucionBetween(start, end);
        } else {
            packets = packetRepository.findAll();
            diagPackets = diagnosticPacketRepository.findAll();
        }
        
        return calculateStatsFromPackets(packets, diagPackets);
    }
    
    private Statistics calculateStatsFromPackets(List<Packet> packets, List<ve.student.netAnalyzer.model.DiagnosticPacket> diagPackets) {
        long total = packets.size();
        if (total == 0) return new Statistics(0L, 0.0, "N/A");
        
        double avgSize = packets.stream()
                .mapToInt(p -> p.getContenidos() != null ? p.getContenidos().length() : 0)
                .average()
                .orElse(0.0);
                
        Map<String, Long> protocolDistribution = packets.stream()
                .filter(p -> p.getTipoPaquete() != null)
                .collect(Collectors.groupingBy(Packet::getTipoPaquete, Collectors.counting()));
                
        String topProtocol = protocolDistribution.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
                
        Map<String, Long> topSourceIps = packets.stream()
                .filter(p -> p.getFuente() != null)
                .collect(Collectors.groupingBy(Packet::getFuente, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(e -> e.getKey(), e -> e.getValue(), (e1, e2) -> e1, LinkedHashMap::new));

        Map<String, Long> topDestIps = packets.stream()
                .filter(p -> p.getDestino() != null)
                .collect(Collectors.groupingBy(Packet::getDestino, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(Collectors.toMap(e -> e.getKey(), e -> e.getValue(), (e1, e2) -> e1, LinkedHashMap::new));

        // Advanced metrics: Jitter, Rates, Percentiles, Errors
        packets.sort(Comparator.comparing(p -> p.getTimestamp() != null ? p.getTimestamp() : LocalDateTime.MIN));
        
        Map<String, Long> errorCounts = new java.util.HashMap<>();
        
        double totalJitter = 0;
        int jitterCount = 0;
        List<Integer> jitters = new ArrayList<>();
        List<Integer> sizes = new ArrayList<>();
        double totalBytes = 0;
        
        java.util.Map<String, Integer> lastRttPerFlow = new java.util.HashMap<>();

        for (int i = 0; i < packets.size(); i++) {
            Packet p = packets.get(i);
            int length = p.getLongitud() != null ? p.getLongitud() : 0;
            sizes.add(length);
            totalBytes += length;
            
            // Detección de errores en p.getContenidos()
            String info = p.getContenidos();
            if (info != null) {
                if (info.contains("Retransmission") && !info.contains("Fast") && !info.contains("Spurious")) {
                    errorCounts.put("Retransmisión TCP", errorCounts.getOrDefault("Retransmisión TCP", 0L) + 1);
                } else if (info.contains("Fast Retransmission")) {
                    errorCounts.put("Retransmisión Rápida TCP", errorCounts.getOrDefault("Retransmisión Rápida TCP", 0L) + 1);
                } else if (info.contains("Dup ACK") || info.contains("Duplicate ACK")) {
                    errorCounts.put("ACK Duplicado", errorCounts.getOrDefault("ACK Duplicado", 0L) + 1);
                } else if (info.contains("Destination unreachable")) {
                    errorCounts.put("Destino Inalcanzable (ICMP)", errorCounts.getOrDefault("Destino Inalcanzable (ICMP)", 0L) + 1);
                } else if (info.contains("Time-to-live exceeded")) {
                    errorCounts.put("TTL Expirado", errorCounts.getOrDefault("TTL Expirado", 0L) + 1);
                } else if (info.contains("RST")) {
                    errorCounts.put("Conexión Reseteada (RST)", errorCounts.getOrDefault("Conexión Reseteada (RST)", 0L) + 1);
                } else if (info.contains("Malformed")) {
                    errorCounts.put("Paquete Malformado", errorCounts.getOrDefault("Paquete Malformado", 0L) + 1);
                }
            }

            if (p.getTiempoRespuesta() != null && p.getTiempoRespuesta() > 0 && p.getFuente() != null && p.getDestino() != null && p.getTipoPaquete() != null) {
                String src = p.getFuente();
                String dst = p.getDestino();
                String proto = p.getTipoPaquete();
                // Usar llave unidireccional idéntica a NetworkAnalyzer.tsx
                String flowKey = src + "-" + dst + "-" + proto;
                
                Integer previousRtt = lastRttPerFlow.get(flowKey);
                if (previousRtt != null) {
                    int currentRtt = p.getTiempoRespuesta();
                    int j = Math.abs(currentRtt - previousRtt);
                    // Descartar deltas absurdos (>2000ms) que son heartbeats/keepalives, no jitter real
                    if (j <= 2000) {
                        jitters.add(j);
                        totalJitter += j;
                        jitterCount++;
                    }
                }
                lastRttPerFlow.put(flowKey, p.getTiempoRespuesta());
            }
        }
        
        double averageJitter = jitterCount > 0 ? totalJitter / jitterCount : 0.0;
        double jitterP50 = calculatePercentile(jitters, 50.0);
        double jitter90 = calculatePercentile(jitters, 90.0);
        double jitterP99 = calculatePercentile(jitters, 99.0);
        
        double sizeP50 = calculatePercentile(sizes, 50.0);
        double size90 = calculatePercentile(sizes, 90.0);
        double sizeP99 = calculatePercentile(sizes, 99.0);
        
        double durationSeconds = 60.0;
        if (packets.get(0).getAnalisisRed() != null) {
            Integer d = packets.get(0).getAnalisisRed().getDuracionAnalisis();
            if (d != null && d > 0) durationSeconds = d;
        }

        // Calcular la tasa de rendimiento pico (Burst Rate) agrupada por segundo
        Map<Long, Long> bytesPerSecondBucket = new HashMap<>();
        for (Packet p : packets) {
            if (p.getTimestamp() != null) {
                long secBucket = p.getTimestamp().atZone(java.time.ZoneId.systemDefault()).toEpochSecond();
                long len = p.getLongitud() != null ? p.getLongitud() : (p.getContenidos() != null ? p.getContenidos().getBytes().length : 64);
                bytesPerSecondBucket.merge(secBucket, len, Long::sum);
            }
        }
        long maxBytesPerSec = bytesPerSecondBucket.values().stream().mapToLong(Long::longValue).max().orElse(0L);

        // Tasa Sostenida (promedio global de la sesión en B/s)
        double sustainedDownloadRate = totalBytes / Math.max(1.0, durationSeconds);

        // Tasa Pico (Rendimiento máximo por segundo en B/s)
        double downloadRate = maxBytesPerSec > 0 ? (double) maxBytesPerSec : sustainedDownloadRate;
        double packetRate = total / Math.max(1.0, durationSeconds);
                
        List<Integer> allLatencies = new ArrayList<>();
        for (Packet p : packets) {
            if (p.getTiempoRespuesta() != null && p.getTiempoRespuesta() > 0) {
                allLatencies.add(p.getTiempoRespuesta());
            }
        }
        if (diagPackets != null) {
            for (ve.student.netAnalyzer.model.DiagnosticPacket dp : diagPackets) {
                if (dp.getTiempoRespuesta() != null && dp.getTiempoRespuesta() > 0) {
                    allLatencies.add(dp.getTiempoRespuesta());
                }
            }
        }
        
        double latencyMin = calculatePercentile(allLatencies, 0.0);
        double latencyP25 = calculatePercentile(allLatencies, 25.0);
        double latencyMean = allLatencies.stream().mapToInt(Integer::intValue).average().orElse(0.0);
        double latencyP50 = calculatePercentile(allLatencies, 50.0);
        double latencyP75 = calculatePercentile(allLatencies, 75.0);
        double latencyP90 = calculatePercentile(allLatencies, 90.0);
        double latencyP99 = calculatePercentile(allLatencies, 99.0);
        double latencyMax = calculatePercentile(allLatencies, 100.0);
        
        double criticalLatency = 150.0;
        double criticalJitter = 30.0;
        double criticalErrorRate = 5.0; // Default 5%
        double minSustainedRateKbps = 100.0; // Default 100 KB/s
        try {
            String latStr = configurationService.getParameter("CRITICAL_LATENCY_MS").getValorSeleccionado();
            if (latStr != null && !latStr.isEmpty()) criticalLatency = Double.parseDouble(latStr);
            
            String jitStr = configurationService.getParameter("CRITICAL_JITTER_MS").getValorSeleccionado();
            if (jitStr != null && !jitStr.isEmpty()) criticalJitter = Double.parseDouble(jitStr);

            String errStr = configurationService.getParameter("CRITICAL_ERROR_RATE").getValorSeleccionado();
            if (errStr != null && !errStr.isEmpty()) criticalErrorRate = Double.parseDouble(errStr);

            String rateStr = configurationService.getParameter("MIN_SUSTAINED_DOWNLOAD_RATE_KBPS").getValorSeleccionado();
            if (rateStr != null && !rateStr.isEmpty()) minSustainedRateKbps = Double.parseDouble(rateStr);
        } catch(Exception e) {}

        long totalErrors = errorCounts.values().stream().mapToLong(Long::longValue).sum();
        double errorRate = total > 0 ? ((double) totalErrors / total) * 100.0 : 0.0;

        double networkScore = 100.0;
        if (latencyP90 > criticalLatency) {
            double penalty = ((latencyP90 - criticalLatency) / criticalLatency) * 35.0;
            networkScore -= Math.min(penalty, 35.0);
        }
        if (averageJitter > criticalJitter) {
            double penalty = ((averageJitter - criticalJitter) / criticalJitter) * 25.0;
            networkScore -= Math.min(penalty, 25.0);
        }
        if (errorRate > criticalErrorRate) {
            double penalty = ((errorRate - criticalErrorRate) / criticalErrorRate) * 30.0;
            networkScore -= Math.min(penalty, 30.0);
        }
        double sustainedKbps = sustainedDownloadRate / 1024.0;
        if (sustainedKbps < minSustainedRateKbps && total > 100) {
            double penalty = ((minSustainedRateKbps - sustainedKbps) / minSustainedRateKbps) * 10.0;
            networkScore -= Math.min(penalty, 10.0);
        }
        if (networkScore < 0) networkScore = 0;
        
        Map<String, Long> errorDistribution = errorCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (e1, e2) -> e1, LinkedHashMap::new));

        Statistics stats = new Statistics(total, avgSize, topProtocol, protocolDistribution, topSourceIps, topDestIps,
                              averageJitter, downloadRate, packetRate, jitter90, size90, errorRate);
        stats.setSustainedDownloadRate(sustainedDownloadRate);
        stats.setErrorDistribution(errorDistribution);
        stats.setNetworkScore(networkScore);
        
        stats.setJitterP50(jitterP50);
        stats.setJitterP99(jitterP99);
        stats.setSizeP50(sizeP50);
        stats.setSizeP99(sizeP99);
        stats.setLatencyMin(latencyMin);
        stats.setLatencyP25(latencyP25);
        stats.setLatencyMean(latencyMean);
        stats.setLatencyP50(latencyP50);
        stats.setLatencyP75(latencyP75);
        stats.setLatencyP90(latencyP90);
        stats.setLatencyP99(latencyP99);
        stats.setLatencyMax(latencyMax);
        
        return stats;
    }
    
    private double calculatePercentile(List<Integer> values, double percentile) {
        if (values == null || values.isEmpty()) return 0.0;
        List<Integer> sorted = values.stream().sorted().collect(Collectors.toList());
        int index = (int) Math.ceil((percentile / 100.0) * sorted.size()) - 1;
        if (index < 0) index = 0;
        return sorted.get(index);
    }
    
    private LocalDateTime parseDate(String dateStr, boolean isStart) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            return isStart ? LocalDateTime.now().minusYears(10) : LocalDateTime.now().plusYears(10);
        }
        dateStr = dateStr.trim();
        try {
            if (dateStr.contains("/")) {
                String[] parts = dateStr.split(" ");
                String[] dParts = parts[0].split("/");
                if (dParts.length == 3) {
                    int day = Integer.parseInt(dParts[0]);
                    int month = Integer.parseInt(dParts[1]);
                    int year = Integer.parseInt(dParts[2]);
                    if (parts.length > 1 && parts[1].contains(":")) {
                        String[] tParts = parts[1].split(":");
                        int hour = Integer.parseInt(tParts[0]);
                        int min = Integer.parseInt(tParts[1]);
                        int sec = tParts.length > 2 ? Integer.parseInt(tParts[2]) : 0;
                        return java.time.LocalDateTime.of(year, month, day, hour, min, sec);
                    }
                    java.time.LocalDate ld = java.time.LocalDate.of(year, month, day);
                    return isStart ? ld.atStartOfDay() : ld.atTime(23, 59, 59);
                }
            }
            if (dateStr.contains("T")) {
                return LocalDateTime.parse(dateStr);
            }
            return LocalDateTime.parse(dateStr + (isStart ? "T00:00:00" : "T23:59:59"));
        } catch (Exception e) {
            return isStart ? LocalDateTime.now().minusYears(10) : LocalDateTime.now().plusYears(10);
        }
    }
}
