package ve.student.netAnalyzer.specification;

import org.springframework.data.jpa.domain.Specification;
import ve.student.netAnalyzer.model.Audit;
import ve.student.netAnalyzer.dto.AuditSearchCriteria;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class AuditSpecification {

    public static Specification<Audit> withCriteria(AuditSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getTerm() != null && !criteria.getTerm().isEmpty()) {
                String likeTerm = "%" + criteria.getTerm().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("nombreAuditoria")), likeTerm),
                        cb.like(cb.lower(root.get("detalleCambio")), likeTerm)
                ));
            }

            if (criteria.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaHora"), criteria.getStartDate()));
            }
            if (criteria.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaHora"), criteria.getEndDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
