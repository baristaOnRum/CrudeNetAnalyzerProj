package ve.student.netAnalyzer.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import ve.student.netAnalyzer.model.Packet;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;

public class PacketExporter {

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(15, 23, 42));
    private static final Font SUBTITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(100, 116, 139));
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
    private static final Font BODY_FONT = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(30, 41, 59));

    public static byte[] exportListToPdf(List<Packet> packets) {
        return exportListToPdf(packets, true);
    }

    public static byte[] exportListToPdf(List<Packet> packets, boolean resolveDns) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document();
            document.setMargins(36, 36, 54, 54);

            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setPageEvent(new PdfHeaderFooterHandler("EXPORTACIÓN DE PAQUETES DE RED"));
            document.open();
            
            Paragraph title = new Paragraph("Reporte de Paquetes Filtrados", TITLE_FONT);
            title.setSpacingAfter(4f);
            document.add(title);

            Paragraph subtitle = new Paragraph("Total de paquetes en el reporte: " + packets.size(), SUBTITLE_FONT);
            subtitle.setSpacingAfter(14f);
            document.add(subtitle);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 1.2f, 2f, 2f, 1.2f, 2.2f});
            table.setSpacingBefore(5f);
            table.setHeaderRows(1);
            
            // Header
            addTableHeader(table, "ID");
            addTableHeader(table, "Protocolo");
            addTableHeader(table, "IP Origen");
            addTableHeader(table, "IP Destino");
            addTableHeader(table, "Tamaño (B)");
            addTableHeader(table, "Marca de Tiempo");
            
            for (Packet p : packets) {
                String src = p.getFuente() != null ? p.getFuente() : "N/A";
                String dst = p.getDestino() != null ? p.getDestino() : "N/A";
                if (!resolveDns) {
                    src = extractRawIp(src);
                    dst = extractRawIp(dst);
                }
                table.addCell(createCell(p.getId() != null ? p.getId().toString() : "N/A"));
                table.addCell(createCell(p.getTipoPaquete() != null ? p.getTipoPaquete() : "N/A"));
                table.addCell(createCell(src));
                table.addCell(createCell(dst));
                table.addCell(createCell(p.getLongitud() != null ? p.getLongitud().toString() : "0"));
                table.addCell(createCell(p.getTimestamp() != null ? p.getTimestamp().toString().replace("T", " ") : "N/A"));
            }
            
            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }

    private static String extractRawIp(String addr) {
        if (addr == null || addr.isBlank() || addr.equals("N/A")) return addr;
        // If domain name or hostname, try resolving back to IP or format cleanly
        if (!addr.matches("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$") && !addr.contains(":")) {
            try {
                java.net.InetAddress inet = java.net.InetAddress.getByName(addr);
                return inet.getHostAddress();
            } catch (Exception ignored) {}
        }
        return addr;
    }

    private static void addTableHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, HEADER_FONT));
        cell.setBackgroundColor(new Color(29, 78, 216)); // Royal Blue #1D4ED8
        cell.setPadding(5f);
        table.addCell(cell);
    }

    private static PdfPCell createCell(String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, BODY_FONT));
        cell.setPadding(5f);
        cell.setBorderColor(new Color(226, 232, 240));
        return cell;
    }
}
