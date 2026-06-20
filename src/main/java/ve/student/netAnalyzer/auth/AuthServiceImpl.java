package ve.student.netAnalyzer.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import ve.student.netAnalyzer.dto.EventDto;
import ve.student.netAnalyzer.service.EventService;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final EventService eventService;
    
    // Simulating an active token store
    private final Set<String> activeTokens = new HashSet<>();

    @Autowired
    public AuthServiceImpl(UserRepository userRepository, EventService eventService) {
        this.userRepository = userRepository;
        this.eventService = eventService;
    }

    @Override
    public AuthToken login(Credentials credentials) {
        if (credentials == null || credentials.getUsername() == null || credentials.getPassword() == null) {
            System.out.println("[AUTH DEBUG] Credentials or fields are null");
            throw new IllegalArgumentException("Credentials cannot be null");
        }

        System.out.println("[AUTH DEBUG] Attempting login for username: '" + credentials.getUsername() + "'");
        Optional<AppUser> userOpt = userRepository.findByNombre(credentials.getUsername());

        if (userOpt.isPresent()) {
            AppUser user = userOpt.get();
            System.out.println("[AUTH DEBUG] User found! Expected password in DB: '" + user.getPassHasheada() + "', Received password: '" + credentials.getPassword() + "'");
            // Comparación simple por ahora (idealmente usar Bcrypt u otro hash fuerte)
            if (credentials.getPassword().equals(user.getPassHasheada())) {
                System.out.println("[AUTH DEBUG] Password match! Generating token.");
                AuthToken token = generateToken(user.getRol());
                
                // RF: Create event for login
                try {
                    EventDto event = new EventDto();
                    event.setNombreEvento("LOGIN");
                    event.setDetalleCambio("Usuario inicio sesion exitosamente");
                    event.setFechaHora(LocalDateTime.now());
                    event.setIdUsuario(user.getId());
                    event.setIdSesion(token.getToken());
                    eventService.registerEvent(event);
                } catch (Exception e) {
                    System.out.println("[AUTH DEBUG] Failed to register login event: " + e.getMessage());
                }

                return token;
            } else {
                System.out.println("[AUTH DEBUG] Password mismatch!");
            }
        } else {
            System.out.println("[AUTH DEBUG] User NOT found in the database!");
        }
        
        throw new RuntimeException("Invalid credentials");
    }

    @Override
    public void logout(String token) {
        if (token != null) {
            activeTokens.remove(token);
        }
    }

    @Override
    public AuthToken loginAsGuest() {
        return generateToken("GUEST");
    }

    private AuthToken generateToken(String role) {
        String tokenString = UUID.randomUUID().toString();
        activeTokens.add(tokenString);
        
        // Default expiration: 1 hour from now
        LocalDateTime expiration = LocalDateTime.now().plusHours(1);
        
        return new AuthToken(tokenString, role, expiration);
    }
    
    // Helper method for tests
    public boolean isTokenActive(String token) {
        return activeTokens.contains(token);
    }
}
