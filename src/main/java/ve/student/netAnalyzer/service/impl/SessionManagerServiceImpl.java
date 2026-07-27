package ve.student.netAnalyzer.service.impl;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.AnalisisRed;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.service.SessionManagerService;

@Service
public class SessionManagerServiceImpl implements SessionManagerService {

    private AppUser activeUser;
    private String userSessionId;
    private AnalisisRed activeAnalysis;
    private ve.student.netAnalyzer.dto.InterfaceDto activeInterface;

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
        this.userSessionId = null;
    }

    @Override
    public void setUserSessionId(String sessionId) {
        this.userSessionId = sessionId;
    }

    @Override
    public String getUserSessionId() {
        return this.userSessionId;
    }

    @Override
    public void clearUserSessionId() {
        this.userSessionId = null;
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

    @Override
    public void setActiveInterface(ve.student.netAnalyzer.dto.InterfaceDto activeInterface) {
        this.activeInterface = activeInterface;
    }

    @Override
    public ve.student.netAnalyzer.dto.InterfaceDto getActiveInterface() {
        return this.activeInterface;
    }
}
