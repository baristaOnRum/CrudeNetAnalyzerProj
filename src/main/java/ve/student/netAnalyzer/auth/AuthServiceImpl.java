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

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    
    // Simulating an active token store
    private final Set<String> activeTokens = new HashSet<>();

    @Autowired
    public AuthServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public AuthToken login(Credentials credentials) {
        if (credentials == null || credentials.getUsername() == null || credentials.getPassword() == null) {
            throw new IllegalArgumentException("Credentials cannot be null");
        }

        Optional<AppUser> userOpt = userRepository.findByUsuario(credentials.getUsername());

        if (userOpt.isPresent()) {
            AppUser user = userOpt.get();
            // Comparación simple por ahora (idealmente usar Bcrypt u otro hash fuerte)
            if (credentials.getPassword().equals(user.getPassHasheada())) {
                return generateToken(user.getRol());
            }
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
