package ve.student.netAnalyzer.packet;

import ve.student.netAnalyzer.service.PacketServiceImpl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import ve.student.netAnalyzer.model.Packet;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.PacketDto;
import ve.student.netAnalyzer.dto.PacketFilter;
import ve.student.netAnalyzer.repository.PacketRepository;
import ve.student.netAnalyzer.repository.AnalisisRedRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class PacketServiceTest {

    @Mock
    private PacketRepository repository;

    @Mock
    private AnalisisRedRepository analisisRedRepository;

    @InjectMocks
    private PacketServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegisterPacket_Success() {
        PacketDto dto = new PacketDto();
        dto.setTipoPaquete("TCP");
        
        when(repository.save(any(Packet.class))).thenAnswer(i -> {
            Packet p = i.getArgument(0);
            p.setId(1L);
            return p;
        });

        Packet result = service.registerPacket(dto);
        assertNotNull(result.getId());
        assertEquals("TCP", result.getTipoPaquete());
        verify(repository, times(1)).save(any(Packet.class));
    }

    @Test
    void testListPackets_WithFilters() {
        Packet p1 = new Packet(); p1.setTipoPaquete("TCP");
        Packet p2 = new Packet(); p2.setTipoPaquete("UDP");
        
        when(repository.findAll()).thenReturn(Arrays.asList(p1, p2));
        
        PacketFilter filter = new PacketFilter();
        filter.setTipoPaquete("TCP");
        
        List<Packet> result = service.listPackets(filter);
        assertEquals(1, result.size());
        assertEquals("TCP", result.get(0).getTipoPaquete());
    }

    @Test
    void testGetPacketDetails_Success() {
        Packet p1 = new Packet(); p1.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(p1));
        
        Packet result = service.getPacketDetails(1L);
        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void testExportPacket_AsPcap() {
        Packet p1 = new Packet(); p1.setId(1L); p1.setContenidos("DATA");
        when(repository.findById(1L)).thenReturn(Optional.of(p1));
        
        byte[] result = service.exportPacket(1L, ExportFormat.PCAP);
        assertTrue(result.length > 0);
        String strResult = new String(result);
        assertTrue(strResult.contains("PCAP"));
        assertTrue(strResult.contains("DATA"));
    }
}
