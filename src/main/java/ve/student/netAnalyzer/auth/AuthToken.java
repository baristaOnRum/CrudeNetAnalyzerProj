package ve.student.netAnalyzer.auth;

import java.time.LocalDateTime;

public class AuthToken {
    private String token;
    private String role;
    private LocalDateTime expiration;

    public AuthToken() {
    }

    public AuthToken(String token, String role, LocalDateTime expiration) {
        this.token = token;
        this.role = role;
        this.expiration = expiration;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public LocalDateTime getExpiration() {
        return expiration;
    }

    public void setExpiration(LocalDateTime expiration) {
        this.expiration = expiration;
    }
}
