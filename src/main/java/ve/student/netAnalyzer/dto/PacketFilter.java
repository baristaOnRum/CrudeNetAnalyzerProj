package ve.student.netAnalyzer.dto;

public class PacketFilter {
    private String tipoPaquete;
    private String fuente;
    private String destino;

    public PacketFilter() {}

    public String getTipoPaquete() { return tipoPaquete; }
    public void setTipoPaquete(String tipoPaquete) { this.tipoPaquete = tipoPaquete; }
    public String getFuente() { return fuente; }
    public void setFuente(String fuente) { this.fuente = fuente; }
    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }
}
