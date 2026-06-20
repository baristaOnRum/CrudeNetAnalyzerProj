/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

type LogSeverity = 'INFO' | 'WARN' | 'ERROR' | 'SSL';

interface LogLine {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  message: string;
}

interface LogsExplorerProps {
  searchQuery: string;
}

export const LogsExplorer: React.FC<LogsExplorerProps> = ({ searchQuery }) => {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [activeSeverity, setActiveSeverity] = useState<'ALL' | LogSeverity>('ALL');
  const [isStreaming, setIsStreaming] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        const mappedLogs = data.map((ev: any) => ({
          id: ev.idSesion,
          timestamp: ev.fechaHora ? ev.fechaHora.substring(11, 19) : '00:00:00',
          severity: 'INFO',
          message: ev.nombreEvento + ': ' + ev.detalleCambio
        }));
        // Only update if changes, but for simplicity let's just set it
        setLogs(mappedLogs);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const filteredLogs = logs.filter((log) => {
    const matchesSeverity = activeSeverity === 'ALL' || log.severity === activeSeverity;
    if (!matchesSeverity) return false;

    if (!searchQuery) return true;
    const sTerm = searchQuery.toLowerCase();
    return log.message.toLowerCase().includes(sTerm) || log.timestamp.includes(sTerm) || log.severity.toLowerCase().includes(sTerm);
  });

  const getSeverityStyle = (sev: LogSeverity) => {
    switch (sev) {
      case 'ERROR': return 'text-red-400 font-bold';
      case 'WARN': return 'text-amber-400 font-bold';
      case 'SSL': return 'text-[#10B981] font-bold';
      default: return 'text-[#38BDF8]';
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
            Auditoría visual de seguridad del servidor en tiempo real obtenida desde la base de datos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-slate-700 hover:bg-[#F1F5F9] cursor-pointer transition-colors"
          >
            Limpiar vista
          </button>
          <button
            onClick={() => setIsStreaming((prev) => !prev)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-white shadow-sm transition-all ${
              isStreaming ? 'bg-primary hover:bg-opacity-95' : 'bg-green-600 hover:bg-green-700 font-bold'
            }`}
          >
            {isStreaming ? 'Pausar auto-refresh' : 'Reanudar auto-refresh'}
          </button>
        </div>
      </div>

      <div className="bg-[#0F172A] border border-[#1e293b] rounded-2xl overflow-hidden shadow-xl flex flex-col font-mono h-[520px]">
        <div className="px-5 py-3.5 bg-[#0b0f19] border-b border-[#1e293b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
            </div>
            <span className="text-[#64748B] text-[11px] font-sans font-bold tracking-wider ml-4">
              REGISTROS DEL SISTEMA GLOBAL
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

        <div className="flex-1 p-5 overflow-y-auto space-y-2 text-slate-300 font-mono text-xs leading-normal bg-[#0F172A] content-start">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-slate-500 italic font-sans select-none">
              No se encontraron registros en la base de datos.
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={log.id + '-' + idx}
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
