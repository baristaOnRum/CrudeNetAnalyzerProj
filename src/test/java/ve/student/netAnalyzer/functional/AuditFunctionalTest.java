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
public class AuditFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testRegisterEvent_Success() throws Exception {
        String eventJson = "{\"nombreAuditoria\":\"LOGIN\",\"detalleCambio\":\"Success\",\"idUsuario\":1}";
        mockMvc.perform(post("/api/audits")
                .contentType(MediaType.APPLICATION_JSON)
                .content(eventJson))
                .andExpect(status().isOk());
    }

    @Test
    public void testListEvents_Pagination() throws Exception {
        mockMvc.perform(get("/api/audits?page=0&size=10")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    public void testExportEvent_AsCsv() throws Exception {
        mockMvc.perform(get("/api/audits/1/export?format=CSV")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
