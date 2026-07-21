package ve.student.netAnalyzer.functional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testLogin_Success() throws Exception {
        String adminJson = "{\"nombre\":\"admin\",\"passHasheada\":\"123456\",\"rol\":\"ADMIN\"}";
        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(adminJson));
                
        String loginJson = "{\"username\":\"admin\",\"password\":\"123456\"}";
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk());
    }

    @Test
    public void testLogin_InvalidCredentials() throws Exception {
        String loginJson = "{\"username\":\"admin\",\"password\":\"wrongpass\"}";
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testLogout_Success() throws Exception {
        String token = "dummy-token";
        mockMvc.perform(post("/api/auth/logout")
                .contentType(MediaType.TEXT_PLAIN)
                .content(token))
                .andExpect(status().isOk());
    }

    @Test
    public void testLoginAsGuest_Success() throws Exception {
        mockMvc.perform(post("/api/auth/guest"))
                .andExpect(status().isOk());
    }
}
