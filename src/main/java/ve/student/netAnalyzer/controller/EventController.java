package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.model.Event;
import ve.student.netAnalyzer.dto.EventDto;
import ve.student.netAnalyzer.dto.EventFilter;
import ve.student.netAnalyzer.service.EventService;

import java.util.List;

@RestController
@RequestMapping("/api/events")

public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public List<Event> listEvents() {
        return eventService.listEvents(new EventFilter());
    }

    @PostMapping
    public ResponseEntity<Event> registerEvent(@RequestBody EventDto dto) {
        return ResponseEntity.ok(eventService.registerEvent(dto));
    }
}
