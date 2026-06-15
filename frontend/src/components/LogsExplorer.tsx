/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

// Log category helper
type LogSeverity = 'INFO' | 'WARN' | 'ERROR' | 'SSL';

interface LogLine {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  message: string;
}

// Preloaded set of static initial logs
const INITIAL_LOG_DB: LogLine[] = [
  { id: '1', timestamp: '05:18:50.112', severity: 'SSL', message: 'Secuencia de handshake TLS 1.3 completada con éxito en el puerto 443.' },
  { id: '2', timestamp: '05:18:52.422', severity: 'INFO', message: 'Señal de latido transmitida al servicio de telemetría: 200 OK.' },
  { id: '3', timestamp: '05:18:53.901', severity: 'WARN', message: 'Ligero pico de latencia (122ms) detectado en la conexión local.' },
  { id: '4', timestamp: '05:18:57.835', severity: 'INFO', message: 'Token de autenticación de cliente renovado. Sesión segura de adaptador virtual válida.' },
  { id: '5', timestamp: '05:19:01.430', severity: 'SSL', message: 'Secuencia de cifrado inicializada: verificación criptográfica SHA256 óptima.' },
  { id: '6', timestamp: '05:19:03.361', severity: 'ERROR', message: 'Descartando paquete ID PKT-814032 - discrepancia en firma de validación.' },
  { id: '7', timestamp: '05:19:05.336', severity: 'INFO', message: 'La operadora sarah.connor inició sesión en la consola del sistema.' },
  { id: '8', timestamp: '05:19:07.120', severity: 'WARN', message: 'El conteo de saltos de traza (14) excede el parámetro estándar SLA (12).' }
];

const LOG_MESSAGES = [
  'Tablas de enrutamiento virtual actualizadas para el reenvío de paquetes IPv4.',
  'Túnel de socket cifrado establecido con el extremo peer AS-EAST-09.',
  'Validación de suma de verificación TCP exitosa para el segmento entrante.',
  'Limitador de velocidad activo: 1.2k paquetes/seg almacenados en búfer con éxito.',
  'Alerta SSL: conexión de cliente cerrada de forma segura por el extremo peer.',
  'Ráfaga de tráfico anómala detectada en el puerto 80 - analizando firmas...',
  'Secuencia de ping ICMP de prueba inyectada en la interfaz del enrutador de puerta de enlace.',
  'Verificación de cumplimiento SOC2 completada: políticas de seguridad óptimas.'
];

interface LogsExplorerProps {
  searchQuery: string;
}

export const LogsExplorer: React.FC<LogsExplorerProps> = ({ searchQuery }) => {
  const [logs, setLogs] = useState<LogLine[]>(INITIAL_LOG_DB);
  const [activeSeverity, setActiveSeverity] = useState<'ALL' | LogSeverity>('ALL');
  const [isStreaming, setIsStreaming] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs terminal window to the bottom when new logs stream in
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Streaming dynamic generator loop
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const date = new Date();
        const stamp = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}.${String(date.getMilliseconds()).padStart(3, '0')}`;
        
        const severities: LogSeverity[] = ['INFO', 'INFO', 'WARN', 'ERROR', 'SSL', 'INFO'];
        const chosenSeverity = severities[Math.floor(Math.random() * severities.length)];
        const chosenMessage = LOG_MESSAGES[Math.floor(Math.random() * LOG_MESSAGES.length)];

        const newline: LogLine = {
          id: String(prev.length + 1),
          timestamp: stamp,
          severity: chosenSeverity,
          message: chosenMessage
        };

        const updated = [...prev, newline];
        // Keep up to 50 logs total in the buffer for memory safety
        if (updated.length > 50) {
          updated.shift();
        }
        return updated;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Filters logs based on search term and active severity category
  const filteredLogs = logs.filter((log) => {
    const matchesSeverity = activeSeverity === 'ALL' || log.severity === activeSeverity;
    if (!matchesSeverity) return false;

    if (!searchQuery) return true;
    const sTerm = searchQuery.toLowerCase();
    return log.message.toLowerCase().includes(sTerm) || log.timestamp.includes(sTerm) || log.severity.toLowerCase().includes(sTerm);
  });

  const getSeverityStyle = (sev: LogSeverity) => {
    switch (sev) {
      case 'ERROR':
        return 'text-red-400 font-bold';
      case 'WARN':
        return 'text-amber-400 font-bold';
      case 'SSL':
        return 'text-[#10B981] font-bold';
      default:
        return 'text-[#38BDF8]';
    }
  };

  const handleClear = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
            Explorador de Registros
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Auditoría visual de seguridad del servidor en tiempo real, latidos de validación y flujos de telemetría de advertencia de paquetes.
          </p>
        </div>

        {/* Live streaming switch states controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-slate-700 hover:bg-[#F1F5F9] cursor-pointer transition-colors"
          >
            Limpiar registros
          </button>
          <button
            onClick={() => setIsStreaming((prev) => !prev)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-white shadow-sm transition-all ${
              isStreaming 
                ? 'bg-primary hover:bg-opacity-95' 
                : 'bg-green-600 hover:bg-green-700 font-bold'
            }`}
          >
            {isStreaming ? 'Pausar transmisión' : 'Reanudar transmisión en vivo'}
          </button>
        </div>
      </div>

      {/* Terminal window box */}
      <div className="bg-[#0F172A] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl flex flex-col font-mono h-[520px]">
        {/* Terminal Header control bar */}
        <div className="px-5 py-3.5 bg-[#0b0f19] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
            </div>
            <span className="text-[#64748B] text-[11px] font-sans font-bold tracking-wider ml-4">
              PANEL DE TERMINAL DE CONEXIÓN SEGURA
            </span>
          </div>

          <div className="flex border border-[#1e293b] rounded-lg overflow-hidden text-[10px] font-sans leading-none">
            {(['ALL', 'INFO', 'WARN', 'ERROR', 'SSL'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setActiveSeverity(sev)}
                className={`px-3 py-1.5 cursor-pointer border-r border-[#1e293b] last:border-none font-bold ${
                  activeSeverity === sev
                    ? 'bg-[#1e293b] text-white font-extrabold'
                    : 'text-[#64748B] bg-[#0b0f19] hover:text-white'
                }`}
              >
                {sev === 'ALL' ? 'TODOS' : sev}
              </button>
            ))}
          </div>
        </div>

        {/* Logs visual logs list */}
        <div className="flex-1 p-5 overflow-y-auto space-y-2 text-slate-300 font-mono text-xs leading-normal bg-[#0F172A] content-start">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-slate-500 italic font-sans select-none">
              No se encontraron registros de diagnóstico en el búfer que coincidan con la severidad seleccionada.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 hover:bg-[#1e293b]/50 py-0.5 px-1.5 rounded transition-colors animate-[fadeIn_0.1s_ease-out]"
              >
                <span className="text-slate-500 flex-shrink-0 select-none">
                  {log.timestamp}
                </span>
                <span className={`w-14 text-center font-bold flex-shrink-0 select-none ${getSeverityStyle(log.severity)}`}>
                  [{log.severity}]
                </span>
                <span className="text-[#E2E8F0]">
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
};
