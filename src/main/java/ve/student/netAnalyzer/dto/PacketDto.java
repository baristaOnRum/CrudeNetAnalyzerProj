package ve.student.netAnalyzer.dto;

public class PacketDto {
    private String tipoPaquete;
    private String contenidos;
    private String fuente;
    private String destino;
    private String respuesta;
    private Integer tiempoRespuesta;
    private Integer idAnalisis;

    public PacketDto() {}

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
    public Integer getIdAnalisis() { return idAnalisis; }
    public void setIdAnalisis(Integer idAnalisis) { this.idAnalisis = idAnalisis; }
}
