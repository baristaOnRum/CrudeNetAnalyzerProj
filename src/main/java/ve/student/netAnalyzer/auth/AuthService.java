package ve.student.netAnalyzer.auth;

public interface AuthService {
    
    /**
     * Authenticates a user based on credentials.
     * RF-3-1 Iniciar sesión.
     * 
     * @param credentials the user credentials
     * @return the generated auth token
     * @throws RuntimeException if authentication fails
     */
    AuthToken login(Credentials credentials);

    /**
     * Logs out a user by invalidating their token.
     * RF-3-2 Cerrar sesión.
     * 
     * @param token the active auth token to invalidate
     */
    void logout(String token);

    /**
     * Authenticates a user as a guest.
     * RF-3-3 Iniciar sesión de invitado.
     * 
     * @return the generated auth token with guest privileges
     */
    AuthToken loginAsGuest();
}
