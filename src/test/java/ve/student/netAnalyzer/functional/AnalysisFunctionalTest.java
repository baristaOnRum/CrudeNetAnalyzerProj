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
public class AnalysisFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testAnalyzePacketsOnInterface_Success() throws Exception {
        // En AnalysisService, registerNetworkInterface asume la misma lógica de interface para captura? 
        // Viendo el AnalysisController no hay un endpoint exacto para analyzePacketsOnInterface.
        // Pero /api/analysis/interface parece ser el equivalente.
        String interfaceJson = "{\"interfaceId\":\"eth0\",\"name\":\"Ethernet\",\"status\":\"UP\"}";
        mockMvc.perform(post("/api/analysis/interface")
                .contentType(MediaType.APPLICATION_JSON)
                .content(interfaceJson))
                .andExpect(status().isOk());
    }

    @Test
    public void testRegisterNetworkInterface_ValidData() throws Exception {
        String interfaceJson = "{\"interfaceId\":\"eth1\",\"name\":\"Ethernet 1\",\"status\":\"UP\"}";
        mockMvc.perform(post("/api/analysis/interface")
                .contentType(MediaType.APPLICATION_JSON)
                .content(interfaceJson))
                .andExpect(status().isOk());
    }

    @Test
    public void testListAnalyses_ReturnsList() throws Exception {
        mockMvc.perform(get("/api/analysis")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    public void testLoadAnalysis_NotFound() throws Exception {
        mockMvc.perform(get("/api/analysis/999999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound()); // El servicio lanza RuntimeException si el ID no existe, el controlador responde 404.
    }
}
