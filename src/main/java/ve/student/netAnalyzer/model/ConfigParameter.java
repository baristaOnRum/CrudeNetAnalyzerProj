package ve.student.netAnalyzer.model;

import jakarta.persistence.*;

@Entity
@Table(name = "configuraciones")
public class ConfigParameter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_configuracion")
    private Integer idConfiguracion;

    @Column(name = "nombre_configuracion")
    private String nombreConfiguracion;

    @Column(name = "valores_disponibles", columnDefinition = "TEXT")
    private String valoresDisponibles;

    @Column(name = "valor_seleccionado", columnDefinition = "TEXT")
    private String valorSeleccionado;

    public ConfigParameter() {
    }

    public Integer getIdConfiguracion() {
        return idConfiguracion;
    }

    public void setIdConfiguracion(Integer idConfiguracion) {
        this.idConfiguracion = idConfiguracion;
    }

    public String getNombreConfiguracion() {
        return nombreConfiguracion;
    }

    public void setNombreConfiguracion(String nombreConfiguracion) {
        this.nombreConfiguracion = nombreConfiguracion;
    }

    public String getValoresDisponibles() {
        return valoresDisponibles;
    }

    public void setValoresDisponibles(String valoresDisponibles) {
        this.valoresDisponibles = valoresDisponibles;
    }

    public String getValorSeleccionado() {
        return valorSeleccionado;
    }

    public void setValorSeleccionado(String valorSeleccionado) {
        this.valorSeleccionado = valorSeleccionado;
    }
}
