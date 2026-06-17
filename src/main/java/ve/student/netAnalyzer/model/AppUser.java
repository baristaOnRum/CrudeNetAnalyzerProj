package ve.student.netAnalyzer.model;

import jakarta.persistence.*;

@Entity
@Table(name = "usuarios")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario", nullable = false, unique = true)
    private String usuario;

    @Column(name = "pass_hasheada", nullable = false)
    private String passHasheada;

    @Column(name = "rol", nullable = false)
    private String rol;

    public AppUser() {
    }

    public AppUser(String usuario, String passHasheada, String rol) {
        this.usuario = usuario;
        this.passHasheada = passHasheada;
        this.rol = rol;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
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
