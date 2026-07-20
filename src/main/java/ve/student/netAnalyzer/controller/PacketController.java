package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.model.Packet;
import ve.student.netAnalyzer.dto.PacketDto;
import ve.student.netAnalyzer.dto.PacketFilter;
import ve.student.netAnalyzer.service.PacketService;

import java.util.List;

@RestController
@RequestMapping("/api/packets")

public class PacketController {

    private final PacketService packetService;

    public PacketController(PacketService packetService) {
        this.packetService = packetService;
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

    @GetMapping("/export/{sessionId}")
    public ResponseEntity<byte[]> exportSessionPackets(
            @PathVariable Long sessionId,
            @RequestParam ve.student.netAnalyzer.model.ExportFormat format) {
        byte[] data = packetService.exportSessionPackets(sessionId, format);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=session_" + sessionId + "_packets." + format.name().toLowerCase())
                .body(data);
    }
}