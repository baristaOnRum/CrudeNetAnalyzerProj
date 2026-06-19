package ve.student.netAnalyzer.model;

import jakarta.persistence.*;

@Entity
@Table(name = "paquetes")
public class Packet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tipo_paquete")
    private String tipoPaquete;

    @Column(name = "contenidos", columnDefinition = "TEXT")
    private String contenidos;

    @Column(name = "fuente")
    private String fuente;

    @Column(name = "destino")
    private String destino;

    @Column(name = "respuesta", columnDefinition = "TEXT")
    private String respuesta;

    @Column(name = "tiempo_respuesta")
    private Integer tiempoRespuesta;

    public Packet() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTipoPaquete() { return tipoPaquete; }
    public void setTipoPaquete(String tipoPaquete) { this.tipoPaquete = tipoPaquete; }
    public String getContenidos() { return contenidos; }
    public void setContenidos(String contenidos) { this.contenidos = contenidos; }
    public String getFuente() { return fuente; }
    public void setFuente(String fuente) { this.fuente = fuente; }
    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }
    public String getRespuesta() { return respuesta; }
    public void setRespuesta(String respuesta) { this.respuesta = respuesta; }
    public Integer getTiempoRespuesta() { return tiempoRespuesta; }
    public void setTiempoRespuesta(Integer tiempoRespuesta) { this.tiempoRespuesta = tiempoRespuesta; }
}
