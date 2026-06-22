package ve.student.netAnalyzer.service.impl;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.AnalisisRed;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.service.SessionManagerService;

@Service
public class SessionManagerServiceImpl implements SessionManagerService {

    private AppUser activeUser;
    private AnalisisRed activeAnalysis;

    @Override
    public void setActiveUser(AppUser user) {
        this.activeUser = user;
    }

    @Override
    public AppUser getActiveUser() {
        return this.activeUser;
    }

    @Override
    public void clearActiveUser() {
        this.activeUser = null;
    }

    @Override
    public void setActiveAnalysis(AnalisisRed analysis) {
        this.activeAnalysis = analysis;
    }

    @Override
    public AnalisisRed getActiveAnalysis() {
        return this.activeAnalysis;
    }

    @Override
    public void clearActiveAnalysis() {
        this.activeAnalysis = null;
    }
}
