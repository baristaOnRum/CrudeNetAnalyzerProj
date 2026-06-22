package ve.student.netAnalyzer.service;

import ve.student.netAnalyzer.model.Audit;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.AuditDto;
import ve.student.netAnalyzer.dto.AuditFilter;

import java.util.List;

public interface AuditService {
    Audit registerAudit(AuditDto auditData);
    List<Audit> listAudits(AuditFilter filter);
    Audit getAuditDetails(String auditId);
    byte[] exportAudit(String auditId, ExportFormat fmt);
}
