package ve.student.netAnalyzer.model;

import jakarta.persistence.*;

@Entity
@Table(name = "registro_eventos")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_sesion")
    private Integer idSesion;

    @Column(name = "nombre_evento")
    private String nombreEvento;

    @Column(name = "detalle_cambio", columnDefinition = "TEXT")
    private String detalleCambio;

    @Column(name = "id_usuario")
    private Integer idUsuario;

    public Event() {}

    public Integer getIdSesion() { return idSesion; }
    public void setIdSesion(Integer idSesion) { this.idSesion = idSesion; }
    public String getNombreEvento() { return nombreEvento; }
    public void setNombreEvento(String nombreEvento) { this.nombreEvento = nombreEvento; }
    public String getDetalleCambio() { return detalleCambio; }
    public void setDetalleCambio(String detalleCambio) { this.detalleCambio = detalleCambio; }
    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }
}
