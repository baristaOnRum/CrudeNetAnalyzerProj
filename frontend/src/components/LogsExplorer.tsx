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
  { id: '1', timestamp: '05:18:50.112', severity: 'SSL', message: 'TLS 1.3 handshake sequence completed successfully on port 443.' },
  { id: '2', timestamp: '05:18:52.422', severity: 'INFO', message: 'Heartbeat signal broadcasted to global telemetry authority: 200 OK.' },
  { id: '3', timestamp: '05:18:53.901', severity: 'WARN', message: 'Slight latency spike (122ms) detected on local edge autonomous node.' },
  { id: '4', timestamp: '05:18:57.835', severity: 'INFO', message: 'Node auth token refreshed. Virtual adapter secure session valid.' },
  { id: '5', timestamp: '05:19:01.430', severity: 'SSL', message: 'Cipher sequence initialized: SHA256 cryptographic verification optimal.' },
  { id: '6', timestamp: '05:19:03.361', severity: 'ERROR', message: 'Dropping packet ID PKT-814032 - validation signature mismatch.' },
  { id: '7', timestamp: '05:19:05.336', severity: 'INFO', message: 'Operator sarah.connor logged into admin node console.' },
  { id: '8', timestamp: '05:19:07.120', severity: 'WARN', message: 'Trace path hop count (14) exceeds standard SLA parameter (12).' }
];

const LOG_MESSAGES = [
  'Refreshed virtual routing tables for IPv4 packet forwarding.',
  'Encrypted socket tunnel established with peer node AS-EAST-09.',
  'TCP checksum validation successful for incoming segment.',
  'Rate limiter active: 1.2k packets/sec buffered successfully.',
  'SSL alert: client connection closed gracefully by peer endpoint.',
  'Anomalous traffic burst detected on port 80 - analyzing signatures...',
  'Injected test ICMP ping sequence into gateway router interface.',
  'SOC2 compliance check complete: security policies optimal.'
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
            Logs Explorer
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Real-time visual node security audit, validation heartbeats, and packet warning telemetry feeds.
          </p>
        </div>

        {/* Live streaming switch states controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-slate-700 hover:bg-[#F1F5F9] cursor-pointer transition-colors"
          >
            Clear Telemetry logs
          </button>
          <button
            onClick={() => setIsStreaming((prev) => !prev)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer text-white shadow-sm transition-all ${
              isStreaming 
                ? 'bg-primary hover:bg-opacity-95' 
                : 'bg-green-600 hover:bg-green-700 font-bold'
            }`}
          >
            {isStreaming ? 'Pause Stream' : 'Resume live Logs stream'}
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
              SECURE CONNECT TERMINAL OVERLAY
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
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Logs visual logs list */}
        <div className="flex-1 p-5 overflow-y-auto space-y-2 text-slate-300 font-mono text-xs leading-normal bg-[#0F172A] content-start">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center text-slate-500 italic font-sans select-none">
              No matching diagnostic log heartbeats tracked in buffer matching severities bounds.
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
