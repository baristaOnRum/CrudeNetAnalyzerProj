package ve.student.netAnalyzer.event;

import ve.student.netAnalyzer.service.EventServiceImpl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import ve.student.netAnalyzer.model.Event;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.EventDto;
import ve.student.netAnalyzer.dto.EventFilter;
import ve.student.netAnalyzer.repository.EventRepository;
import ve.student.netAnalyzer.repository.UserRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class EventServiceTest {

    @Mock
    private EventRepository repository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EventServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegisterEvent_Success() {
        EventDto dto = new EventDto();
        dto.setIdSesion("SES-001");
        dto.setNombreEvento("LOGIN");
        dto.setIdUsuario(1L);
        
        AppUser mockUser = new AppUser();
        mockUser.setId(1L);
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(repository.save(any(Event.class))).thenAnswer(i -> i.getArgument(0));

        Event result = service.registerEvent(dto);
        assertEquals("SES-001", result.getIdSesion());
        assertEquals("LOGIN", result.getNombreEvento());
        assertNotNull(result.getUsuario());
        verify(repository, times(1)).save(any(Event.class));
    }

    @Test
    void testListEvents_Pagination() {
        Event e1 = new Event(); e1.setNombreEvento("LOGIN");
        Event e2 = new Event(); e2.setNombreEvento("LOGOUT");
        
        when(repository.findAll()).thenReturn(Arrays.asList(e1, e2));
        
        EventFilter filter = new EventFilter();
        filter.setNombreEvento("LOGIN");
        
        List<Event> result = service.listEvents(filter);
        assertEquals(1, result.size());
        assertEquals("LOGIN", result.get(0).getNombreEvento());
    }

    @Test
    void testExportEvent_AsCsv() {
        Event e1 = new Event(); e1.setIdSesion("SES-1"); e1.setNombreEvento("TEST");
        when(repository.findById("SES-1")).thenReturn(Optional.of(e1));
        
        byte[] result = service.exportEvent("SES-1", ExportFormat.CSV);
        assertTrue(result.length > 0);
        String strResult = new String(result);
        assertTrue(strResult.contains("TEST"));
    }
}
