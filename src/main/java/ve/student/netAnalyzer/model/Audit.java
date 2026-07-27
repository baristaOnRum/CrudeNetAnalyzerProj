package ve.student.netAnalyzer.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "registro_auditorias")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Audit {

    @Id
    @Column(name = "id_sesion", nullable = false)
    private String idSesion;

    @Column(name = "nombre_auditoria")
    private String nombreAuditoria;

    @Column(name = "detalle_cambio", columnDefinition = "TEXT")
    private String detalleCambio;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", shape = JsonFormat.Shape.STRING)
    @Column(name = "fecha_hora")
    private LocalDateTime fechaHora;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", referencedColumnName = "id")
    private AppUser usuario;

    public Audit() {}

    public String getIdSesion() { return idSesion; }
    public void setIdSesion(String idSesion) { this.idSesion = idSesion; }
    public String getNombreAuditoria() { return nombreAuditoria; }
    public void setNombreAuditoria(String nombreAuditoria) { this.nombreAuditoria = nombreAuditoria; }
    public String getDetalleCambio() { return detalleCambio; }
    public void setDetalleCambio(String detalleCambio) { this.detalleCambio = detalleCambio; }
    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }
    public AppUser getUsuario() { return usuario; }
    public void setUsuario(AppUser usuario) { this.usuario = usuario; }
}
