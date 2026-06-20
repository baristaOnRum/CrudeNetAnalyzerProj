package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.Event;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.EventDto;
import ve.student.netAnalyzer.dto.EventFilter;
import ve.student.netAnalyzer.repository.EventRepository;
import ve.student.netAnalyzer.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository repository;
    private final UserRepository userRepository;

    public EventServiceImpl(EventRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Override
    public Event registerEvent(EventDto eventData) {
        Event event = new Event();
        event.setIdSesion(eventData.getIdSesion());
        event.setNombreEvento(eventData.getNombreEvento());
        event.setDetalleCambio(eventData.getDetalleCambio());
        event.setFechaHora(eventData.getFechaHora());
        
        if (eventData.getIdUsuario() != null) {
            AppUser user = userRepository.findById(eventData.getIdUsuario()).orElse(null);
            event.setUsuario(user);
        }
        
        return repository.save(event);
    }

    @Override
    public List<Event> listEvents(EventFilter filter) {
        return repository.findAll().stream()
                .filter(e -> filter == null || filter.getNombreEvento() == null || filter.getNombreEvento().equals(e.getNombreEvento()))
                .filter(e -> filter == null || filter.getIdUsuario() == null || (e.getUsuario() != null && filter.getIdUsuario().equals(e.getUsuario().getId())))
                .collect(Collectors.toList());
    }

    @Override
    public Event getEventDetails(String eventId) {
        return repository.findById(eventId).orElse(null);
    }

    @Override
    public byte[] exportEvent(String eventId, ExportFormat fmt) {
        Event event = getEventDetails(eventId);
        if (event == null) return new byte[0];
        
        String content = "Event ID: " + event.getIdSesion() + ", Name: " + event.getNombreEvento() + ", User: " + (event.getUsuario() != null ? event.getUsuario().getId() : "null");
        return content.getBytes();
    }
}
