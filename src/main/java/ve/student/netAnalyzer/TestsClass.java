package ve.student.netAnalyzer;

import com.fasterxml.jackson.databind.ObjectMapper;
import ve.student.netAnalyzer.model.NetworkDevice; // Cambia por tu modelo
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.is;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // Hace que use el application-test.properties
@Transactional // Revierte los cambios en la BD al finalizar cada @Test

public class TestsClass {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private NetworkDevice dispositivoDePrueba;

    @BeforeEach
    void setUp() {
        dispositivoDePrueba = new NetworkDevice();
        dispositivoDePrueba.setName("Dispositivo de Red");
        dispositivoDePrueba.setType("Router");
    }

    @Test
    @DisplayName("CP-01: Validar la creación exitosa de un componente")
    void crearComponenteTest() throws Exception {
        mockMvc.perform(post("/api/network-devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dispositivoDePrueba)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Dispositivo de Red")));
    }

    @Test
    @DisplayName("CP-02: Validar respuesta 404 al buscar un recurso inexistente")
    void buscarInexistenteTest() throws Exception {
        mockMvc.perform(get("/api/network-devices/999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
