package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.ConfigParameter;
import ve.student.netAnalyzer.dto.DbConnectionDto;
import ve.student.netAnalyzer.repository.ConfigParameterRepository;

@Service
public class ConfigurationServiceImpl implements ConfigurationService {

    private final ConfigParameterRepository repository;
    private DbConnectionDto persistentDbConfig; // persistent memory for later indexing

    public ConfigurationServiceImpl(ConfigParameterRepository repository) {
        this.repository = repository;
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
        // Save to persistent memory as requested
        this.persistentDbConfig = dbConfig;
    }

    public DbConnectionDto getPersistentDbConfig() {
        return persistentDbConfig;
    }
}
