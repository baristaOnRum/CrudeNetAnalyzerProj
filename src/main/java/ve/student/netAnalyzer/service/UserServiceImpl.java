package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.AppRole;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.dto.UserRegistrationDto;
import ve.student.netAnalyzer.dto.UserUpdateDto;
import ve.student.netAnalyzer.repository.UserRepository;

import java.util.List;
import java.util.Optional;

import ve.student.netAnalyzer.dto.AuditDto;
import java.time.LocalDateTime;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final SessionManagerService sessionManagerService;
    private final AuditService auditService;

    public UserServiceImpl(UserRepository userRepository, SessionManagerService sessionManagerService, AuditService auditService) {
        this.userRepository = userRepository;
        this.sessionManagerService = sessionManagerService;
        this.auditService = auditService;
    }

    @Override
    public List<AppUser> listUsers() {
        return userRepository.findAll();
    }

    @Override
    public AppUser registerUser(UserRegistrationDto userData) {
        if (userRepository.findByNombre(userData.getNombre()).isPresent()) {
            throw new RuntimeException("El usuario ya existe");
        }
        AppUser user = new AppUser(userData.getNombre(), userData.getPassHasheada(), AppRole.valueOf(userData.getRol().toUpperCase()));
        AppUser saved = userRepository.save(user);

        try {
            AuditDto audit = new AuditDto();
            audit.setNombreAuditoria("Registro de Nuevo Usuario");
            audit.setDetalleCambio("Se registró exitosamente el nuevo usuario '" + saved.getNombre() + "' asignando el rol " + saved.getRol().name() + ".");
            audit.setFechaHora(LocalDateTime.now());
            auditService.registerAudit(audit);
        } catch (Exception ignored) {}

        return saved;
    }

    @Override
    public void deleteUser(Long userId) {
        AppUser activeUser = sessionManagerService.getActiveUser();
        if (activeUser != null && activeUser.getId() != null && activeUser.getId().equals(userId)) {
            throw new IllegalStateException("No se puede eliminar la cuenta del usuario con sesión activa en este momento.");
        }
        
        String username = "ID #" + userId;
        Optional<AppUser> existing = userRepository.findById(userId);
        if (existing.isPresent()) {
            username = "'" + existing.get().getNombre() + "'";
        }

        userRepository.deleteById(userId);

        try {
            AuditDto audit = new AuditDto();
            audit.setNombreAuditoria("Eliminación de Cuenta de Usuario");
            audit.setDetalleCambio("Se eliminó permanentemente la cuenta del usuario " + username + " del sistema.");
            audit.setFechaHora(LocalDateTime.now());
            auditService.registerAudit(audit);
        } catch (Exception ignored) {}
    }

    @Override
    public AppUser getUserDetails(Long userId) {
        return userRepository.findById(userId).orElse(null);
    }

    @Override
    public AppUser modifyUser(Long userId, UserUpdateDto newData) {
        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        if (newData.getNombre() != null) {
            user.setNombre(newData.getNombre());
        }
        if (newData.getRol() != null) {
            user.setRol(AppRole.valueOf(newData.getRol().toUpperCase()));
        }
        AppUser saved = userRepository.save(user);

        try {
            AuditDto audit = new AuditDto();
            audit.setNombreAuditoria("Modificación de Datos de Usuario");
            audit.setDetalleCambio("Se actualizaron los datos del usuario '" + saved.getNombre() + "', estableciendo rol " + saved.getRol().name() + ".");
            audit.setFechaHora(LocalDateTime.now());
            auditService.registerAudit(audit);
        } catch (Exception ignored) {}

        return saved;
    }
}
