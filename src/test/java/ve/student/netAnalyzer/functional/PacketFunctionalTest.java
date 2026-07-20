package ve.student.netAnalyzer.functional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class PacketFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testRegisterPacket_Success() throws Exception {
        String packetJson = "{\"tipoPaquete\":\"TCP\",\"contenidos\":\"dummy\",\"fuente\":\"192.168.1.1\",\"destino\":\"192.168.1.2\",\"respuesta\":\"ok\",\"tiempoRespuesta\":10}";
        mockMvc.perform(post("/api/packets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(packetJson))
                .andExpect(status().isOk());
    }

    @Test
    public void testListPackets_WithFilters() throws Exception {
        mockMvc.perform(get("/api/packets?tipoPaquete=TCP")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
