package ve.student.netAnalyzer.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.dto.UserRegistrationDto;
import ve.student.netAnalyzer.dto.UserUpdateDto;
import ve.student.netAnalyzer.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/users")

public class UserController {

    private final UserService userService;
    private final ve.student.netAnalyzer.repository.UserRepository userRepository;

    public UserController(UserService userService, ve.student.netAnalyzer.repository.UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<AppUser> listUsers() {
        return userService.listUsers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppUser> getUserDetails(@PathVariable Long id) {
        AppUser user = userService.getUserDetails(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @PostMapping
    public ResponseEntity<AppUser> registerUser(@RequestBody UserRegistrationDto dto) {
        try {
            return ResponseEntity.ok(userService.registerUser(dto));
        } catch(Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<AppUser> modifyUser(@PathVariable Long id, @RequestBody UserUpdateDto dto) {
        return ResponseEntity.ok(userService.modifyUser(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("No se pudo eliminar el usuario porque tiene registros o auditorías vinculadas.");
        }
    }

    @PostMapping("/search")
    public ResponseEntity<org.springframework.data.domain.Page<AppUser>> searchUsers(
            @RequestBody ve.student.netAnalyzer.dto.UserSearchCriteria criteria,
            org.springframework.data.domain.Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<AppUser> spec = ve.student.netAnalyzer.specification.UserSpecification.withCriteria(criteria);
        return ResponseEntity.ok(userRepository.findAll(spec, pageable));
    }
}
