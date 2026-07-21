import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

public class TestInterfaces {
    public static void main(String[] args) {
        String executable = "C:\\Program Files\\Wireshark\\tshark.exe";
        List<Map<String, String>> interfaces = new ArrayList<>();
        Map<String, String> guidToMac = new HashMap<>();
        Map<String, String> nameToMac = new HashMap<>();
        
        try {
            Process pMac = Runtime.getRuntime().exec("getmac /v /fo csv");
            BufferedReader readerMac = new BufferedReader(new InputStreamReader(pMac.getInputStream()));
            String lineMac;
            Pattern guidPattern = Pattern.compile("(\\{[A-F0-9\\-]+\\})", Pattern.CASE_INSENSITIVE);
            while ((lineMac = readerMac.readLine()) != null) {
                if (lineMac.trim().isEmpty() || lineMac.startsWith("\"Connection Name\"")) continue;
                String[] parts = lineMac.split("\",\"");
                if (parts.length >= 4) {
                    String connName = parts[0].replace("\"", "").trim();
                    String macAddr = parts[2].replace("\"", "").trim().replace("-", ":");
                    String transport = parts[3].replace("\"", "").trim();

                    if (!macAddr.equals("N/A") && !macAddr.isEmpty()) {
                        nameToMac.put(connName, macAddr);
                        Matcher m = guidPattern.matcher(transport);
                        if (m.find()) {
                            guidToMac.put(m.group(1).toUpperCase(), macAddr);
                        }
                    }
                }
            }
            pMac.waitFor();
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(executable, "-D");
            Process p = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            Pattern guidPattern = Pattern.compile("(\\{[A-F0-9\\-]+\\})", Pattern.CASE_INSENSITIVE);
            while ((line = reader.readLine()) != null) {
                Map<String, String> ifaceMap = new HashMap<>();
                ifaceMap.put("name", line);
                
                String mac = "00:00:00:00:00:00";
                
                Matcher gm = guidPattern.matcher(line);
                if (gm.find()) {
                    String guid = gm.group(1).toUpperCase();
                    if (guidToMac.containsKey(guid)) {
                        mac = guidToMac.get(guid);
                    }
                }
                
                if (mac.equals("00:00:00:00:00:00")) {
                    int start = line.indexOf('(');
                    int end = line.lastIndexOf(')');
                    if (start != -1 && end > start) {
                        String desc = line.substring(start + 1, end).trim();
                        if (nameToMac.containsKey(desc)) {
                            mac = nameToMac.get(desc);
                        }
                    }
                }
                ifaceMap.put("mac", mac);
                interfaces.add(ifaceMap);
            }
            p.waitFor();
            System.out.println("Found: " + interfaces.size());
            for (Map<String, String> i : interfaces) {
                System.out.println(i);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
