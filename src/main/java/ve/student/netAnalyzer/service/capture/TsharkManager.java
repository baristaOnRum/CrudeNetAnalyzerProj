package ve.student.netAnalyzer.service.capture;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;

@Service
public class TsharkManager {

    private static final Logger logger = LoggerFactory.getLogger(TsharkManager.class);

    @Value("${capture.tshark.path:./tshark-portable/App/Wireshark/tshark}")
    private String tsharkPath;

    @PostConstruct
    public void init() {
        checkTsharkExists();
    }

    public void checkTsharkExists() {
        File tsharkFile = new File(tsharkPath);
        if (tsharkFile.exists() || new File(tsharkPath + ".exe").exists()) {
            logger.info("TShark executable successfully found at {}.", tsharkPath);
        } else {
            logger.error("TShark executable NOT found at {}. Please extract the portable Wireshark " +
                    "to the correct folder manually.", tsharkPath);
        }
    }
}
