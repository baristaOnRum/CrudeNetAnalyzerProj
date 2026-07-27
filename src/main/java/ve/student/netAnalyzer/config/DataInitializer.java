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
            // 1. adminprueba
            Optional<AppUser> adminOpt = userRepository.findByNombre("adminprueba");
            if (adminOpt.isEmpty()) {
                AppUser admin = new AppUser();
                admin.setNombre("adminprueba");
                admin.setPassHasheada("bandidito10");
                admin.setRol(AppRole.ADMINISTRADOR);
                userRepository.save(admin);
                System.out.println("Usuario 'adminprueba' creado exitosamente.");
            }

            // 2. admin
            Optional<AppUser> admin2Opt = userRepository.findByNombre("admin");
            if (admin2Opt.isEmpty()) {
                AppUser admin2 = new AppUser();
                admin2.setNombre("admin");
                admin2.setPassHasheada("bandidito10");
                admin2.setRol(AppRole.ADMINISTRADOR);
                userRepository.save(admin2);
                System.out.println("Usuario 'admin' creado exitosamente.");
            }

            // 3. analistaprueba
            Optional<AppUser> analistaOpt = userRepository.findByNombre("analistaprueba");
            if (analistaOpt.isEmpty()) {
                AppUser analista = new AppUser();
                analista.setNombre("analistaprueba");
                analista.setPassHasheada("bandidito10");
                analista.setRol(AppRole.ANALISTA);
                userRepository.save(analista);
                System.out.println("Usuario 'analistaprueba' creado exitosamente.");
            }

            // 4. guest
            Optional<AppUser> guestOpt = userRepository.findByNombre("guest");
            if (guestOpt.isEmpty()) {
                AppUser guest = new AppUser();
                guest.setNombre("guest");
                guest.setPassHasheada("guest");
                guest.setRol(AppRole.OBSERVADOR);
                userRepository.save(guest);
                System.out.println("Usuario 'guest' creado exitosamente.");
            }
        };
    }
}
