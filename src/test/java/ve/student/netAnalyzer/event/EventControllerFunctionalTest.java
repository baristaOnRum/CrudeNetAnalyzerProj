package ve.student.netAnalyzer.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ve.student.netAnalyzer.dto.EventDto;
import ve.student.netAnalyzer.dto.EventFilter;
import ve.student.netAnalyzer.model.Event;
import ve.student.netAnalyzer.service.EventService;

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
class EventControllerFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EventService eventService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testListEvents() throws Exception {
        Event event = new Event();
        event.setNombreEvento("Test Event");

        when(eventService.listEvents(any(EventFilter.class))).thenReturn(List.of(event));

        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombreEvento").value("Test Event"));
    }

    @Test
    void testRegisterEvent() throws Exception {
        EventDto dto = new EventDto();
        dto.setNombreEvento("Login");

        Event savedEvent = new Event();
        savedEvent.setNombreEvento("Login");

        when(eventService.registerEvent(any(EventDto.class))).thenReturn(savedEvent);

        mockMvc.perform(post("/api/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombreEvento").value("Login"));
    }
}
