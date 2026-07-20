package ve.student.netAnalyzer.dto;

public class DbConnectionDto {
    private String dbType; // postgresql, sqlite, mysql, h2
    private String host;
    private String port;
    private String name;
    private String url;
    private String username;
    private String password;

    public DbConnectionDto() {}

    public DbConnectionDto(String url, String username, String password) {
        this.url = url;
        this.username = username;
        this.password = password;
    }

    public DbConnectionDto(String dbType, String host, String port, String name, String username, String password) {
        this.dbType = dbType;
        this.host = host;
        this.port = port;
        this.name = name;
        this.username = username;
        this.password = password;
    }

    public String getDbType() { return dbType; }
    public void setDbType(String dbType) { this.dbType = dbType; }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }

    public String getPort() { return port; }
    public void setPort(String port) { this.port = port; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    // Support 'user' field alias from frontend JSON if passed
    public String getUser() { return username; }
    public void setUser(String user) { this.username = user; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}

