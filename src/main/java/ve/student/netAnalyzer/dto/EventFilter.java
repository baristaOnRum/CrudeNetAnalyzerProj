package ve.student.netAnalyzer.dto;

public class EventFilter {
    private String nombreEvento;
    private Long idUsuario;

    public EventFilter() {}

    public String getNombreEvento() { return nombreEvento; }
    public void setNombreEvento(String nombreEvento) { this.nombreEvento = nombreEvento; }
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
}
