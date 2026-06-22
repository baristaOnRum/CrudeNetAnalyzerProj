package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.Packet;
import ve.student.netAnalyzer.model.AnalisisRed;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.PacketDto;
import ve.student.netAnalyzer.dto.PacketFilter;
import ve.student.netAnalyzer.repository.PacketRepository;
import ve.student.netAnalyzer.repository.AnalisisRedRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PacketServiceImpl implements PacketService {

    private final PacketRepository repository;
    private final AnalisisRedRepository analisisRedRepository;
    private final SessionManagerService sessionManagerService;

    public PacketServiceImpl(PacketRepository repository, AnalisisRedRepository analisisRedRepository, SessionManagerService sessionManagerService) {
        this.repository = repository;
        this.analisisRedRepository = analisisRedRepository;
        this.sessionManagerService = sessionManagerService;
    }

    @Override
    public Packet registerPacket(PacketDto packetData) {
        Packet packet = new Packet();
        packet.setTipoPaquete(packetData.getTipoPaquete());
        packet.setContenidos(packetData.getContenidos());
        packet.setFuente(packetData.getFuente());
        packet.setDestino(packetData.getDestino());
        packet.setRespuesta(packetData.getRespuesta());
        packet.setTiempoRespuesta(packetData.getTiempoRespuesta());
        
        if (packetData.getIdAnalisis() != null) {
            AnalisisRed analisis = analisisRedRepository.findById(packetData.getIdAnalisis()).orElse(null);
            packet.setAnalisisRed(analisis);
        } else if (sessionManagerService.getActiveAnalysis() != null) {
            packet.setAnalisisRed(sessionManagerService.getActiveAnalysis());
        }
        
        return repository.save(packet);
    }

    @Override
    public List<Packet> listPackets(PacketFilter filter) {
        return repository.findAll().stream()
                .filter(p -> filter == null || filter.getTipoPaquete() == null || filter.getTipoPaquete().equals(p.getTipoPaquete()))
                .filter(p -> filter == null || filter.getFuente() == null || filter.getFuente().equals(p.getFuente()))
                .filter(p -> filter == null || filter.getDestino() == null || filter.getDestino().equals(p.getDestino()))
                .collect(Collectors.toList());
    }

    @Override
    public Packet getPacketDetails(Long packetId) {
        return repository.findById(packetId).orElse(null);
    }

    @Override
    public byte[] exportPacket(Long packetId, ExportFormat fmt) {
        Packet packet = getPacketDetails(packetId);
        if (packet == null) return new byte[0];
        
        String content = "Exported " + fmt + " format for packet: " + packet.getId() + "\n" + packet.getContenidos();
        return content.getBytes();
    }
}
