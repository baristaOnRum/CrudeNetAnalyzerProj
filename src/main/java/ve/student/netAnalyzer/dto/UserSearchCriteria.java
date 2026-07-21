package ve.student.netAnalyzer.dto;

import ve.student.netAnalyzer.model.AppRole;

public class UserSearchCriteria {
    private String term;
    private AppRole role;

    public String getTerm() {
        return term;
    }

    public void setTerm(String term) {
        this.term = term;
    }

    public AppRole getRole() {
        return role;
    }

    public void setRole(AppRole role) {
        this.role = role;
    }
}
