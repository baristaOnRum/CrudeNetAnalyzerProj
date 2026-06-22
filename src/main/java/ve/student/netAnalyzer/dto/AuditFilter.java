package ve.student.netAnalyzer.dto;

public class AuditFilter {
    private String nombreAuditoria;
    private Long idUsuario;

    public AuditFilter() {}

    public String getNombreAuditoria() { return nombreAuditoria; }
    public void setNombreAuditoria(String nombreAuditoria) { this.nombreAuditoria = nombreAuditoria; }
    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
}
