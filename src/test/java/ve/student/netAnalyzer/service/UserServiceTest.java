package ve.student.netAnalyzer.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.dto.UserRegistrationDto;
import ve.student.netAnalyzer.dto.UserUpdateDto;
import ve.student.netAnalyzer.repository.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UserServiceTest {

    @Mock
    private UserRepository repository;

    @InjectMocks
    private UserServiceImpl service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegisterUser_Success() {
        UserRegistrationDto dto = new UserRegistrationDto();
        dto.setNombre("nuevoUser");
        dto.setPassHasheada("pass123");
        dto.setRol("USER");

        when(repository.findByNombre("nuevoUser")).thenReturn(Optional.empty());
        when(repository.save(any(AppUser.class))).thenAnswer(i -> {
            AppUser u = i.getArgument(0);
            u.setId(1L);
            return u;
        });

        AppUser result = service.registerUser(dto);
        assertNotNull(result.getId());
        assertEquals("nuevoUser", result.getNombre());
    }

    @Test
    void testRegisterUser_EmailAlreadyExists() {
        UserRegistrationDto dto = new UserRegistrationDto();
        dto.setNombre("existeUser");

        when(repository.findByNombre("existeUser")).thenReturn(Optional.of(new AppUser()));

        assertThrows(RuntimeException.class, () -> service.registerUser(dto));
    }

    @Test
    void testDeleteUser_Success() {
        service.deleteUser(1L);
        verify(repository, times(1)).deleteById(1L);
    }

    @Test
    void testModifyUser_UpdatesFields() {
        AppUser user = new AppUser("user1", "pass", "USER");
        user.setId(1L);

        when(repository.findById(1L)).thenReturn(Optional.of(user));
        when(repository.save(any(AppUser.class))).thenAnswer(i -> i.getArgument(0));

        UserUpdateDto dto = new UserUpdateDto();
        dto.setNombre("user2");
        dto.setRol("ADMIN");

        AppUser result = service.modifyUser(1L, dto);

        assertEquals("user2", result.getNombre());
        assertEquals("ADMIN", result.getRol());
        verify(repository, times(1)).save(any(AppUser.class));
    }
}
