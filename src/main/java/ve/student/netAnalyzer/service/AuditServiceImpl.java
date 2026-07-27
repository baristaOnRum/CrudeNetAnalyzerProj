package ve.student.netAnalyzer.service;

import org.springframework.stereotype.Service;
import ve.student.netAnalyzer.model.Audit;
import ve.student.netAnalyzer.model.AppUser;
import ve.student.netAnalyzer.model.ExportFormat;
import ve.student.netAnalyzer.dto.AuditDto;
import ve.student.netAnalyzer.dto.AuditFilter;
import ve.student.netAnalyzer.repository.AuditRepository;
import ve.student.netAnalyzer.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditServiceImpl implements AuditService {

    private final AuditRepository repository;
    private final UserRepository userRepository;
    private final SessionManagerService sessionManagerService;

    public AuditServiceImpl(AuditRepository repository, UserRepository userRepository, SessionManagerService sessionManagerService) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.sessionManagerService = sessionManagerService;
    }

    @Override
    public Audit registerAudit(AuditDto auditData) {
        Audit audit = new Audit();
        
        String sessId = auditData.getIdSesion();
        if (sessId == null || sessId.trim().isEmpty()) {
            sessId = sessionManagerService.getUserSessionId();
        }
        if (sessId == null || sessId.trim().isEmpty()) {
            sessId = "SES-SYSTEM";
        }
        
        // Strip any previous hash suffix if re-passing, then append unique PK suffix
        if (sessId.contains("#")) {
            sessId = sessId.split("#")[0];
        }
        String uniqueAuditPk = sessId + "#" + java.util.UUID.randomUUID().toString();
        
        audit.setIdSesion(uniqueAuditPk);
        audit.setNombreAuditoria(auditData.getNombreAuditoria());
        audit.setDetalleCambio(auditData.getDetalleCambio());
        audit.setFechaHora(auditData.getFechaHora() != null ? auditData.getFechaHora() : java.time.LocalDateTime.now());
        
        if (auditData.getIdUsuario() != null) {
            AppUser user = userRepository.findById(auditData.getIdUsuario()).orElse(null);
            audit.setUsuario(user);
        } else if (sessionManagerService.getActiveUser() != null) {
            audit.setUsuario(sessionManagerService.getActiveUser());
        }
        
        return repository.save(audit);
    }

    @Override
    public List<Audit> listAudits(AuditFilter filter) {
        return repository.findAll().stream()
                .filter(e -> filter == null || filter.getNombreAuditoria() == null || filter.getNombreAuditoria().equals(e.getNombreAuditoria()))
                .filter(e -> filter == null || filter.getIdUsuario() == null || (e.getUsuario() != null && filter.getIdUsuario().equals(e.getUsuario().getId())))
                .collect(Collectors.toList());
    }

    @Override
    public Audit getAuditDetails(String auditId) {
        return repository.findById(auditId).orElse(null);
    }

    @Override
    public byte[] exportAudit(String auditId, ExportFormat fmt) {
        Audit audit = getAuditDetails(auditId);
        if (audit == null) return new byte[0];
        
        if (fmt == ExportFormat.PDF) {
            return ve.student.netAnalyzer.service.impl.AuditExporter.exportSingleToPdf(audit);
        }
        
        StringBuilder sb = new StringBuilder();
        if (fmt == ExportFormat.CSV) {
            sb.append("idSesion,nombreAuditoria,detalleCambio,fechaHora,idUsuario\n");
            sb.append(audit.getIdSesion() != null ? audit.getIdSesion() : "").append(",")
              .append(audit.getNombreAuditoria() != null ? audit.getNombreAuditoria() : "").append(",")
              .append(audit.getDetalleCambio() != null ? audit.getDetalleCambio().replace("\n", " ").replace(",", ";") : "").append(",")
              .append(audit.getFechaHora() != null ? audit.getFechaHora() : "").append(",")
              .append(audit.getUsuario() != null ? audit.getUsuario().getId() : "").append("\n");
        } else if (fmt == ExportFormat.JSON) {
            sb.append("{\n")
              .append("  \"idSesion\": \"").append(audit.getIdSesion()).append("\",\n")
              .append("  \"nombreAuditoria\": \"").append(audit.getNombreAuditoria()).append("\",\n")
              .append("  \"detalleCambio\": \"").append(audit.getDetalleCambio() != null ? audit.getDetalleCambio().replace("\n", "\\n") : "").append("\",\n")
              .append("  \"fechaHora\": \"").append(audit.getFechaHora()).append("\",\n")
              .append("  \"idUsuario\": \"").append(audit.getUsuario() != null ? audit.getUsuario().getId() : "").append("\"\n")
              .append("}\n");
        } else {
            sb.append("Audit ID: ").append(audit.getIdSesion())
              .append(", Name: ").append(audit.getNombreAuditoria())
              .append(", User: ").append(audit.getUsuario() != null ? audit.getUsuario().getId() : "null");
        }
        return sb.toString().getBytes();
    }
}
