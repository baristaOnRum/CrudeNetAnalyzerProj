package ve.student.netAnalyzer.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**") // Apply to all API endpoints
                // Add the ports your frontend might run on during development
                // 5173 is Vite (Vue/React/Svelte) default, 3000 is React default, 4200 is Angular default
                .allowedOrigins("http://localhost:5173", "http://localhost:3000", "http://localhost:4200") 
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Allowed HTTP methods
                .allowedHeaders("*") // Allow all headers
                .allowCredentials(true); // Essential if you are using cookies or session-based auth
    }
}
