package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.Event;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.EventDto;
import ve.student.netAnalyzer.dto.EventFilter;
import ve.student.netAnalyzer.repository.EventRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository repository;

    public EventServiceImpl(EventRepository repository) {
        this.repository = repository;
    }

    @Override
    public Event registerEvent(EventDto eventData) {
        Event event = new Event();
        event.setNombreEvento(eventData.getNombreEvento());
        event.setDetalleCambio(eventData.getDetalleCambio());
        event.setIdUsuario(eventData.getIdUsuario());
        return repository.save(event);
    }

    @Override
    public List<Event> listEvents(EventFilter filter) {
        return repository.findAll().stream()
                .filter(e -> filter == null || filter.getNombreEvento() == null || filter.getNombreEvento().equals(e.getNombreEvento()))
                .filter(e -> filter == null || filter.getIdUsuario() == null || filter.getIdUsuario().equals(e.getIdUsuario()))
                .collect(Collectors.toList());
    }

    @Override
    public Event getEventDetails(Integer eventId) {
        return repository.findById(eventId).orElse(null);
    }

    @Override
    public byte[] exportEvent(Integer eventId, ExportFormat fmt) {
        Event event = getEventDetails(eventId);
        if (event == null) return new byte[0];
        
        String content = "Event ID: " + event.getIdSesion() + ", Name: " + event.getNombreEvento() + ", User: " + event.getIdUsuario();
        return content.getBytes();
    }
}
