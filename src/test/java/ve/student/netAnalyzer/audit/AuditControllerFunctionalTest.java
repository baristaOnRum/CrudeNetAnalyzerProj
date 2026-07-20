package ve.student.netAnalyzer.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ve.student.netAnalyzer.dto.AuditDto;
import ve.student.netAnalyzer.dto.AuditFilter;
import ve.student.netAnalyzer.model.Audit;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.service.AuditService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@AutoConfigureMockMvc
class AuditControllerFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuditService auditService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testListAudits() throws Exception {
        Audit audit = new Audit();
        audit.setNombreAuditoria("Test Audit");

        when(auditService.listAudits(any(AuditFilter.class))).thenReturn(List.of(audit));

        mockMvc.perform(get("/api/audits"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombreAuditoria").value("Test Audit"));
    }

    @Test
    void testRegisterAudit() throws Exception {
        AuditDto dto = new AuditDto();
        dto.setNombreAuditoria("Login");

        Audit savedAudit = new Audit();
        savedAudit.setNombreAuditoria("Login");

        when(auditService.registerAudit(any(AuditDto.class))).thenReturn(savedAudit);

        mockMvc.perform(post("/api/audits")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreAuditoria").value("Login"));
    }

    @Test
    void testGetAuditDetails_Success() throws Exception {
        Audit audit = new Audit();
        audit.setIdSesion("session-123");
        audit.setNombreAuditoria("Evento Detalle");

        when(auditService.getAuditDetails("session-123")).thenReturn(audit);

        mockMvc.perform(get("/api/audits/session-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreAuditoria").value("Evento Detalle"));
    }

    @Test
    void testExportAudit_Success() throws Exception {
        byte[] fakeCsv = "Audit ID: session-123, Name: Evento Detalle, User: null".getBytes();

        when(auditService.exportAudit("session-123", ExportFormat.CSV)).thenReturn(fakeCsv);

        mockMvc.perform(get("/api/audits/session-123/export?format=csv"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "attachment; filename=audit_session-123.csv"))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().bytes(fakeCsv));
    }
}
