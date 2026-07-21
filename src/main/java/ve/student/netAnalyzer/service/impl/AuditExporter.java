package ve.student.netAnalyzer.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import ve.student.netAnalyzer.model.Audit;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.List;

public class AuditExporter {

    public static byte[] exportSingleToPdf(Audit audit) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, baos);
            document.open();
            
            document.add(new Paragraph("Registro de Auditoría - Evento Individual"));
            document.add(new Paragraph("Generado el: " + LocalDateTime.now().toString()));
            document.add(new Paragraph(" "));
            
            document.add(new Paragraph("ID Sesión: " + (audit.getIdSesion() != null ? audit.getIdSesion() : "N/A")));
            document.add(new Paragraph("Fecha y Hora: " + (audit.getFechaHora() != null ? audit.getFechaHora() : "N/A")));
            document.add(new Paragraph("Nombre Auditoría: " + (audit.getNombreAuditoria() != null ? audit.getNombreAuditoria() : "N/A")));
            document.add(new Paragraph("ID Usuario: " + (audit.getUsuario() != null ? audit.getUsuario().getId() : "Sistema")));
            document.add(new Paragraph(" "));
            
            document.add(new Paragraph("Detalles del Cambio:"));
            document.add(new Paragraph(audit.getDetalleCambio() != null ? audit.getDetalleCambio() : "Sin detalles."));
            
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }

    public static byte[] exportListToPdf(List<Audit> audits) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, baos);
            document.open();
            
            document.add(new Paragraph("Reporte Completo de Auditoría"));
            document.add(new Paragraph("Generado el: " + LocalDateTime.now().toString()));
            document.add(new Paragraph("Total de registros: " + audits.size()));
            document.add(new Paragraph(" "));
            
            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setSpacingBefore(10f);
            table.setSpacingAfter(10f);
            
            // Header
            table.addCell("ID Sesión");
            table.addCell("Fecha y Hora");
            table.addCell("Nombre Auditoría");
            table.addCell("Usuario");
            
            for (Audit audit : audits) {
                table.addCell(audit.getIdSesion() != null ? audit.getIdSesion() : "N/A");
                table.addCell(audit.getFechaHora() != null ? audit.getFechaHora().toString() : "N/A");
                table.addCell(audit.getNombreAuditoria() != null ? audit.getNombreAuditoria() : "N/A");
                table.addCell(audit.getUsuario() != null ? audit.getUsuario().getId().toString() : "Sistema");
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
