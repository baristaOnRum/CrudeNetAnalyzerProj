package ve.student.netAnalyzer.service;

import ve.student.netAnalyzer.model.Packet;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.PacketDto;
import ve.student.netAnalyzer.dto.PacketFilter;

import java.util.List;

public interface PacketService {
    Packet registerPacket(PacketDto packetData);
    List<Packet> listPackets(PacketFilter filter);
    List<Packet> listPackets(PacketFilter filter, Long sinceId);
    org.springframework.data.domain.Page<Packet> getPacketsPaginated(int page, int size);
    Packet getPacketDetails(Long packetId);
    byte[] exportSessionPackets(Long sessionId, ExportFormat fmt);
}
