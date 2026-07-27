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

            if (criteria.getTerm() != null && !criteria.getTerm().trim().isEmpty()) {
                String term = criteria.getTerm().trim().replace("#", "");
                List<Predicate> termPredicates = new ArrayList<>();

                try {
                    termPredicates.add(cb.equal(root.get("id"), Integer.parseInt(term)));
                } catch (NumberFormatException ignored) {}

                termPredicates.add(cb.like(cb.toString(root.get("id")), "%" + term + "%"));

                predicates.add(cb.or(termPredicates.toArray(new Predicate[0])));
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
