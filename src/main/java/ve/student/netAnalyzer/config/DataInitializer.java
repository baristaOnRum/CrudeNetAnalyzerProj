package ve.student.netAnalyzer.config;

import ve.student.netAnalyzer.model.AppRole;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Optional;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository) {
        return args -> {
            Optional<AppUser> adminOpt = userRepository.findAll().stream()
                    .filter(u -> "admin".equals(u.getNombre()))
                    .findFirst();

            if (adminOpt.isEmpty()) {
                AppUser admin = new AppUser();
                admin.setNombre("admin");
                admin.setPassHasheada("123456"); // En un caso real se usaría BCrypt
                admin.setRol(AppRole.ADMIN);
                userRepository.save(admin);
                System.out.println("Usuario 'admin' creado exitosamente.");
            } else {
                System.out.println("Usuario 'admin' ya existe en la base de datos.");
            }

            Optional<AppUser> guestOpt = userRepository.findAll().stream()
                    .filter(u -> "guest".equals(u.getNombre()))
                    .findFirst();

            if (guestOpt.isEmpty()) {
                AppUser guest = new AppUser();
                guest.setNombre("guest");
                guest.setPassHasheada("guest"); // Contraseña genérica para el invitado
                guest.setRol(AppRole.VIEWER);
                userRepository.save(guest);
                System.out.println("Usuario 'guest' creado exitosamente.");
            } else {
                System.out.println("Usuario 'guest' ya existe en la base de datos.");
            }
        };
    }
}
