package ve.student.netAnalyzer.dto;

public class EventFilter {
    private String nombreEvento;
    private Integer idUsuario;

    public EventFilter() {}

    public String getNombreEvento() { return nombreEvento; }
    public void setNombreEvento(String nombreEvento) { this.nombreEvento = nombreEvento; }
    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }
}
