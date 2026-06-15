/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NetworkSession } from '../types';

// Prepopulated static historical data sessions list representing screenshot content
const HISTORICAL_SESSIONS: NetworkSession[] = [
  {
    id: 'NW-8842-X',
    timestamp: '2023-11-20 14:32:05',
    nodeId: 'US-WEST-04',
    duration: '02:14:55',
    status: 'Completed',
    totalPackets: '1.28M',
    peakThroughput: '4.2 Gbps',
    primaryProtocol: 'TCP',
    primaryProtocolPercent: 74,
    anomaliesCount: 3
  },
  {
    id: 'NW-8839-A',
    timestamp: '2023-11-20 09:15:22',
    nodeId: 'EU-CENT-01',
    duration: '08:45:10',
    status: 'Completed',
    totalPackets: '5.14M',
    peakThroughput: '8.9 Gbps',
    primaryProtocol: 'TCP',
    primaryProtocolPercent: 82,
    anomaliesCount: 0
  },
  {
    id: 'NW-8791-Z',
    timestamp: '2023-11-19 22:00:00',
    nodeId: 'AS-EAST-09',
    duration: '00:30:00',
    status: 'Archived',
    totalPackets: '0.45M',
    peakThroughput: '1.8 Gbps',
    primaryProtocol: 'UDP',
    primaryProtocolPercent: 58,
    anomaliesCount: 1
  },
  {
    id: 'NW-8755-B',
    timestamp: '2023-11-19 18:45:12',
    nodeId: 'US-EAST-02',
    duration: '04:12:33',
    status: 'Completed',
    totalPackets: '3.12M',
    peakThroughput: '6.5 Gbps',
    primaryProtocol: 'HTTPS',
    primaryProtocolPercent: 66,
    anomaliesCount: 5
  },
  {
    id: 'NW-8720-Y',
    timestamp: '2023-11-19 12:10:05',
    nodeId: 'BR-SA-01',
    duration: '01:55:20',
    status: 'Failed',
    totalPackets: '0.89M',
    peakThroughput: '0.2 Gbps',
    primaryProtocol: 'ICMP',
    primaryProtocolPercent: 44,
    anomaliesCount: 12
  }
];

export const ReportsConsole: React.FC = () => {
  const [sessions, setSessions] = useState<NetworkSession[]>(HISTORICAL_SESSIONS);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'summary' | 'technical' | 'security'>('summary');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generationOutput, setGenerationOutput] = useState<string | null>(null);

  // Derive active session
  const activeSession = sessions.find((s) => s.id === selectedSessionId) || null;

  const handleSessionClick = (id: string) => {
    setSelectedSessionId(id);
  };

  // Compile generate report action mock
  const handleGenerateReport = () => {
    if (!activeSession) {
      alert('Por favor seleccione una sesión del historial primero.');
      return;
    }

    setGeneratingReport(true);
    setGenerationOutput(null);

    setTimeout(() => {
      setGeneratingReport(false);
      setGenerationOutput(`Successfully compiled ${reportType.toUpperCase()} file output for packet trace ${activeSession.id}. PDF formatted report downloaded!`);
      
      // Real file download trigger
      const mockBlobText = `NetWatch Pro ${reportType.toUpperCase()} Security Audit Log Report\nSession ID: ${activeSession.id}\nDate: ${activeSession.timestamp}\nDuration: ${activeSession.duration}\nNode: ${activeSession.nodeId}\nPrimary proto check: ${activeSession.primaryProtocol} (${activeSession.primaryProtocolPercent}%)`;
      const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(mockBlobText);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `NetWatch_Report_${activeSession.id}_${reportType}.txt`);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);

      setTimeout(() => setGenerationOutput(null), 4500);
    }, 1800);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title banners header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2 select-none">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] font-sans leading-none flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">picture_as_pdf</span>
            Generar Reportes
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Configure y compile datos de sesiones de análisis de red activas o históricas.
          </p>
        </div>

        {/* System ready diagnostics indicator badge */}
        <div>
          <span className="bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0] px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider flex items-center gap-2 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            SYSTEM READY
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Session selector card list taking span 8 */}
        <section className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden flex flex-col shadow-sm">
          {/* Card title container */}
          <div className="p-5 border-b border-[#E2E8F0] bg-white flex justify-between items-center select-none">
            <h3 className="font-bold text-base text-[#0F172A]">
              Historial de Sesiones
            </h3>
            <div className="flex gap-2">
              <button className="p-1.5 hover:bg-[#F1F5F9] hover:text-[#0F172A] rounded-lg transition-colors cursor-pointer text-[#64748B]" title="Filter list">
                <span className="material-symbols-outlined text-[19px]">filter_list</span>
              </button>
              <button 
                onClick={() => setSelectedSessionId(null)}
                className="p-1.5 hover:bg-[#F1F5F9] hover:text-[#0F172A] rounded-lg transition-colors cursor-pointer text-[#64748B]"
                title="Clears selection"
              >
                <span className="material-symbols-outlined text-[19px]">refresh</span>
              </button>
            </div>
          </div>

          {/* Table list representation */}
          <div className="overflow-x-auto flex-1 bg-white">
            <table className="w-full border-collapse font-sans text-left">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] select-none text-[10px] font-mono tracking-wider font-bold text-[#64748B] uppercase">
                  <th className="p-4 pl-6">Session ID</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Node ID</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4 pr-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] font-sans text-[13px] font-semibold text-[#1E293B]">
                {sessions.map((ses) => (
                  <tr
                    key={ses.id}
                    onClick={() => handleSessionClick(ses.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedSessionId === ses.id
                        ? 'bg-[#F1F5F9] text-primary border-l-4 border-primary'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <td className="p-4 pl-6 text-primary font-bold font-mono">
                      {ses.id}
                    </td>
                    <td className="p-4 text-[#1E293B]">
                      {ses.timestamp}
                    </td>
                    <td className="p-4 font-mono text-[12px] text-[#64748B]">
                      {ses.nodeId}
                    </td>
                    <td className="p-4 text-[#64748B] font-mono">
                      {ses.duration}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <span className="inline-flex items-center gap-1.5 text-xs font-sans">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          ses.status === 'Completed' 
                            ? 'bg-[#0284C7]' 
                            : ses.status === 'Archived' 
                              ? 'bg-amber-500' 
                              : 'bg-red-500'
                        }`} />
                        {ses.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sidebar report configuration side elements panel cols span 4 */}
        <aside className="col-span-12 lg:col-span-4 flex flex-col gap-6 select-none animate-[fadeIn_0.3s_ease-out]">
          
          {/* Settings Tune block card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-sm text-[#0F172A] mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">tune</span>
              Configuración
            </h3>

            <div className="space-y-5">
              
              {/* Type checkboxes list */}
              <div>
                <label className="text-[10px] font-sans tracking-wider font-extrabold text-[#64748B] block mb-2.5 uppercase">
                  Report Type
                </label>
                <div className="space-y-2">
                  
                  {/* Option 1: Summary */}
                  <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    reportType === 'summary' 
                      ? 'bg-[#F1F5F9] border-primary' 
                      : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                  }`}>
                    <input 
                      type="radio"
                      name="report_type_radio"
                      checked={reportType === 'summary'}
                      onChange={() => setReportType('summary')}
                      className="text-primary focus:ring-primary rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#0F172A]">Summary</p>
                      <p className="text-[10px] text-[#64748B]">High-level KPIs and trends</p>
                    </div>
                  </label>

                  {/* Option 2: Full Technical */}
                  <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    reportType === 'technical' 
                      ? 'bg-[#F1F5F9] border-primary' 
                      : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                  }`}>
                    <input 
                      type="radio"
                      name="report_type_radio"
                      checked={reportType === 'technical'}
                      onChange={() => setReportType('technical')}
                      className="text-primary focus:ring-primary rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#0F172A]">Full Technical</p>
                      <p className="text-[10px] text-[#64748B]">Deep packet & latency analysis</p>
                    </div>
                  </label>

                  {/* Option 3: Security Audit */}
                  <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                    reportType === 'security' 
                      ? 'bg-[#F1F5F9] border-primary' 
                      : 'bg-white border-[#E2E8F0] hover:border-slate-300'
                  }`}>
                    <input 
                      type="radio"
                      name="report_type_radio"
                      checked={reportType === 'security'}
                      onChange={() => setReportType('security')}
                      className="text-primary focus:ring-primary rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#0F172A]">Security Audit</p>
                      <p className="text-[10px] text-[#64748B]">Threat detection & CVE mapping</p>
                    </div>
                  </label>

                </div>
              </div>

              {/* Format Select */}
              <div>
                <label className="text-[10px] font-sans tracking-wider font-extrabold text-[#64748B] block mb-2 uppercase">
                  Output Format
                </label>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-[#F1F5F9] border border-primary rounded-lg font-mono text-xs text-primary font-bold shadow-sm cursor-pointer hover:bg-opacity-80 transition-colors">
                    PDF FORMAT
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Session Preview Details Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm relative overflow-hidden flex-1 min-h-[300px] flex flex-col">
            <h3 className="text-xs font-bold text-[#64748B] mb-3 block uppercase tracking-wider">Previsualización</h3>

            {activeSession ? (
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9] mb-4">
                    <span className="font-mono text-primary font-bold text-sm tracking-widest">
                      {activeSession.id}
                    </span>
                    <span className="bg-[#10B981]/10 text-[#10B981] text-[9px] font-sans font-bold px-2 py-0.5 rounded border border-[#10B981]/20 uppercase">
                      Ready for Export
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-sans font-bold text-[#64748B] uppercase">Total Packets</p>
                      <p className="text-base font-extrabold text-[#0F172A] font-mono mt-0.5">{activeSession.totalPackets}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-sans font-bold text-[#64748B] uppercase">Peak Throughput</p>
                      <p className="text-base font-extrabold text-[#0F172A] font-mono mt-0.5">{activeSession.peakThroughput}</p>
                    </div>

                    <div className="col-span-2 mt-2">
                      <p className="text-[9px] font-sans font-bold text-[#64748B] uppercase mb-1">Primary Protocol Ratio</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-[#F1F5F9] h-2 rounded-full overflow-hidden border border-[#E2E8F0]/30 animate-pulse">
                          <div 
                            className="bg-primary h-full rounded-full transition-all duration-300" 
                            style={{ width: `${activeSession.primaryProtocolPercent}%` }} 
                          />
                        </div>
                        <span className="font-mono text-xs text-[#1E293B] font-bold whitespace-nowrap">
                          {activeSession.primaryProtocol} ({activeSession.primaryProtocolPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Anomalies alert display */}
                <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">warning</span>
                  <p className="text-[11px] text-amber-800 leading-normal font-sans font-semibold">
                    {activeSession.anomaliesCount} network anomalies detected in session trace scan. Review logs before finalizing Security reports file.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6 bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0]">
                <p className="text-[#64748B] text-xs italic">
                  Seleccione una sesión del historial para ver estadísticas rápidas.
                </p>
              </div>
            )}
          </div>

          {/* Action trigger button */}
          <button 
            onClick={handleGenerateReport}
            disabled={generatingReport || !selectedSessionId}
            className={`w-full py-3 px-4 text-white font-sans text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-transform duration-100 cursor-pointer ${
              selectedSessionId 
                ? 'bg-primary hover:bg-opacity-95' 
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            {generatingReport ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                COMPILING FILES REPORT...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                GENERATE REPORT
              </>
            )}
          </button>

          {generationOutput && (
            <div className="bg-green-50 border border-green-200 text-green-800 text-xs p-3 rounded-lg leading-normal animate-[fadeIn_0.2s_ease-out]">
              {generationOutput}
            </div>
          )}

        </aside>
      </div>

      {/* Decorative footer metrics session bottom row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        
        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 text-primary">
            <span className="material-symbols-outlined">cloud_download</span>
          </div>
          <div>
            <p className="text-[9px] font-mono font-bold text-[#64748B] uppercase tracking-widest">Storage Used</p>
            <p className="text-base font-bold text-[#0F172A]">14.2 GB / 50 GB</p>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 bg-teal-100/30 rounded-full flex items-center justify-center border border-teal-200 text-[#0F766E]">
            <span className="material-symbols-outlined">history</span>
          </div>
          <div>
            <p className="text-[9px] font-mono font-bold text-[#64748B] uppercase tracking-widest">Last Export</p>
            <p className="text-base font-bold text-[#0F172A]">15 min ago</p>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-4 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="w-11 h-11 bg-amber-100/30 rounded-full flex items-center justify-center border border-amber-200 text-amber-500 font-bold">
            <span className="material-symbols-outlined">shield</span>
          </div>
          <div>
            <p className="text-[9px] font-mono font-bold text-[#64748B] uppercase tracking-widest">Compliance</p>
            <p className="text-base font-bold text-[#0F172A]">SOC2 Certified</p>
          </div>
        </div>

      </section>

    </div>
  );
};
