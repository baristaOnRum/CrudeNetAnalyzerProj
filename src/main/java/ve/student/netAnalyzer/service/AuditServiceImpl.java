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
        audit.setIdSesion(auditData.getIdSesion());
        audit.setNombreAuditoria(auditData.getNombreAuditoria());
        audit.setDetalleCambio(auditData.getDetalleCambio());
        audit.setFechaHora(auditData.getFechaHora());
        
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
        
        String content = "Audit ID: " + audit.getIdSesion() + ", Name: " + audit.getNombreAuditoria() + ", User: " + (audit.getUsuario() != null ? audit.getUsuario().getId() : "null");
        return content.getBytes();
    }
}
