package ve.student.netAnalyzer.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "analisis_red")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AnalisisRed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "fecha_ejecucion")
    private LocalDateTime fechaEjecucion;

    @Column(name = "duracion_analisis")
    private Integer duracionAnalisis;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_ejecutado", referencedColumnName = "id")
    private AppUser usuarioEjecutado;

    public AnalisisRed() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public LocalDateTime getFechaEjecucion() { return fechaEjecucion; }
    public void setFechaEjecucion(LocalDateTime fechaEjecucion) { this.fechaEjecucion = fechaEjecucion; }
    public Integer getDuracionAnalisis() { return duracionAnalisis; }
    public void setDuracionAnalisis(Integer duracionAnalisis) { this.duracionAnalisis = duracionAnalisis; }
    public AppUser getUsuarioEjecutado() { return usuarioEjecutado; }
    public void setUsuarioEjecutado(AppUser usuarioEjecutado) { this.usuarioEjecutado = usuarioEjecutado; }
}
