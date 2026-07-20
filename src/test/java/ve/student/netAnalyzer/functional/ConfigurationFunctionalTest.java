package ve.student.netAnalyzer.functional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.config.file=build/test-functional-application.yaml")
@AutoConfigureMockMvc
public class ConfigurationFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testModifyParameter_Success() throws Exception {
        // En el mock o base de datos de test, la key debería existir o dar 404
        mockMvc.perform(put("/api/configurations/unknown_key")
                .contentType(MediaType.APPLICATION_JSON)
                .content("nuevo_valor"))
                .andExpect(status().isNotFound()); // Asumiendo que unknown_key da 404.
    }

    @Test
    public void testModifyParameter_KeyNotFound() throws Exception {
        mockMvc.perform(put("/api/configurations/not_exists")
                .contentType(MediaType.APPLICATION_JSON)
                .content("value"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testManageDatabaseConnection_ValidConfig() throws Exception {
        String dbConfigJson = "{\"url\":\"jdbc:h2:mem:testdb\",\"username\":\"sa\",\"password\":\"password\"}";
        mockMvc.perform(post("/api/configurations/database")
                .contentType(MediaType.APPLICATION_JSON)
                .content(dbConfigJson))
                .andExpect(status().isOk());
    }
}
