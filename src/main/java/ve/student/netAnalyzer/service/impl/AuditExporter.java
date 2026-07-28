package ve.student.netAnalyzer.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import ve.student.netAnalyzer.model.Audit;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.List;

public class AuditExporter {

    private static final Font TITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(15, 23, 42));
    private static final Font SUBTITLE_FONT = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(100, 116, 139));
    private static final Font HEADER_FONT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
    private static final Font BODY_FONT = FontFactory.getFont(FontFactory.HELVETICA, 9, new Color(30, 41, 59));

    public static byte[] exportSingleToPdf(Audit audit) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document();
            document.setMargins(36, 36, 54, 54);
            
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setPageEvent(new PdfHeaderFooterHandler("AUDITORÍA DE EVENTO INDIVIDUAL"));
            document.open();
            
            Paragraph title = new Paragraph("Registro de Auditoría - Evento Individual", TITLE_FONT);
            title.setSpacingAfter(4f);
            document.add(title);

            String cleanSessId = (audit.getIdSesion() != null ? audit.getIdSesion().split("#")[0] : "N/A");
            Paragraph subtitle = new Paragraph("ID Sesión: " + cleanSessId, SUBTITLE_FONT);
            subtitle.setSpacingAfter(14f);
            document.add(subtitle);

            PdfPTable table = new PdfPTable(2);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 3.5f});
            table.setSpacingBefore(10f);

            addTableRow(table, "ID Sesión:", cleanSessId);
            addTableRow(table, "Fecha y Hora:", audit.getFechaHora() != null ? audit.getFechaHora().toString().replace("T", " ") : "N/A");
            addTableRow(table, "Asunto / Evento:", audit.getNombreAuditoria() != null ? audit.getNombreAuditoria() : "N/A");
            addTableRow(table, "Usuario:", audit.getUsuario() != null ? audit.getUsuario().getNombre() : "Sistema");
            addTableRow(table, "Detalles del Cambio:", audit.getDetalleCambio() != null ? audit.getDetalleCambio() : "Sin detalles registrados.");

            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }

    public static byte[] exportListToPdf(List<Audit> audits) {
        return exportMultipleToPdf(audits, "Reporte Completo de Auditoría");
    }

    public static byte[] exportMultipleToPdf(List<Audit> audits, String titleText) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(com.lowagie.text.PageSize.A4.rotate(), 36, 36, 54, 54);
            PdfWriter writer = PdfWriter.getInstance(document, baos);
            writer.setPageEvent(new PdfHeaderFooterHandler("REPORTES DE AUDITORÍA DEL SISTEMA"));
            document.open();
            
            Paragraph title = new Paragraph(titleText != null ? titleText : "Reporte Global de Auditorías", TITLE_FONT);
            title.setSpacingAfter(4f);
            document.add(title);

            Paragraph subtitle = new Paragraph("Total de registros de auditoría: " + (audits != null ? audits.size() : 0), SUBTITLE_FONT);
            subtitle.setSpacingAfter(14f);
            document.add(subtitle);

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.8f, 1.5f, 2.0f, 1.2f, 3.5f});
            table.setHeaderRows(1);

            addTableHeader(table, "ID Sesión");
            addTableHeader(table, "Fecha y Hora");
            addTableHeader(table, "Nombre Auditoría");
            addTableHeader(table, "Usuario");
            addTableHeader(table, "Detalle del Cambio");

            if (audits != null) {
                for (Audit audit : audits) {
                    String rowSessId = audit.getIdSesion() != null ? audit.getIdSesion().split("#")[0] : "N/A";
                    table.addCell(createCell(rowSessId));
                    table.addCell(createCell(audit.getFechaHora() != null ? audit.getFechaHora().toString().replace("T", " ") : "N/A"));
                    table.addCell(createCell(audit.getNombreAuditoria() != null ? audit.getNombreAuditoria() : "N/A"));
                    table.addCell(createCell(audit.getUsuario() != null ? audit.getUsuario().getNombre() : "Sistema"));
                    table.addCell(createCell(audit.getDetalleCambio() != null ? audit.getDetalleCambio() : ""));
                }
            }

            document.add(table);
            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        }
    }

    private static void addTableHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, HEADER_FONT));
        cell.setBackgroundColor(new Color(29, 78, 216)); // Royal Blue #1D4ED8
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private static PdfPCell createCell(String text) {
        PdfPCell cell = new PdfPCell(new Paragraph(text, BODY_FONT));
        cell.setPadding(6f);
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
