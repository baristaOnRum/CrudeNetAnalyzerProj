package ve.student.netAnalyzer.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DnsResolutionService {

    private static final Logger logger = LoggerFactory.getLogger(DnsResolutionService.class);
    
    // Caché en memoria de IP a Hostname
    private final ConcurrentHashMap<String, String> dnsCache = new ConcurrentHashMap<>();
    
    // Set de IPs que actualmente están siendo resueltas para evitar múltiples hilos resolviendo la misma
    private final ConcurrentHashMap<String, Boolean> pendingResolutions = new ConcurrentHashMap<>();

    /**
     * Resuelve un dominio a partir de una IP de manera asíncrona.
     * Si la IP está en el caché, retorna el dominio.
     * Si no, retorna la misma IP de inmediato y encola la resolución.
     * 
     * @param ip La dirección IP (v4 o v6)
     * @return El nombre de dominio (si está en caché) o la IP original
     */
    public String resolveIp(String ip) {
        if (ip == null || ip.isBlank() || ip.equals("N/A")) {
            return ip;
        }

        // 1. Revisar si ya está en caché
        String cachedHostname = dnsCache.get(ip);
        if (cachedHostname != null) {
            return cachedHostname;
        }

        // 2. Si no está en caché y no está pendiente de resolución, disparar resolución asíncrona
        if (pendingResolutions.putIfAbsent(ip, Boolean.TRUE) == null) {
            CompletableFuture.runAsync(() -> {
                try {
                    InetAddress inetAddress = InetAddress.getByName(ip);
                    String hostname = inetAddress.getHostName();
                    
                    // Solo guardamos en caché si realmente resolvimos algo diferente a la IP
                    if (!hostname.equals(ip)) {
                        dnsCache.put(ip, hostname);
                    } else {
                        // Opcional: Guardar la IP misma en caché para no volver a intentar,
                        // asumiendo que no tiene reverse DNS (ahorra procesamiento futuro).
                        dnsCache.put(ip, ip);
                    }
                } catch (Exception e) {
                    // Si falla (ej. UnknownHostException), guardamos la IP original 
                    // en caché para no saturar con intentos fallidos
                    dnsCache.put(ip, ip);
                } finally {
                    pendingResolutions.remove(ip);
                }
            });
        }

        // Retorna la IP cruda mientras se resuelve en el fondo
        return ip;
    }

    /**
     * Permite inyectar manualmente una resolución, muy útil cuando Tshark nos provee
     * un SNI exacto (ej. desde tls.handshake.extensions_server_name)
     * 
     * @param ip La dirección IP
     * @param hostname El nombre de host a forzar en caché
     */
    public void forceCacheResolution(String ip, String hostname) {
        if (ip != null && !ip.isBlank() && hostname != null && !hostname.isBlank()) {
            dnsCache.put(ip, hostname);
        }
    }
}
