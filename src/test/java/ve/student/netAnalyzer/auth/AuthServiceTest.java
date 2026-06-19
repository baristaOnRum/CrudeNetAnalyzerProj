package ve.student.netAnalyzer.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.repository.UserRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private AuthServiceImpl authService;
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        authService = new AuthServiceImpl(userRepository);
    }

    @Test
    void testLogin_Success() {
        Credentials creds = new Credentials("admin", "admin123");
        AppUser mockUser = new AppUser("admin", "admin123", "ADMIN");
        when(userRepository.findByNombre("admin")).thenReturn(Optional.of(mockUser));

        AuthToken token = authService.login(creds);
        
        assertNotNull(token);
        assertNotNull(token.getToken());
        assertEquals("ADMIN", token.getRole());
        assertTrue(authService.isTokenActive(token.getToken()));
    }

    @Test
    void testLogin_InvalidCredentials() {
        Credentials creds = new Credentials("admin", "wrongpassword");
        AppUser mockUser = new AppUser("admin", "admin123", "ADMIN");
        when(userRepository.findByNombre("admin")).thenReturn(Optional.of(mockUser));
        
        Exception exception = assertThrows(RuntimeException.class, () -> {
            authService.login(creds);
        });
        
        assertEquals("Invalid credentials", exception.getMessage());
    }

    @Test
    void testLogout_Success() {
        // First login to get a valid token
        Credentials creds = new Credentials("user", "user123");
        AppUser mockUser = new AppUser("user", "user123", "USER");
        when(userRepository.findByNombre("user")).thenReturn(Optional.of(mockUser));

        AuthToken token = authService.login(creds);
        
        assertTrue(authService.isTokenActive(token.getToken()));
        
        // Now logout
        authService.logout(token.getToken());
        
        assertFalse(authService.isTokenActive(token.getToken()));
    }

    @Test
    void testLoginAsGuest_Success() {
        AuthToken token = authService.loginAsGuest();
        
        assertNotNull(token);
        assertNotNull(token.getToken());
        assertEquals("GUEST", token.getRole());
        assertTrue(authService.isTokenActive(token.getToken()));
    }
}
