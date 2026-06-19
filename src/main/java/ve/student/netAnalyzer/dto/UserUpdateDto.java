package ve.student.netAnalyzer.dto;

public class UserUpdateDto {
    private String nombre;
    private String rol;

    public UserUpdateDto() {}

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
}
