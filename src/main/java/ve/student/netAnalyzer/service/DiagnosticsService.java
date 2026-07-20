package ve.student.netAnalyzer.service;

import ve.student.netAnalyzer.dto.PingResponseDto;
import ve.student.netAnalyzer.dto.TraceHopDto;
import java.util.List;

public interface DiagnosticsService {
    PingResponseDto executePing(String target);
    List<TraceHopDto> executeTraceroute(String target);
}
