package ve.student.netAnalyzer;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.repository.UserRepository;

@SpringBootApplication
public class NetAnalyzerApplication {

	public static void main(String[] args) {
		SpringApplication.run(NetAnalyzerApplication.class, args);
	}

	@Bean
	public CommandLineRunner loadData(UserRepository userRepository) {
		return (args) -> {
			if (userRepository.findByNombre("admin").isEmpty()) {
				userRepository.save(new AppUser("admin", "admin", "ADMINISTRADOR (Nivel 4)"));
			}
			if (userRepository.findByNombre("SYS-01-LOCAL").isEmpty()) {
				userRepository.save(new AppUser("SYS-01-LOCAL", "ADMIN-ACCESS-SECRET-KEY", "ANALISTA (Nivel 3)"));
			}
		};
	}
}
