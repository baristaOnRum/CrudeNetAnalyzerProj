package ve.student.netAnalyzer.dto;

public class InterfaceDto {
    private String interfaceId;
    private String name;
    private String status;

    public InterfaceDto() {}

    public InterfaceDto(String interfaceId, String name, String status) {
        this.interfaceId = interfaceId;
        this.name = name;
        this.status = status;
    }

    public String getInterfaceId() { return interfaceId; }
    public void setInterfaceId(String interfaceId) { this.interfaceId = interfaceId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
