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
    public List<Packet> getActivePackets() {
        return packetService.listPackets(new PacketFilter());
    }

    @PostMapping
    public ResponseEntity<Packet> registerPacket(@RequestBody PacketDto dto) {
        return ResponseEntity.ok(packetService.registerPacket(dto));
    }
}