package ve.student.netAnalyzer.service.speedtest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import ve.student.netAnalyzer.dto.ActiveAnalysisRequest;
import ve.student.netAnalyzer.dto.ActiveAnalysisResult;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Arrays;

/**
 * Proveedor de prueba de velocidad usando la infraestructura pública de Cloudflare Speed Test.
 * Endpoints: GET https://speed.cloudflare.com/__down?bytes=N (descarga)
 *            POST https://speed.cloudflare.com/__up (subida)
 */
@Component
public class CloudflareSpeedTestProvider implements SpeedTestProvider {

    private static final Logger logger = LoggerFactory.getLogger(CloudflareSpeedTestProvider.class);
    private static final String TARGET_HOST = "speed.cloudflare.com";
    private static final int TIMEOUT_MS = 120_000; // 2 minutos máximo

    @Override
    public String getProviderId() {
        return "CLOUDFLARE";
    }

    @Override
    public String getDisplayName() {
        return "Cloudflare Speed Test";
    }

    @Override
    public String getTargetHost() {
        return TARGET_HOST;
    }

    @Override
    public ActiveAnalysisResult runTest(ActiveAnalysisRequest request) throws Exception {
        ActiveAnalysisResult result = new ActiveAnalysisResult();
        result.setProvider(getProviderId());
        result.setTestType(request.getTestType());

        long sizeBytes = request.getSizeBytes() > 0 ? request.getSizeBytes() : 10_000_000L;
        result.setSizeBytes(sizeBytes);

        try {
            long durationMs;
            if ("UPLOAD".equalsIgnoreCase(request.getTestType())) {
                durationMs = runUpload(sizeBytes, result);
            } else {
                durationMs = runDownload(sizeBytes, result);
            }

            result.setDurationMs(durationMs);
            if (durationMs > 0) {
                double speedMbps = (sizeBytes * 8.0) / (durationMs / 1000.0) / 1_000_000.0;
                result.setSpeedMbps(Math.round(speedMbps * 100.0) / 100.0);
            }
            result.setSuccess(true);

        } catch (Exception e) {
            logger.error("Error en prueba de velocidad Cloudflare", e);
            result.setSuccess(false);
            result.setErrorMessage(e.getMessage());
        }

        return result;
    }

    private long runDownload(long sizeBytes, ActiveAnalysisResult result) throws Exception {
        String urlStr = "https://" + TARGET_HOST + "/__down?bytes=" + sizeBytes;
        logger.info("Cloudflare DOWNLOAD: {}", urlStr);

        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("User-Agent", "NetAnalyzer/1.0");
        conn.setConnectTimeout(TIMEOUT_MS);
        conn.setReadTimeout(TIMEOUT_MS);
        conn.connect();

        result.setHttpStatus(conn.getResponseCode());

        long start = System.currentTimeMillis();
        byte[] buffer = new byte[65536];
        long totalRead = 0;
        try (InputStream is = conn.getInputStream()) {
            int read;
            while ((read = is.read(buffer)) != -1) {
                totalRead += read;
            }
        }
        long end = System.currentTimeMillis();
        logger.info("Cloudflare DOWNLOAD completado: {} bytes en {} ms", totalRead, end - start);
        return end - start;
    }

    private long runUpload(long sizeBytes, ActiveAnalysisResult result) throws Exception {
        String urlStr = "https://" + TARGET_HOST + "/__up";
        logger.info("Cloudflare UPLOAD: {} bytes -> {}", sizeBytes, urlStr);

        byte[] payload = new byte[(int) Math.min(sizeBytes, 25_000_000L)];
        Arrays.fill(payload, (byte) 0x00);

        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setDoOutput(true);
        conn.setFixedLengthStreamingMode(payload.length);
        conn.setRequestProperty("Content-Type", "application/octet-stream");
        conn.setRequestProperty("User-Agent", "NetAnalyzer/1.0");
        conn.setConnectTimeout(TIMEOUT_MS);
        conn.setReadTimeout(TIMEOUT_MS);

        long start = System.currentTimeMillis();
        try (OutputStream os = conn.getOutputStream()) {
            int chunkSize = 65536;
            int offset = 0;
            while (offset < payload.length) {
                int len = Math.min(chunkSize, payload.length - offset);
                os.write(payload, offset, len);
                offset += len;
            }
            os.flush();
        }
        result.setHttpStatus(conn.getResponseCode());
        long end = System.currentTimeMillis();

        logger.info("Cloudflare UPLOAD completado: {} bytes en {} ms", payload.length, end - start);
        return end - start;
    }
}
