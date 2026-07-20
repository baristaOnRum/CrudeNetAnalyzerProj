package ve.student.netAnalyzer.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.opencsv.CSVWriter;
import ve.student.netAnalyzer.dto.Statistics;
import ve.student.netAnalyzer.model.Packet;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ReportExporter {

    public static File exportToPdf(List<Packet> packets, Statistics stats, String prefix) {
        try {
            File dir = new File("reports");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File pdfFile = new File(dir, prefix + "_" + System.currentTimeMillis() + ".pdf");
            
            Document document = new Document();
            PdfWriter.getInstance(document, new FileOutputStream(pdfFile));
            document.open();
            
            document.add(new Paragraph("Reporte de Análisis de Red"));
            document.add(new Paragraph("Generado el: " + LocalDateTime.now().toString()));
            document.add(new Paragraph("Total de paquetes analizados: " + packets.size()));
            document.add(new Paragraph(" "));
            
            if (stats != null) {
                document.add(new Paragraph("--- ESTADÍSTICAS DE LA SESIÓN ---"));
                document.add(new Paragraph(String.format("Jitter Promedio: %.2f ms", stats.getAverageJitter())));
                document.add(new Paragraph(String.format("Percentil 90 de Jitter: %.2f ms", stats.getJitter90thPercentile())));
                document.add(new Paragraph(String.format("Tasa de Descarga: %.2f Bytes/s", stats.getDownloadRate())));
                document.add(new Paragraph(String.format("Tasa de Paquetes: %.2f pkt/s", stats.getPacketRate())));
                document.add(new Paragraph(String.format("Percentil 90 de Tamaño: %.2f bytes", stats.getSize90thPercentile())));
                document.add(new Paragraph(" "));
                
                if (stats.getTopSourceIps() != null && !stats.getTopSourceIps().isEmpty()) {
                    document.add(new Paragraph("--- TOP 5 IPs ORIGEN (PARETO) ---"));
                    for (Map.Entry<String, Long> entry : stats.getTopSourceIps().entrySet()) {
                        document.add(new Paragraph(String.format("IP: %s | Paquetes: %d", entry.getKey(), entry.getValue())));
                    }
                    document.add(new Paragraph(" "));
                }

                if (stats.getProtocolDistribution() != null && !stats.getProtocolDistribution().isEmpty()) {
                    document.add(new Paragraph("--- DISTRIBUCIÓN DE PROTOCOLOS ---"));
                    for (Map.Entry<String, Long> entry : stats.getProtocolDistribution().entrySet()) {
                        document.add(new Paragraph(String.format("Protocolo: %s | Paquetes: %d", entry.getKey(), entry.getValue())));
                    }
                    document.add(new Paragraph(" "));
                }
            } else {
                document.add(new Paragraph("--- MUESTRA DE PAQUETES ---"));
                for (int i = 0; i < Math.min(packets.size(), 500); i++) {
                    Packet p = packets.get(i);
                    document.add(new Paragraph(String.format("ID: %s | Origen: %s | Destino: %s | Protocolo: %s | Longitud: %d",
                            p.getId(), p.getFuente(), p.getDestino(), p.getTipoPaquete(), p.getLongitud())));
                }
                
                if (packets.size() > 500) {
                    document.add(new Paragraph("... (Mostrando solo los primeros 500 paquetes en el resumen impreso)"));
                }
            }
            
            document.close();
            return pdfFile;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static File exportToPdf(List<Packet> packets, String prefix) {
        return exportToPdf(packets, null, prefix);
    }

    public static File exportToCsv(List<Packet> packets, String prefix) {
        try {
            File dir = new File("reports");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File csvFile = new File(dir, prefix + "_" + System.currentTimeMillis() + ".csv");
            
            CSVWriter writer = new CSVWriter(new FileWriter(csvFile));
            
            String[] header = {"ID", "Timestamp", "IP Origen", "IP Destino", "Protocolo", "Longitud", "Info"};
            writer.writeNext(header);
            
            for (Packet p : packets) {
                String[] row = {
                        String.valueOf(p.getId()),
                        p.getTimestamp() != null ? p.getTimestamp().toString() : "",
                        p.getFuente() != null ? p.getFuente() : "",
                        p.getDestino() != null ? p.getDestino() : "",
                        p.getTipoPaquete() != null ? p.getTipoPaquete() : "",
                        p.getLongitud() != null ? p.getLongitud().toString() : "0",
                        p.getContenidos() != null ? p.getContenidos().substring(0, Math.min(p.getContenidos().length(), 50)) : ""
                };
                writer.writeNext(row);
            }
            
            writer.close();
            return csvFile;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
