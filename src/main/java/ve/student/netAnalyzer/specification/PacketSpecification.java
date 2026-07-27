package ve.student.netAnalyzer.specification;

import org.springframework.data.jpa.domain.Specification;
import ve.student.netAnalyzer.model.Packet;
import ve.student.netAnalyzer.dto.PacketSearchCriteria;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class PacketSpecification {

    public static Specification<Packet> withCriteria(PacketSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getTerm() != null && !criteria.getTerm().trim().isEmpty()) {
                String rawTerm = criteria.getTerm().trim().toLowerCase().replace("pkt-", "").replace("#", "");
                String likeTerm = "%" + rawTerm + "%";
                List<Predicate> termPredicates = new ArrayList<>();

                try {
                    termPredicates.add(cb.equal(root.get("id"), Integer.parseInt(rawTerm)));
                } catch (NumberFormatException ignored) {}

                termPredicates.add(cb.like(cb.lower(root.get("tipoPaquete")), likeTerm));
                termPredicates.add(cb.like(cb.lower(root.get("fuente")), likeTerm));
                termPredicates.add(cb.like(cb.lower(root.get("destino")), likeTerm));
                termPredicates.add(cb.like(cb.lower(root.get("contenidos")), likeTerm));
                termPredicates.add(cb.like(cb.lower(root.get("respuesta")), likeTerm));

                predicates.add(cb.or(termPredicates.toArray(new Predicate[0])));
            }

            if (criteria.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), criteria.getStartDate()));
            }
            if (criteria.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), criteria.getEndDate()));
            }

            if (criteria.getMinLength() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("longitud"), criteria.getMinLength()));
            }
            if (criteria.getMaxLength() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("longitud"), criteria.getMaxLength()));
            }

            if (criteria.getMinResponseTime() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("tiempoRespuesta"), criteria.getMinResponseTime()));
            }
            if (criteria.getMaxResponseTime() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("tiempoRespuesta"), criteria.getMaxResponseTime()));
            }

            if (criteria.getAnalysisId() != null) {
                predicates.add(cb.equal(root.get("analisisRed").get("id"), criteria.getAnalysisId()));
            }

            if (criteria.getType() != null && !criteria.getType().isEmpty()) {
                predicates.add(cb.equal(root.get("tipoPaquete"), criteria.getType()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
