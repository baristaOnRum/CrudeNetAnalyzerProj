package ve.student.netAnalyzer.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "analisis_red")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AnalisisRed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @JsonFormat(pattern = "dd/MM/yyyy HH:mm:ss", shape = JsonFormat.Shape.STRING)
    @Column(name = "fecha_ejecucion")
    private LocalDateTime fechaEjecucion;

    @Column(name = "duracion_analisis")
    private Integer duracionAnalisis;

    @Column(name = "nombre_interfaz")
    private String nombreInterfaz;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispositivo_red_id", referencedColumnName = "id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private NetworkDevice dispositivoRed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_ejecutado", referencedColumnName = "id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private AppUser usuarioEjecutado;

    public AnalisisRed() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public LocalDateTime getFechaEjecucion() { return fechaEjecucion; }
    public void setFechaEjecucion(LocalDateTime fechaEjecucion) { this.fechaEjecucion = fechaEjecucion; }
    public Integer getDuracionAnalisis() { return duracionAnalisis; }
    public void setDuracionAnalisis(Integer duracionAnalisis) { this.duracionAnalisis = duracionAnalisis; }
    public String getNombreInterfaz() { return nombreInterfaz; }
    public void setNombreInterfaz(String nombreInterfaz) { this.nombreInterfaz = nombreInterfaz; }
    public NetworkDevice getDispositivoRed() { return dispositivoRed; }
    public void setDispositivoRed(NetworkDevice dispositivoRed) { this.dispositivoRed = dispositivoRed; }
    public AppUser getUsuarioEjecutado() { return usuarioEjecutado; }
    public void setUsuarioEjecutado(AppUser usuarioEjecutado) { this.usuarioEjecutado = usuarioEjecutado; }
}
