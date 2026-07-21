package ve.student.netAnalyzer.specification;

import org.springframework.data.jpa.domain.Specification;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.dto.UserSearchCriteria;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<AppUser> withCriteria(UserSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getTerm() != null && !criteria.getTerm().isEmpty()) {
                String likeTerm = "%" + criteria.getTerm().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("nombre")), likeTerm));
            }

            if (criteria.getRole() != null) {
                predicates.add(cb.equal(root.get("rol"), criteria.getRole()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
