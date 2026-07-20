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
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.stream.Collectors;

@Service
public class ReportServiceImpl implements ReportService {

    private final PacketRepository packetRepository;

    public ReportServiceImpl(PacketRepository packetRepository) {
        this.packetRepository = packetRepository;
    }

    @Override
    public Report generateReport(ReportCriteria criteria) {
        List<Packet> packets;
        if (criteria.getSessionId() != null && !criteria.getSessionId().isEmpty()) {
            packets = packetRepository.findByAnalisisRedId(Integer.parseInt(criteria.getSessionId()));
        } else if (criteria.getDateRange() != null && criteria.getDateRange().getStartDate() != null) {
            LocalDateTime start = parseDate(criteria.getDateRange().getStartDate(), true);
            LocalDateTime end = parseDate(criteria.getDateRange().getEndDate(), false);
            packets = packetRepository.findByAnalisisRedFechaEjecucionBetween(start, end);
        } else {
            packets = packetRepository.findAll();
        }

        Statistics stats = calculateStatsFromPackets(packets);

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
        if (criteria != null && criteria.getSessionId() != null && !criteria.getSessionId().isEmpty()) {
            packets = packetRepository.findByAnalisisRedId(Integer.parseInt(criteria.getSessionId()));
        } else if (criteria != null && criteria.getDateRange() != null && criteria.getDateRange().getStartDate() != null) {
            LocalDateTime start = parseDate(criteria.getDateRange().getStartDate(), true);
            LocalDateTime end = parseDate(criteria.getDateRange().getEndDate(), false);
            packets = packetRepository.findByAnalisisRedFechaEjecucionBetween(start, end);
        } else {
            packets = packetRepository.findAll();
        }
        
        return calculateStatsFromPackets(packets);
    }
    
    private Statistics calculateStatsFromPackets(List<Packet> packets) {
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

        // Advanced metrics: Jitter, Rates, Percentiles
        packets.sort(Comparator.comparing(p -> p.getTimestamp() != null ? p.getTimestamp() : LocalDateTime.MIN));
        
        double totalJitter = 0;
        int jitterCount = 0;
        List<Integer> jitters = new ArrayList<>();
        List<Integer> sizes = new ArrayList<>();
        double totalBytes = 0;

        for (int i = 0; i < packets.size(); i++) {
            Packet p = packets.get(i);
            int length = p.getLongitud() != null ? p.getLongitud() : 0;
            sizes.add(length);
            totalBytes += length;
            
            if (i > 0) {
                Packet prev = packets.get(i - 1);
                int t1 = p.getTiempoRespuesta() != null ? p.getTiempoRespuesta() : 0;
                int t2 = prev.getTiempoRespuesta() != null ? prev.getTiempoRespuesta() : 0;
                int j = Math.abs(t1 - t2);
                jitters.add(j);
                totalJitter += j;
                jitterCount++;
            }
        }
        
        double averageJitter = jitterCount > 0 ? totalJitter / jitterCount : 0.0;
        double jitter90 = calculatePercentile(jitters, 90.0);
        double size90 = calculatePercentile(sizes, 90.0);
        
        double durationSeconds = 60.0;
        if (packets.get(0).getAnalisisRed() != null) {
            Integer d = packets.get(0).getAnalisisRed().getDuracionAnalisis();
            if (d != null && d > 0) durationSeconds = d;
        }
        
        double downloadRate = totalBytes / durationSeconds;
        double packetRate = total / durationSeconds;
                
        return new Statistics(total, avgSize, topProtocol, protocolDistribution, topSourceIps, topDestIps,
                              averageJitter, downloadRate, packetRate, jitter90, size90);
    }
    
    private double calculatePercentile(List<Integer> values, double percentile) {
        if (values == null || values.isEmpty()) return 0.0;
        List<Integer> sorted = values.stream().sorted().collect(Collectors.toList());
        int index = (int) Math.ceil((percentile / 100.0) * sorted.size()) - 1;
        if (index < 0) index = 0;
        return sorted.get(index);
    }
    
    private LocalDateTime parseDate(String dateStr, boolean isStart) {
        try {
            if (dateStr.contains("T")) {
                return LocalDateTime.parse(dateStr);
            }
            return LocalDateTime.parse(dateStr + (isStart ? "T00:00:00" : "T23:59:59"));
        } catch (Exception e) {
            return isStart ? LocalDateTime.now().minusYears(10) : LocalDateTime.now().plusYears(10);
        }
    }
}
