package ve.student.netAnalyzer.dto;

public class EventDto {
    private String idSesion;
    private String nombreEvento;
    private String detalleCambio;
    private java.time.LocalDateTime fechaHora;
    private Long idUsuario;

    public EventDto() {}

    public String getIdSesion() { return idSesion; }
    public void setIdSesion(String idSesion) { this.idSesion = idSesion; }
    public String getNombreEvento() { return nombreEvento; }
    public void setNombreEvento(String nombreEvento) { this.nombreEvento = nombreEvento; }
    public String getDetalleCambio() { return detalleCambio; }
    public void setDetalleCambio(String detalleCambio) { this.detalleCambio = detalleCambio; }
    public java.time.LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(java.time.LocalDateTime fechaHora) { this.fechaHora = fechaHora; }
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
}
