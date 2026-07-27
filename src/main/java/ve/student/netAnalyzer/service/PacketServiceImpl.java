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
    public org.springframework.data.domain.Page<Packet> getPacketsPaginated(int page, int size) {
        return repository.findAll(org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id")));
    }

    public org.springframework.data.domain.Page<Packet> getPacketsPaginatedByAnalysis(int analysisId, int page, int size) {
        return repository.findByAnalisisRedId(analysisId, org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id")));
    }

    public List<Packet> listPacketsByAnalysis(int analysisId, Long sinceId) {
        return repository.findTop1500ByAnalisisRedIdAndIdGreaterThanOrderByIdAsc(analysisId, sinceId);
    }

    @Override
    public List<Packet> listPackets(PacketFilter filter) {
        return listPackets(filter, 0L);
    }

    @Override
    public List<Packet> listPackets(PacketFilter filter, Long sinceId) {
        List<Packet> packets;
        if (sessionManagerService.getActiveAnalysis() != null) {
            packets = repository.findByAnalisisRedIdAndIdGreaterThan(sessionManagerService.getActiveAnalysis().getId(), sinceId);
        } else {
            packets = repository.findByIdGreaterThan(sinceId);
        }
        
        return packets.stream()
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
    public byte[] exportSessionPackets(Long sessionId, ExportFormat fmt) {
        List<Packet> packets = repository.findByAnalisisRedId(sessionId.intValue());
        if (packets.isEmpty()) return new byte[0];
        
        StringBuilder sb = new StringBuilder();
        if (fmt == ExportFormat.CSV) {
            sb.append("id,tipoPaquete,fuente,destino,contenidos\n");
            for (Packet p : packets) {
                sb.append(p.getId()).append(",")
                  .append(p.getTipoPaquete()).append(",")
                  .append(p.getFuente()).append(",")
                  .append(p.getDestino()).append(",")
                  .append(p.getContenidos()).append("\n");
            }
        } else if (fmt == ExportFormat.JSON) {
            sb.append("[\n");
            for (int i = 0; i < packets.size(); i++) {
                Packet p = packets.get(i);
                sb.append("  {\n")
                  .append("    \"id\": ").append(p.getId()).append(",\n")
                  .append("    \"tipoPaquete\": \"").append(p.getTipoPaquete()).append("\",\n")
                  .append("    \"fuente\": \"").append(p.getFuente()).append("\",\n")
                  .append("    \"destino\": \"").append(p.getDestino()).append("\",\n")
                  .append("    \"contenidos\": \"").append(p.getContenidos()).append("\"\n")
                  .append("  }");
                if (i < packets.size() - 1) sb.append(",");
                sb.append("\n");
            }
            sb.append("]");
        } else {
            sb.append("Formato no soportado aún para exportación masiva: ").append(fmt);
        }
        return sb.toString().getBytes();
    }
}
