package ve.student.netAnalyzer.dto;

public class Report {
    private String id;
    private String name;
    private String generatedDate;
    private String content;

    public Report() {}

    public Report(String id, String name, String generatedDate, String content) {
        this.id = id;
        this.name = name;
        this.generatedDate = generatedDate;
        this.content = content;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGeneratedDate() { return generatedDate; }
    public void setGeneratedDate(String generatedDate) { this.generatedDate = generatedDate; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
