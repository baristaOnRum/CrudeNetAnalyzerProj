package ve.student.netAnalyzer;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import ve.student.netAnalyzer.model.AppRole;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.repository.UserRepository;

@SpringBootApplication
public class NetAnalyzerApplication {

	public static void main(String[] args) {
		SpringApplication.run(NetAnalyzerApplication.class, args);
	}

}
