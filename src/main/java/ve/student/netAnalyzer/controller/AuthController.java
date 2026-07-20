package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.auth.AuthService;
import ve.student.netAnalyzer.auth.Credentials;
import ve.student.netAnalyzer.auth.AuthToken;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthToken> login(@RequestBody Credentials credentials) {
        try {
            AuthToken token = authService.login(credentials);
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody String token) {
        authService.logout(token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/guest")
    public ResponseEntity<AuthToken> loginAsGuest() {
        try {
            AuthToken token = authService.loginAsGuest();
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }
}
