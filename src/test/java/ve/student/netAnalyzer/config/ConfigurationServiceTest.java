package ve.student.netAnalyzer.config;

import ve.student.netAnalyzer.service.ConfigurationServiceImpl;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import ve.student.netAnalyzer.model.ConfigParameter;
import ve.student.netAnalyzer.dto.DbConnectionDto;
import ve.student.netAnalyzer.repository.ConfigParameterRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.springframework.test.util.ReflectionTestUtils;

public class ConfigurationServiceTest {

    @Mock
    private ConfigParameterRepository repository;

    @InjectMocks
    private ConfigurationServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(service, "yamlPath", "build/test-application.yaml");
    }

    @Test
    void testModifyParameter_Success() {
        String key = "testKey";
        String value = "testValue";
        ConfigParameter param = new ConfigParameter();
        param.setNombreConfiguracion(key);

        when(repository.findByNombreConfiguracion(key)).thenReturn(Optional.of(param));
        when(repository.save(any(ConfigParameter.class))).thenAnswer(i -> i.getArguments()[0]);

        ConfigParameter result = service.modifyParameter(key, value);

        assertEquals(key, result.getNombreConfiguracion());
        assertEquals(value, result.getValorSeleccionado());
        verify(repository, times(1)).save(any(ConfigParameter.class));
    }

    @Test
    void testManageDatabaseConnection_ValidConfig() {
        DbConnectionDto dto = new DbConnectionDto("jdbc:mysql://localhost:3306/db", "user", "pass");
        
        service.manageDatabaseConnection(dto);
        
        assertEquals(dto, service.getPersistentDbConfig());
    }
}
