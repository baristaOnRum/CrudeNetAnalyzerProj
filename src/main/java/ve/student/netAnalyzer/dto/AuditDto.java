package ve.student.netAnalyzer.dto;

public class AuditDto {
    private String idSesion;
    private String nombreAuditoria;
    private String detalleCambio;
    private java.time.LocalDateTime fechaHora;
    private Long idUsuario;

    public AuditDto() {}

    public String getIdSesion() { return idSesion; }
    public void setIdSesion(String idSesion) { this.idSesion = idSesion; }
    public String getNombreAuditoria() { return nombreAuditoria; }
    public void setNombreAuditoria(String nombreAuditoria) { this.nombreAuditoria = nombreAuditoria; }
    public String getDetalleCambio() { return detalleCambio; }
    public void setDetalleCambio(String detalleCambio) { this.detalleCambio = detalleCambio; }
    public java.time.LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(java.time.LocalDateTime fechaHora) { this.fechaHora = fechaHora; }
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
}
