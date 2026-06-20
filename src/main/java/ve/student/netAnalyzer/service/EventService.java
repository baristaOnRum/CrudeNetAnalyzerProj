package ve.student.netAnalyzer.service;

import ve.student.netAnalyzer.model.Event;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.EventDto;
import ve.student.netAnalyzer.dto.EventFilter;

import java.util.List;

public interface EventService {
    Event registerEvent(EventDto eventData);
    List<Event> listEvents(EventFilter filter);
    Event getEventDetails(String eventId);
    byte[] exportEvent(String eventId, ExportFormat fmt);
}
