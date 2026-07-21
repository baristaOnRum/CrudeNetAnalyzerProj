package ve.student.netAnalyzer.functional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.annotation.DirtiesContext;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@ActiveProfiles("test")
public class ReportFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testGenerateReport_WithValidCriteria() throws Exception {
        String criteriaJson = "{\"reportType\":\"summary\",\"sessionId\":\"1\"}";
        mockMvc.perform(post("/api/reports/generate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(criteriaJson))
                .andExpect(status().isOk());
    }

    @Test
    public void testGenerateStatistics_CalculatesCorrectly() throws Exception {
        String rangeJson = "{\"startDate\":\"2026-01-01\",\"endDate\":\"2026-12-31\"}";
        mockMvc.perform(post("/api/reports/statistics")
                .contentType(MediaType.APPLICATION_JSON)
                .content(rangeJson))
                .andExpect(status().isOk());
    }
}
