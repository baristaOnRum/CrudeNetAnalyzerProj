package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.auth.AuthService;
import ve.student.netAnalyzer.auth.Credentials;
import ve.student.netAnalyzer.auth.AuthToken;
import ve.student.netAnalyzer.service.AuditService;
import ve.student.netAnalyzer.dto.AuditDto;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private final AuthService authService;
    private final AuditService auditService;

    public AuthController(AuthService authService, AuditService auditService) {
        this.authService = authService;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthToken> login(@RequestBody Credentials credentials) {
        try {
            AuthToken token = authService.login(credentials);
            
            AuditDto audit = new AuditDto();
            audit.setNombreAuditoria("Inicio de Sesión de Usuario");
            audit.setDetalleCambio("El usuario '" + credentials.getUsername() + "' ha ingresado exitosamente al sistema.");
            audit.setFechaHora(LocalDateTime.now());
            auditService.registerAudit(audit);
            
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
            
            AuditDto audit = new AuditDto();
            audit.setNombreAuditoria("Acceso de Usuario Invitado");
            audit.setDetalleCambio("Un usuario ingresó al sistema con perfil de Observador (Invitado).");
            audit.setFechaHora(LocalDateTime.now());
            auditService.registerAudit(audit);
            
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }
}
