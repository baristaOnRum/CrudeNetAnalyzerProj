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
        if (persistentDbConfig != null) {
            return persistentDbConfig;
        }
        DbConnectionDto dto = new DbConnectionDto();
        dto.setUrl(currentUrl);
        dto.setUsername(currentUsername);
        dto.setPassword(currentPassword);
        if (currentUrl != null) {
            if (currentUrl.startsWith("jdbc:postgresql")) {
                dto.setDbType("postgresql");
            } else if (currentUrl.startsWith("jdbc:sqlite")) {
                dto.setDbType("sqlite");
            } else if (currentUrl.startsWith("jdbc:mysql")) {
                dto.setDbType("mysql");
            } else if (currentUrl.startsWith("jdbc:h2")) {
                dto.setDbType("h2");
            }
        }
        return dto;
    }

    @Override
    public ConfigParameter getParameter(String key) {
        return repository.findByNombreConfiguracion(key).orElseGet(() -> {
            ConfigParameter newParam = new ConfigParameter();
            newParam.setNombreConfiguracion(key);
            if (key.equals("CRITICAL_LATENCY_MS")) newParam.setValorSeleccionado("150");
            else if (key.equals("CRITICAL_JITTER_MS")) newParam.setValorSeleccionado("30");
            else newParam.setValorSeleccionado("0");
            return repository.save(newParam);
        });
    }

    @Override
    public ConfigParameter modifyParameter(String key, String value) {
        ConfigParameter param = repository.findByNombreConfiguracion(key).orElse(new ConfigParameter());
        param.setNombreConfiguracion(key);
        param.setValorSeleccionado(value);
        return repository.save(param);
    }

    @Override
    public void manageDatabaseConnection(DbConnectionDto dbConfig) {
        this.persistentDbConfig = dbConfig;
        
        try {
            String dbType = dbConfig.getDbType();
            String url = dbConfig.getUrl();
            
            if (url == null || url.trim().isEmpty()) {
                String host = dbConfig.getHost() != null && !dbConfig.getHost().trim().isEmpty() ? dbConfig.getHost() : "127.0.0.1";
                String port = dbConfig.getPort() != null && !dbConfig.getPort().trim().isEmpty() ? dbConfig.getPort() : "5432";
                String name = dbConfig.getName() != null && !dbConfig.getName().trim().isEmpty() ? dbConfig.getName() : "netanalyzer_db";

                if ("postgresql".equalsIgnoreCase(dbType)) {
                    url = "jdbc:postgresql://" + host + ":" + port + "/" + name;
                } else if ("mysql".equalsIgnoreCase(dbType)) {
                    url = "jdbc:mysql://" + host + ":" + port + "/" + name;
                } else if ("h2".equalsIgnoreCase(dbType)) {
                    url = "jdbc:h2:mem:" + name;
                } else {
                    dbType = "sqlite";
                    url = "jdbc:sqlite:" + name + ".db";
                }
                dbConfig.setUrl(url);
            }

            String driverClass;
            String dialect;

            if (url.startsWith("jdbc:postgresql") || "postgresql".equalsIgnoreCase(dbType)) {
                driverClass = "org.postgresql.Driver";
                dialect = "org.hibernate.dialect.PostgreSQLDialect";
            } else if (url.startsWith("jdbc:mysql") || "mysql".equalsIgnoreCase(dbType)) {
                driverClass = "com.mysql.cj.jdbc.Driver";
                dialect = "org.hibernate.dialect.MySQLDialect";
            } else if (url.startsWith("jdbc:h2") || "h2".equalsIgnoreCase(dbType)) {
                driverClass = "org.h2.Driver";
                dialect = "org.hibernate.dialect.H2Dialect";
            } else {
                driverClass = "org.sqlite.JDBC";
                dialect = "org.hibernate.community.dialect.SQLiteDialect";
            }
            
            StringBuilder yaml = new StringBuilder();
            yaml.append("spring:\n");
            yaml.append("  application:\n");
            yaml.append("    name: netAnalyzer\n");
            yaml.append("  datasource:\n");
            yaml.append("    url: ").append(url).append("\n");
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

    @Override
    public boolean testDatabaseConnection(DbConnectionDto dbConfig) {
        String dbType = dbConfig.getDbType();
        String url = dbConfig.getUrl();
        if (url == null || url.trim().isEmpty()) {
            String host = dbConfig.getHost() != null && !dbConfig.getHost().trim().isEmpty() ? dbConfig.getHost() : "127.0.0.1";
            String port = dbConfig.getPort() != null && !dbConfig.getPort().trim().isEmpty() ? dbConfig.getPort() : "5432";
            String name = dbConfig.getName() != null && !dbConfig.getName().trim().isEmpty() ? dbConfig.getName() : "netanalyzer_db";

            if ("postgresql".equalsIgnoreCase(dbType)) {
                url = "jdbc:postgresql://" + host + ":" + port + "/" + name;
            } else if ("mysql".equalsIgnoreCase(dbType)) {
                url = "jdbc:mysql://" + host + ":" + port + "/" + name;
            } else if ("h2".equalsIgnoreCase(dbType)) {
                url = "jdbc:h2:mem:" + name;
            } else {
                url = "jdbc:sqlite:" + name + ".db";
            }
        }

        try (java.sql.Connection conn = java.sql.DriverManager.getConnection(url, dbConfig.getUsername(), dbConfig.getPassword())) {
            return conn.isValid(5);
        } catch (java.sql.SQLException e) {
            System.err.println("Database test connection failed: " + e.getMessage());
            return false;
        }
    }
}
