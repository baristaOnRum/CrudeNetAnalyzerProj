package ve.student.netAnalyzer.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import ve.student.netAnalyzer.dto.UserRegistrationDto;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.service.UserService;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerFunctionalTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testListUsers() throws Exception {
        AppUser user = new AppUser();
        user.setNombre("admin");
        user.setRol(ve.student.netAnalyzer.model.AppRole.ADMIN);
        
        when(userService.listUsers()).thenReturn(List.of(user));

        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nombre").value("admin"))
                .andExpect(jsonPath("$[0].rol").value("ADMIN"));
    }

    @Test
    void testRegisterUser() throws Exception {
        UserRegistrationDto dto = new UserRegistrationDto();
        dto.setNombre("testadmin");
        dto.setPassHasheada("pass");
        dto.setRol("ADMIN");

        AppUser savedUser = new AppUser();
        savedUser.setNombre("nuevo");
        savedUser.setRol(ve.student.netAnalyzer.model.AppRole.ANALYST);

        when(userService.registerUser(any(UserRegistrationDto.class))).thenReturn(savedUser);

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("nuevo"));
    }

    @Test
    void testGetUserDetails_Success() throws Exception {
        AppUser user = new AppUser();
        user.setId(1L);
        user.setNombre("detallesUser");
        user.setRol(ve.student.netAnalyzer.model.AppRole.ANALYST);

        when(userService.getUserDetails(1L)).thenReturn(user);

        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("detallesUser"));
    }
}
