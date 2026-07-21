package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class IpResolutionService {
    public String getPublicIp() {
        try {
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject("https://1.1.1.1/cdn-cgi/trace", String.class);
            if (response != null) {
                for (String line : response.split("\n")) {
                    if (line.startsWith("ip=")) {
                        return line.substring(3).trim();
                    }
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "Desconocida";
    }
}
