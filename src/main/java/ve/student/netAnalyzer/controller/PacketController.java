package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.model.Packet;
import ve.student.netAnalyzer.dto.PacketDto;
import ve.student.netAnalyzer.dto.PacketFilter;
import ve.student.netAnalyzer.service.PacketService;
import ve.student.netAnalyzer.service.AuditService;
import ve.student.netAnalyzer.dto.AuditDto;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/packets")

public class PacketController {

    private final PacketService packetService;
    private final AuditService auditService;
    private final ve.student.netAnalyzer.repository.PacketRepository packetRepository;

    public PacketController(PacketService packetService, AuditService auditService, ve.student.netAnalyzer.repository.PacketRepository packetRepository) {
        this.packetService = packetService;
        this.auditService = auditService;
        this.packetRepository = packetRepository;
    }

    @GetMapping
    public ResponseEntity<?> getActivePackets(
            @RequestParam(required = false) Long idAnalisis,
            @RequestParam(required = false, defaultValue = "0") Long sinceId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        
        if (page != null && size != null) {
            // we could support idAnalisis in getPacketsPaginated if needed later, but for now we'll just ignore or we could add it
            if (idAnalisis != null) {
                return ResponseEntity.ok(((ve.student.netAnalyzer.service.PacketServiceImpl)packetService)
                    .getPacketsPaginatedByAnalysis(idAnalisis.intValue(), page, size));
            }
            return ResponseEntity.ok(packetService.getPacketsPaginated(page, size));
        }
        
        PacketFilter filter = new PacketFilter();
        // pass idAnalisis somehow, or use a specific method
        if (idAnalisis != null) {
            return ResponseEntity.ok(((ve.student.netAnalyzer.service.PacketServiceImpl)packetService)
                .listPacketsByAnalysis(idAnalisis.intValue(), sinceId));
        }
        
        return ResponseEntity.ok(packetService.listPackets(filter, sinceId));
    }

    @PostMapping
    public ResponseEntity<Packet> registerPacket(@RequestBody PacketDto dto) {
        return ResponseEntity.ok(packetService.registerPacket(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Packet> getPacketDetails(@PathVariable Long id) {
        Packet packet = packetService.getPacketDetails(id);
        if (packet == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(packet);
    }

    @GetMapping("/export/{sessionId}")
    public ResponseEntity<byte[]> exportSessionPackets(
            @PathVariable Long sessionId,
            @RequestParam ve.student.netAnalyzer.model.ExportFormat format) {
        byte[] data = packetService.exportSessionPackets(sessionId, format);
        
        AuditDto audit = new AuditDto();
        audit.setNombreAuditoria("Exportación de Tramas de Paquetes");
        audit.setDetalleCambio("Se realizó la descarga del registro de paquetes capturados en la sesión #" + sessionId + " en formato " + format.name() + ".");
        audit.setFechaHora(LocalDateTime.now());
        auditService.registerAudit(audit);
        
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=session_" + sessionId + "_packets." + format.name().toLowerCase())
                .body(data);
    }

    @PostMapping("/search")
    public ResponseEntity<org.springframework.data.domain.Page<Packet>> searchPackets(
            @RequestBody ve.student.netAnalyzer.dto.PacketSearchCriteria criteria,
            org.springframework.data.domain.Pageable pageable) {

        org.springframework.data.domain.Sort incomingSort = pageable.getSort();
        List<org.springframework.data.domain.Sort.Order> orders = new java.util.ArrayList<>();

        if (incomingSort.isSorted()) {
            for (org.springframework.data.domain.Sort.Order order : incomingSort) {
                String prop = order.getProperty();
                if ("sourceIp".equalsIgnoreCase(prop)) prop = "fuente";
                else if ("destIp".equalsIgnoreCase(prop)) prop = "destino";
                else if ("protocol".equalsIgnoreCase(prop)) prop = "tipoPaquete";
                else if ("length".equalsIgnoreCase(prop)) prop = "longitud";
                
                orders.add(new org.springframework.data.domain.Sort.Order(order.getDirection(), prop));
            }
        } else {
            orders.add(new org.springframework.data.domain.Sort.Order(org.springframework.data.domain.Sort.Direction.DESC, "timestamp"));
        }

        // Siempre añadir desempate secundario por 'id' para evitar fluctuación/reordenamiento aleatorio de paquetes con igual timestamp
        boolean hasId = orders.stream().anyMatch(o -> o.getProperty().equalsIgnoreCase("id"));
        if (!hasId) {
            org.springframework.data.domain.Sort.Direction primaryDir = orders.isEmpty() ? 
                org.springframework.data.domain.Sort.Direction.DESC : orders.get(0).getDirection();
            orders.add(new org.springframework.data.domain.Sort.Order(primaryDir, "id"));
        }

        org.springframework.data.domain.Pageable deterministicPageable = org.springframework.data.domain.PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            org.springframework.data.domain.Sort.by(orders)
        );

        org.springframework.data.jpa.domain.Specification<Packet> spec = ve.student.netAnalyzer.specification.PacketSpecification.withCriteria(criteria);
        return ResponseEntity.ok(packetRepository.findAll(spec, deterministicPageable));
    }

    @GetMapping("/metadata")
    public ResponseEntity<java.util.Map<String, Object>> getMetadata() {
        java.util.Map<String, Object> meta = new java.util.HashMap<>();
        List<Object[]> results = packetRepository.getGlobalMetadata();
        
        if (results != null && !results.isEmpty() && results.get(0)[0] != null) {
            Object[] row = results.get(0);
            meta.put("minDate", row[0]);
            meta.put("maxDate", row[1]);
            meta.put("minLength", row[2]);
            meta.put("maxLength", row[3]);
            meta.put("minResponseTime", row[4]);
        }
        
        return ResponseEntity.ok(meta);
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> exportFilteredPackets(
            @RequestParam(defaultValue = "CSV") String format,
            @RequestBody ve.student.netAnalyzer.dto.PacketSearchCriteria criteria) {
        try {
            ve.student.netAnalyzer.model.ExportFormat fmt = ve.student.netAnalyzer.model.ExportFormat.valueOf(format.toUpperCase());
            org.springframework.data.jpa.domain.Specification<Packet> spec = ve.student.netAnalyzer.specification.PacketSpecification.withCriteria(criteria);
            List<Packet> packets = packetRepository.findAll(spec);
            
            if (fmt == ve.student.netAnalyzer.model.ExportFormat.PDF) {
                boolean resolveDns = criteria.getResolveDns() == null || criteria.getResolveDns();
                byte[] pdfBytes = ve.student.netAnalyzer.service.impl.PacketExporter.exportListToPdf(packets, resolveDns);
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.add(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=packets.pdf");
                headers.add(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/pdf");
                return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
            }
            
            StringBuilder sb = new StringBuilder();
            if (fmt == ve.student.netAnalyzer.model.ExportFormat.CSV) {
                sb.append("id,tipoPaquete,fuente,destino,tiempoRespuesta,longitud,timestamp,idAnalisis\n");
                for (Packet p : packets) {
                    sb.append(p.getId()).append(",")
                      .append(p.getTipoPaquete() != null ? p.getTipoPaquete() : "").append(",")
                      .append(p.getFuente() != null ? p.getFuente() : "").append(",")
                      .append(p.getDestino() != null ? p.getDestino() : "").append(",")
                      .append(p.getTiempoRespuesta() != null ? p.getTiempoRespuesta() : "").append(",")
                      .append(p.getLongitud() != null ? p.getLongitud() : "").append(",")
                      .append(p.getTimestamp() != null ? p.getTimestamp() : "").append(",")
                      .append(p.getAnalisisRed() != null ? p.getAnalisisRed().getId() : "").append("\n");
                }
            } else if (fmt == ve.student.netAnalyzer.model.ExportFormat.JSON) {
                sb.append("[\n");
                for (int i = 0; i < packets.size(); i++) {
                    Packet p = packets.get(i);
                    sb.append("  {\n")
                      .append("    \"id\": ").append(p.getId()).append(",\n")
                      .append("    \"tipoPaquete\": \"").append(p.getTipoPaquete()).append("\",\n")
                      .append("    \"fuente\": \"").append(p.getFuente()).append("\",\n")
                      .append("    \"destino\": \"").append(p.getDestino()).append("\",\n")
                      .append("    \"tiempoRespuesta\": ").append(p.getTiempoRespuesta()).append(",\n")
                      .append("    \"longitud\": ").append(p.getLongitud()).append(",\n")
                      .append("    \"timestamp\": \"").append(p.getTimestamp()).append("\",\n")
                      .append("    \"idAnalisis\": ").append(p.getAnalisisRed() != null ? p.getAnalisisRed().getId() : "null").append("\n")
                      .append("  }");
                    if (i < packets.size() - 1) sb.append(",");
                    sb.append("\n");
                }
                sb.append("]");
            }
            
            byte[] fileContent = sb.toString().getBytes();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.add(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=packets." + fmt.name().toLowerCase());
            headers.add(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/octet-stream");
            return new ResponseEntity<>(fileContent, headers, org.springframework.http.HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}