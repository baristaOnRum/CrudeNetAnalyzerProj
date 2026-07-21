package ve.student.netAnalyzer.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import ve.student.netAnalyzer.model.Packet;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

public class PacketExporter {

    public static byte[] exportListToPdf(List<Packet> packets) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document();
            document.setMargins(20, 20, 30, 30);
            PdfWriter.getInstance(document, baos);
            document.open();
            
            document.add(new Paragraph("Reporte de Paquetes Filtrados"));
            document.add(new Paragraph("Generado el: " + LocalDateTime.now().toString()));
            document.add(new Paragraph("Total de paquetes: " + packets.size()));
            document.add(new Paragraph(" "));
            
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1f, 1.5f, 2f, 2f, 1.5f, 2f});
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);
            
            // Header
            table.addCell("ID");
            table.addCell("Protocolo");
            table.addCell("Fuente");
            table.addCell("Destino");
            table.addCell("Tam(B)");
            table.addCell("Marca de Tiempo");
            
            for (Packet p : packets) {
                table.addCell(p.getId() != null ? p.getId().toString() : "N/A");
                table.addCell(p.getTipoPaquete() != null ? p.getTipoPaquete() : "N/A");
                table.addCell(p.getFuente() != null ? p.getFuente() : "N/A");
                table.addCell(p.getDestino() != null ? p.getDestino() : "N/A");
                table.addCell(p.getLongitud() != null ? p.getLongitud().toString() : "0");
                table.addCell(p.getTimestamp() != null ? p.getTimestamp().toString() : "N/A");
            }
            
            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }
}
