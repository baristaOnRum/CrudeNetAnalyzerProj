package ve.student.netAnalyzer.service;

import ve.student.netAnalyzer.model.ConfigParameter;
import ve.student.netAnalyzer.dto.DbConnectionDto;

public interface ConfigurationService {
    ConfigParameter getParameter(String key);
    ConfigParameter modifyParameter(String key, String value);
    void manageDatabaseConnection(DbConnectionDto dbConfig);
    DbConnectionDto getCurrentDatabaseConnection();
    boolean testDatabaseConnection(DbConnectionDto dbConfig);
}
