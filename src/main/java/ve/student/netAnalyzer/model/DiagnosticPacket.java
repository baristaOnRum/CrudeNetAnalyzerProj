package ve.student.netAnalyzer.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "paquetes_diagnostico")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DiagnosticPacket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "componente", nullable = false)
    private String componente; // "PING" o "TRACEROUTE"

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

    @Column(name = "longitud")
    private Integer longitud;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", shape = JsonFormat.Shape.STRING)
    @Column(name = "timestamp")
    private java.time.LocalDateTime timestamp;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_analisis", referencedColumnName = "id")
    private AnalisisRed analisisRed;

    public DiagnosticPacket() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getComponente() { return componente; }
    public void setComponente(String componente) { this.componente = componente; }
    
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
    
    public Integer getLongitud() { return longitud; }
    public void setLongitud(Integer longitud) { this.longitud = longitud; }
    
    public java.time.LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(java.time.LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public AnalisisRed getAnalisisRed() { return analisisRed; }
    public void setAnalisisRed(AnalisisRed analisisRed) { this.analisisRed = analisisRed; }

    @JsonProperty("idAnalisis")
    public Integer getIdAnalisis() {
        return analisisRed != null ? analisisRed.getId() : null;
    }
}
