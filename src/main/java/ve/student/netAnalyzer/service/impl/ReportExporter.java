package ve.student.netAnalyzer.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.opencsv.CSVWriter;
import ve.student.netAnalyzer.dto.Statistics;
import ve.student.netAnalyzer.model.Packet;

import java.awt.Color;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.util.List;
import java.util.Map;

public class ReportExporter {

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(15, 23, 42));
    private static final Font SUBTITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(100, 116, 139));
    private static final Font SECTION_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, new Color(79, 70, 229));
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
    private static final Font BODY_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(30, 41, 59));

    public static File exportToPdf(List<Packet> packets, Statistics stats, String prefix) {
        try {
            File dir = new File("reports");
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File pdfFile = new File(dir, prefix + "_" + System.currentTimeMillis() + ".pdf");
            
            Document document = new Document();
            document.setMargins(36, 36, 54, 54);

            PdfWriter writer = PdfWriter.getInstance(document, new FileOutputStream(pdfFile));
            writer.setPageEvent(new PdfHeaderFooterHandler("REPORTE TÉCNICO DE ANÁLISIS DE RED"));
            document.open();
            
            Paragraph title = new Paragraph("Reporte de Análisis de Red", TITLE_FONT);
            title.setSpacingAfter(4f);
            document.add(title);

            Paragraph subtitle = new Paragraph("Muestra de análisis obtenida: " + (packets != null ? packets.size() : 0) + " paquetes", SUBTITLE_FONT);
            subtitle.setSpacingAfter(14f);
            document.add(subtitle);
            
            if (stats != null) {
                Paragraph sec1 = new Paragraph("ESTADÍSTICAS GENERALES DE LA SESIÓN", SECTION_FONT);
                sec1.setSpacingAfter(6f);
                document.add(sec1);

                PdfPTable statsTable = new PdfPTable(2);
                statsTable.setWidthPercentage(100);
                statsTable.setWidths(new float[]{2f, 3f});
                statsTable.setSpacingAfter(14f);

                addTableRow(statsTable, "Jitter Promedio", String.format("%.2f ms", stats.getAverageJitter()));
                addTableRow(statsTable, "Percentil 90 de Jitter", String.format("%.2f ms", stats.getJitter90thPercentile()));
                addTableRow(statsTable, "Tasa de Descarga (Throughput)", String.format("%.2f Bytes/s", stats.getDownloadRate()));
                addTableRow(statsTable, "Tasa de Transmisión de Paquetes", String.format("%.2f pkt/s", stats.getPacketRate()));
                addTableRow(statsTable, "Percentil 90 de Tamaño de Paquete", String.format("%.2f Bytes", stats.getSize90thPercentile()));
                
                document.add(statsTable);
                
                if (stats.getTopSourceIps() != null && !stats.getTopSourceIps().isEmpty()) {
                    Paragraph sec2 = new Paragraph("TOP 5 IPs ORIGEN (ANÁLISIS PARETO)", SECTION_FONT);
                    sec2.setSpacingAfter(6f);
                    document.add(sec2);

                    PdfPTable paretoTable = new PdfPTable(2);
                    paretoTable.setWidthPercentage(100);
                    paretoTable.setSpacingAfter(14f);
                    addTableHeader(paretoTable, "Dirección IP Origen");
                    addTableHeader(paretoTable, "Total Paquetes Interceptados");

                    for (Map.Entry<String, Long> entry : stats.getTopSourceIps().entrySet()) {
                        paretoTable.addCell(createCell(entry.getKey()));
                        paretoTable.addCell(createCell(String.valueOf(entry.getValue())));
                    }
                    document.add(paretoTable);
                }

                if (stats.getProtocolDistribution() != null && !stats.getProtocolDistribution().isEmpty()) {
                    Paragraph sec3 = new Paragraph("DISTRIBUCIÓN DE PROTOCOLOS DE RED", SECTION_FONT);
                    sec3.setSpacingAfter(6f);
                    document.add(sec3);

                    PdfPTable protoTable = new PdfPTable(2);
                    protoTable.setWidthPercentage(100);
                    protoTable.setSpacingAfter(14f);
                    addTableHeader(protoTable, "Protocolo de Capa de Red / Transporte");
                    addTableHeader(protoTable, "Cantidad de Tramas");

                    for (Map.Entry<String, Long> entry : stats.getProtocolDistribution().entrySet()) {
                        protoTable.addCell(createCell(entry.getKey()));
                        protoTable.addCell(createCell(String.valueOf(entry.getValue())));
                    }
                    document.add(protoTable);
                }
            } else if (packets != null) {
                Paragraph sec = new Paragraph("RESUMEN DE MUESTRA DE PAQUETES", SECTION_FONT);
                sec.setSpacingAfter(6f);
                document.add(sec);

                PdfPTable table = new PdfPTable(5);
                table.setWidthPercentage(100);
                table.setWidths(new float[]{1f, 1.5f, 2f, 2f, 1.5f});
                table.setHeaderRows(1);

                addTableHeader(table, "ID");
                addTableHeader(table, "Protocolo");
                addTableHeader(table, "Origen");
                addTableHeader(table, "Destino");
                addTableHeader(table, "Longitud (B)");

                int limit = Math.min(packets.size(), 200);
                for (int i = 0; i < limit; i++) {
                    Packet p = packets.get(i);
                    table.addCell(createCell(p.getId() != null ? p.getId().toString() : "N/A"));
                    table.addCell(createCell(p.getTipoPaquete() != null ? p.getTipoPaquete() : "N/A"));
                    table.addCell(createCell(p.getFuente() != null ? p.getFuente() : "N/A"));
                    table.addCell(createCell(p.getDestino() != null ? p.getDestino() : "N/A"));
                    table.addCell(createCell(p.getLongitud() != null ? p.getLongitud().toString() : "0"));
                }
                
                document.add(table);

                if (packets.size() > 200) {
                    Paragraph overflowMsg = new Paragraph("... (Mostrando los primeros 200 paquetes en el resumen impreso)", SUBTITLE_FONT);
                    overflowMsg.setSpacingBefore(8f);
                    document.add(overflowMsg);
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

    private static void addTableHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, HEADER_FONT));
        cell.setBackgroundColor(new Color(15, 23, 42));
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private static PdfPCell createCell(String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, BODY_FONT));
        cell.setPadding(5f);
        cell.setBorderColor(new Color(226, 232, 240));
        return cell;
    }

    private static void addTableRow(PdfPTable table, String label, String value) {
        PdfPCell labelCell = new PdfPCell(new Paragraph(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, new Color(71, 85, 105))));
        labelCell.setBackgroundColor(new Color(248, 250, 252));
        labelCell.setPadding(6f);
        labelCell.setBorderColor(new Color(226, 232, 240));
        table.addCell(labelCell);

        PdfPCell valCell = new PdfPCell(new Paragraph(value, BODY_FONT));
        valCell.setPadding(6f);
        valCell.setBorderColor(new Color(226, 232, 240));
        table.addCell(valCell);
    }
}
