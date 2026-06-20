package ve.student.netAnalyzer.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "registro_eventos")
public class Event {

    @Id
    @Column(name = "id_sesion", nullable = false)
    private String idSesion;

    @Column(name = "nombre_evento")
    private String nombreEvento;

    @Column(name = "detalle_cambio", columnDefinition = "TEXT")
    private String detalleCambio;

    @Column(name = "fecha_hora")
    private LocalDateTime fechaHora;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", referencedColumnName = "id")
    private AppUser usuario;

    public Event() {}

    public String getIdSesion() { return idSesion; }
    public void setIdSesion(String idSesion) { this.idSesion = idSesion; }
    public String getNombreEvento() { return nombreEvento; }
    public void setNombreEvento(String nombreEvento) { this.nombreEvento = nombreEvento; }
    public String getDetalleCambio() { return detalleCambio; }
    public void setDetalleCambio(String detalleCambio) { this.detalleCambio = detalleCambio; }
    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }
    public AppUser getUsuario() { return usuario; }
    public void setUsuario(AppUser usuario) { this.usuario = usuario; }
}
