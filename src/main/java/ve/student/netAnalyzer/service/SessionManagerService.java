package ve.student.netAnalyzer.service;

import ve.student.netAnalyzer.model.AnalisisRed;
import ve.student.netAnalyzer.model.AppUser;

public interface SessionManagerService {
    
    // User Session
    void setActiveUser(AppUser user);
    AppUser getActiveUser();
    void clearActiveUser();

    // Analysis Session
    void setActiveAnalysis(AnalisisRed analysis);
    AnalisisRed getActiveAnalysis();
    void clearActiveAnalysis();
}
