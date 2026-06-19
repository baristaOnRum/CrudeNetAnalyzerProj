package ve.student.netAnalyzer.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ve.student.netAnalyzer.model.Event;

public interface EventRepository extends JpaRepository<Event, Integer> {
}
