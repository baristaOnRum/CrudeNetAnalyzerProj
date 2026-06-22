package ve.student.netAnalyzer.audit;

import ve.student.netAnalyzer.service.AuditServiceImpl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import ve.student.netAnalyzer.model.Audit;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.AuditDto;
import ve.student.netAnalyzer.dto.AuditFilter;
import ve.student.netAnalyzer.repository.AuditRepository;
import ve.student.netAnalyzer.repository.UserRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class AuditServiceTest {

    @Mock
    private AuditRepository repository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuditServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegisterAudit_Success() {
        AuditDto dto = new AuditDto();
        dto.setIdSesion("SES-001");
        dto.setNombreAuditoria("LOGIN");
        dto.setIdUsuario(1L);
        
        AppUser mockUser = new AppUser();
        mockUser.setId(1L);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(repository.save(any(Audit.class))).thenAnswer(i -> i.getArgument(0));

        Audit result = service.registerAudit(dto);
        assertEquals("SES-001", result.getIdSesion());
        assertEquals("LOGIN", result.getNombreAuditoria());
        assertNotNull(result.getUsuario());
        verify(repository, times(1)).save(any(Audit.class));
    }

    @Test
    void testListAudits_Pagination() {
        Audit e1 = new Audit(); e1.setNombreAuditoria("LOGIN");
        Audit e2 = new Audit(); e2.setNombreAuditoria("LOGOUT");
        
        when(repository.findAll()).thenReturn(Arrays.asList(e1, e2));
        
        AuditFilter filter = new AuditFilter();
        filter.setNombreAuditoria("LOGIN");
        
        List<Audit> result = service.listAudits(filter);
        assertEquals(1, result.size());
        assertEquals("LOGIN", result.get(0).getNombreAuditoria());
    }

    @Test
    void testExportAudit_AsCsv() {
        Audit e1 = new Audit(); e1.setIdSesion("SES-1"); e1.setNombreAuditoria("TEST");
        when(repository.findById("SES-1")).thenReturn(Optional.of(e1));
        
        byte[] result = service.exportAudit("SES-1", ExportFormat.CSV);
        assertTrue(result.length > 0);
        String strResult = new String(result);
        assertTrue(strResult.contains("TEST"));
    }
}
