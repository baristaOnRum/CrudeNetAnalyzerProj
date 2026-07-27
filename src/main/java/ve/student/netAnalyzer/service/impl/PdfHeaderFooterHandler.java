package ve.student.netAnalyzer.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfTemplate;
import com.lowagie.text.pdf.PdfWriter;

import java.awt.Color;
import java.io.File;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class PdfHeaderFooterHandler extends PdfPageEventHelper {

    private final String documentTitle;
    private PdfTemplate totalPagesTemplate;
    private BaseFont font;
    private Image logoImage;

    public PdfHeaderFooterHandler(String documentTitle) {
        this.documentTitle = documentTitle != null ? documentTitle : "REPORTE DE SISTEMA";
        loadLogo();
    }

    private void loadLogo() {
        try {
            InputStream is = getClass().getResourceAsStream("/Picture1.png");
            if (is != null) {
                byte[] bytes = is.readAllBytes();
                logoImage = Image.getInstance(bytes);
            } else {
                File file = new File("frontend/src/assets/Picture1.png");
                if (file.exists()) {
                    logoImage = Image.getInstance(file.getAbsolutePath());
                }
            }
        } catch (Exception e) {
            System.err.println("Could not load logo image for PDF header: " + e.getMessage());
        }
    }

    @Override
    public void onOpenDocument(PdfWriter writer, Document document) {
        totalPagesTemplate = writer.getDirectContent().createTemplate(30, 16);
        try {
            font = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onEndPage(PdfWriter writer, Document document) {
        PdfContentByte cb = writer.getDirectContent();
        cb.saveState();

        float leftMargin = document.left();
        float rightMargin = document.right();
        float topMargin = document.top();
        float bottomMargin = document.bottom();

        // Colors
        Color titleColor = new Color(15, 23, 42);     // Slate 900
        Color lineColor = new Color(226, 232, 240);    // Slate 200
        Color bannerBg = new Color(29, 78, 216);      // Royal Blue
        Color textColor = new Color(100, 116, 139);    // Slate 500

        // --- 1. MEMBRETE / HEADER ---
        // Document Title (Left aligned - WITHOUT "NETANALYZER | ")
        cb.setFontAndSize(font, 10);
        cb.setColorFill(titleColor);
        cb.beginText();
        cb.setTextMatrix(leftMargin, topMargin + 20);
        cb.showText(documentTitle.toUpperCase());
        cb.endText();

        // Generation Date (Left aligned under title)
        String dateStr = "Emisión: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        cb.setFontAndSize(font, 8);
        cb.setColorFill(textColor);
        cb.beginText();
        cb.setTextMatrix(leftMargin, topMargin + 8);
        cb.showText(dateStr);
        cb.endText();

        // Company Logo (Top Right corner with correct natural aspect ratio)
        if (logoImage != null) {
            try {
                float targetHeight = 18f;
                float aspectRatio = logoImage.getWidth() / logoImage.getHeight();
                float targetWidth = targetHeight * aspectRatio;
                
                logoImage.scaleAbsolute(targetWidth, targetHeight);
                logoImage.setAbsolutePosition(rightMargin - targetWidth, topMargin + 6);
                cb.addImage(logoImage);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Header Divider Line
        cb.setLineWidth(0.75f);
        cb.setColorStroke(lineColor);
        cb.moveTo(leftMargin, topMargin + 2);
        cb.lineTo(rightMargin, topMargin + 2);
        cb.stroke();

        // --- 2. PIE DE PÁGINA / FOOTER ---
        // Blue Footer Banner
        float bannerHeight = 26f;
        float bannerY = bottomMargin - 28f;
        
        cb.setColorFill(bannerBg);
        cb.rectangle(leftMargin, bannerY, rightMargin - leftMargin, bannerHeight);
        cb.fill();

        // Contact text lines inside banner (White text, centered)
        cb.setFontAndSize(font, 7.5f);
        cb.setColorFill(Color.WHITE);

        String line1 = "Bolívar - El Tigre - Maturín    0291-6441738 / 0412-6747686";
        String line2 = "Barcelona - Cumaná - Margarita    0412-5747286";
        
        float line1Width = font.getWidthPoint(line1, 7.5f);
        float line2Width = font.getWidthPoint(line2, 7.5f);
        float centerX = leftMargin + (rightMargin - leftMargin) / 2f;

        cb.beginText();
        cb.setTextMatrix(centerX - (line1Width / 2f), bannerY + 14f);
        cb.showText(line1);
        cb.endText();

        cb.beginText();
        cb.setTextMatrix(centerX - (line2Width / 2f), bannerY + 4f);
        cb.showText(line2);
        cb.endText();

        // Page Numbering "Página X de Y" right below banner
        cb.setFontAndSize(font, 8);
        cb.setColorFill(textColor);

        String pageText = String.format("Página %d de ", writer.getPageNumber());
        float pageTextWidth = font.getWidthPoint(pageText, 8);
        
        cb.beginText();
        cb.setTextMatrix(rightMargin - pageTextWidth - 15, bottomMargin - 38f);
        cb.showText(pageText);
        cb.endText();

        // Template for total page count "Y"
        cb.addTemplate(totalPagesTemplate, rightMargin - 15, bottomMargin - 38f);

        cb.restoreState();
    }

    @Override
    public void onCloseDocument(PdfWriter writer, Document document) {
        if (totalPagesTemplate != null && font != null) {
            totalPagesTemplate.beginText();
            totalPagesTemplate.setFontAndSize(font, 8);
            totalPagesTemplate.setColorFill(new Color(100, 116, 139));
            totalPagesTemplate.showText(String.valueOf(writer.getPageNumber()));
            totalPagesTemplate.endText();
        }
    }
}
