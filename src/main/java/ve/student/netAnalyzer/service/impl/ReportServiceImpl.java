package ve.student.netAnalyzer.service.impl;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.dto.DateRange;
import ve.student.netAnalyzer.dto.Report;
import ve.student.netAnalyzer.dto.ReportCriteria;
import ve.student.netAnalyzer.dto.Statistics;
import ve.student.netAnalyzer.service.ReportService;
import ve.student.netAnalyzer.repository.PacketRepository;
import ve.student.netAnalyzer.model.Packet;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
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

        String reportContent = "Reporte analítico generado para " + packets.size() + " paquetes interceptados.";
        if (criteria.getFilterOptions() != null && !criteria.getFilterOptions().isEmpty()) {
            reportContent += " Filtros aplicados: " + criteria.getFilterOptions();
        }
        String date = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        
        return new Report("REP-" + System.currentTimeMillis(), "Reporte de Análisis de Red", date, reportContent);
    }

    @Override
    public Statistics generateStatistics(DateRange range) {
        List<Packet> packets;
        if (range != null && range.getStartDate() != null && range.getEndDate() != null) {
            LocalDateTime start = parseDate(range.getStartDate(), true);
            LocalDateTime end = parseDate(range.getEndDate(), false);
            packets = packetRepository.findByAnalisisRedFechaEjecucionBetween(start, end);
        } else {
            packets = packetRepository.findAll();
        }
        
        long total = packets.size();
        if (total == 0) return new Statistics(0L, 0.0, "N/A");
        
        double avgSize = packets.stream()
                .mapToInt(p -> p.getContenidos() != null ? p.getContenidos().length() : 0)
                .average()
                .orElse(0.0);
                
        String topProtocol = packets.stream()
                .filter(p -> p.getTipoPaquete() != null)
                .collect(Collectors.groupingBy(Packet::getTipoPaquete, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
                
        return new Statistics(total, avgSize, topProtocol);
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
