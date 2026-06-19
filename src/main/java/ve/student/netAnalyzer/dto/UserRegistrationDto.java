package ve.student.netAnalyzer.dto;

public class UserRegistrationDto {
    private String nombre;
    private String passHasheada;
    private String rol;

    public UserRegistrationDto() {}

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getPassHasheada() { return passHasheada; }
    public void setPassHasheada(String passHasheada) { this.passHasheada = passHasheada; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
}
