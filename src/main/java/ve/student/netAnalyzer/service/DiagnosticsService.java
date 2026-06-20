package ve.student.netAnalyzer.service;

import ve.student.netAnalyzer.dto.PingResponseDto;

public interface DiagnosticsService {
    PingResponseDto executePing(String target);
}
