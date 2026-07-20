package ve.student.netAnalyzer.dto;

public class InterfaceDto {
    private String nombreInterfaz;
    private String macAddress;
    private String ipAddress;
    private Long idAnalisis;

    public InterfaceDto() {}

    public InterfaceDto(String nombreInterfaz, String macAddress, String ipAddress, Long idAnalisis) {
        this.nombreInterfaz = nombreInterfaz;
        this.macAddress = macAddress;
        this.ipAddress = ipAddress;
        this.idAnalisis = idAnalisis;
    }

    public String getNombreInterfaz() { return nombreInterfaz; }
    public void setNombreInterfaz(String nombreInterfaz) { this.nombreInterfaz = nombreInterfaz; }
    
    public String getMacAddress() { return macAddress; }
    public void setMacAddress(String macAddress) { this.macAddress = macAddress; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public Long getIdAnalisis() { return idAnalisis; }
    public void setIdAnalisis(Long idAnalisis) { this.idAnalisis = idAnalisis; }
}
