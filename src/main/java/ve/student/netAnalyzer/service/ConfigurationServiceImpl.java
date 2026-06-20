package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.ConfigParameter;
import ve.student.netAnalyzer.dto.DbConnectionDto;
import ve.student.netAnalyzer.repository.ConfigParameterRepository;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.io.IOException;

import org.springframework.beans.factory.annotation.Value;

@Service
public class ConfigurationServiceImpl implements ConfigurationService {

    private final ConfigParameterRepository repository;
    private DbConnectionDto persistentDbConfig; // persistent memory for later indexing

    @Value("${spring.datasource.url:}")
    private String currentUrl;

    @Value("${spring.datasource.username:}")
    private String currentUsername;

    @Value("${spring.datasource.password:}")
    private String currentPassword;

    @Value("${app.config.file:src/main/resources/application.yaml}")
    private String yamlPath;

    public ConfigurationServiceImpl(ConfigParameterRepository repository) {
        this.repository = repository;
    }

    @Override
    public DbConnectionDto getCurrentDatabaseConnection() {
        DbConnectionDto dto = new DbConnectionDto();
        dto.setUrl(currentUrl);
        dto.setUsername(currentUsername);
        dto.setPassword(currentPassword);
        return dto;
    }

    @Override
    public ConfigParameter modifyParameter(String key, String value) {
        ConfigParameter param = repository.findByNombreConfiguracion(key)
                .orElse(new ConfigParameter());
        param.setNombreConfiguracion(key);
        param.setValorSeleccionado(value);
        return repository.save(param);
    }

    @Override
    public void manageDatabaseConnection(DbConnectionDto dbConfig) {
        this.persistentDbConfig = dbConfig;
        
        try {
            String driverClass = dbConfig.getUrl() != null && dbConfig.getUrl().startsWith("jdbc:postgresql") 
                    ? "org.postgresql.Driver" : "org.sqlite.JDBC";
            String dialect = dbConfig.getUrl() != null && dbConfig.getUrl().startsWith("jdbc:postgresql") 
                    ? "org.hibernate.dialect.PostgreSQLDialect" : "org.hibernate.community.dialect.SQLiteDialect";
            
            StringBuilder yaml = new StringBuilder();
            yaml.append("spring:\n");
            yaml.append("  application:\n");
            yaml.append("    name: netAnalyzer\n");
            yaml.append("  datasource:\n");
            yaml.append("    url: ").append(dbConfig.getUrl()).append("\n");
            yaml.append("    driver-class-name: ").append(driverClass).append("\n");
            
            if (dbConfig.getUsername() != null && !dbConfig.getUsername().trim().isEmpty()) {
                yaml.append("    username: ").append(dbConfig.getUsername()).append("\n");
            }
            if (dbConfig.getPassword() != null && !dbConfig.getPassword().trim().isEmpty()) {
                yaml.append("    password: ").append(dbConfig.getPassword()).append("\n");
            }
            
            yaml.append("  jpa:\n");
            yaml.append("    hibernate:\n");
            yaml.append("      ddl-auto: update\n");
            yaml.append("    show-sql: true\n");
            yaml.append("    database-platform: ").append(dialect).append("\n");

            Files.writeString(Paths.get(yamlPath), yaml.toString(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            System.out.println("Configuración de base de datos actualizada en application.yaml. Por favor, reinicie la aplicación.");
        } catch (IOException e) {
            e.printStackTrace();
            throw new RuntimeException("No se pudo guardar la configuración de base de datos");
        }
    }

    public DbConnectionDto getPersistentDbConfig() {
        return persistentDbConfig;
    }
}
