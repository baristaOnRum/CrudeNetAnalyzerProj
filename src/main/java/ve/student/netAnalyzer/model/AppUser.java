package ve.student.netAnalyzer.model;

import jakarta.persistence.*;

@Entity
@Table(name = "usuario")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, unique = true)
    private String nombre;

    @Column(name = "pass_hasheada", nullable = false)
    private String passHasheada;

    @Column(name = "rol", nullable = false)
    private String rol;

    public AppUser() {
    }

    public AppUser(String nombre, String passHasheada, String rol) {
        this.nombre = nombre;
        this.passHasheada = passHasheada;
        this.rol = rol;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getPassHasheada() {
        return passHasheada;
    }

    public void setPassHasheada(String passHasheada) {
        this.passHasheada = passHasheada;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }
}
