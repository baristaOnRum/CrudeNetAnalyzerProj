package ve.student.netAnalyzer.packet;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ve.student.netAnalyzer.dto.PacketDto;
import ve.student.netAnalyzer.dto.PacketFilter;
import ve.student.netAnalyzer.model.Packet;
import ve.student.netAnalyzer.service.PacketService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PacketControllerFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PacketService packetService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetActivePackets() throws Exception {
        Packet packet = new Packet();
        packet.setTipoPaquete("TCP");
        packet.setFuente("192.168.0.1");

        when(packetService.listPackets(any(PacketFilter.class), any(Long.class))).thenReturn(List.of(packet));

        mockMvc.perform(get("/api/packets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tipoPaquete").value("TCP"))
                .andExpect(jsonPath("$[0].fuente").value("192.168.0.1"));
    }

    @Test
    void testRegisterPacket() throws Exception {
        PacketDto dto = new PacketDto();
        dto.setTipoPaquete("UDP");

        Packet savedPacket = new Packet();
        savedPacket.setTipoPaquete("UDP");

        when(packetService.registerPacket(any(PacketDto.class))).thenReturn(savedPacket);

        mockMvc.perform(post("/api/packets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoPaquete").value("UDP"));
    }

    @Test
    void testGetPacketDetails() throws Exception {
        Packet packet = new Packet();
        packet.setId(1L);
        packet.setTipoPaquete("ICMP");
        
        when(packetService.getPacketDetails(1L)).thenReturn(packet);
        
        mockMvc.perform(get("/api/packets/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipoPaquete").value("ICMP"));
                
        mockMvc.perform(get("/api/packets/999"))
                .andExpect(status().isNotFound());
    }
}
