package ve.student.netAnalyzer.specification;

import org.springframework.data.jpa.domain.Specification;
import ve.student.netAnalyzer.model.AnalisisRed;
import ve.student.netAnalyzer.dto.AnalysisSearchCriteria;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class AnalysisSpecification {

    public static Specification<AnalisisRed> withCriteria(AnalysisSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getTerm() != null && !criteria.getTerm().isEmpty()) {
                String likeTerm = "%" + criteria.getTerm().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("id").as(String.class)), likeTerm),
                        cb.like(cb.lower(root.get("estado")), likeTerm),
                        cb.like(cb.lower(root.get("interfazId")), likeTerm)
                ));
            }

            if (criteria.getStartDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("fechaEjecucion"), criteria.getStartDate()));
            }
            if (criteria.getEndDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("fechaEjecucion"), criteria.getEndDate()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
