package ve.student.netAnalyzer.program_tests;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ve.student.netAnalyzer.model.NetworkDevice;
import ve.student.netAnalyzer.repository.NetworkDeviceRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class NetworkDeviceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private NetworkDeviceRepository repository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testCreateAndGetAllDevices() throws Exception {
        repository.deleteAll();

        NetworkDevice device = new NetworkDevice("TestRouter", "10.0.0.1", "Router");

        mockMvc.perform(post("/api/devices")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(device)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("TestRouter")))
                .andExpect(jsonPath("$.ipAddress", is("10.0.0.1")));

        mockMvc.perform(get("/api/devices"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("TestRouter")));
    }

    @Test
    void testGetDeviceById() throws Exception {
        repository.deleteAll();
        NetworkDevice device = repository.save(new NetworkDevice("TestSwitch", "10.0.0.2", "Switch"));

        mockMvc.perform(get("/api/devices/" + device.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("TestSwitch")));
    }

    @Test
    void testDeleteDevice() throws Exception {
        repository.deleteAll();
        NetworkDevice device = repository.save(new NetworkDevice("DeleteMe", "10.0.0.3", "Test"));

        mockMvc.perform(delete("/api/devices/" + device.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/devices/" + device.getId()))
                .andExpect(status().isNotFound());
    }
}
