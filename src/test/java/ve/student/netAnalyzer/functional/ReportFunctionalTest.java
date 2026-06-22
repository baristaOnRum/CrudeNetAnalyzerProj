package ve.student.netAnalyzer.functional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ReportFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testGenerateReport_Success() throws Exception {
        String criteriaJson = "{\"reportType\":\"summary\",\"sessionId\":\"1\"}";
        mockMvc.perform(post("/api/reports/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(criteriaJson))
                .andExpect(status().isOk());
    }
}
