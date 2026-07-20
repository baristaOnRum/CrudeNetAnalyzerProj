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

    public UserController(UserService userService) {
        this.userService = userService;
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
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
}
