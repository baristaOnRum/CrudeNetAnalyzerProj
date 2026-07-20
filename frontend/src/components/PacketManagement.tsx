/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './common/Modal';

interface NetworkPacket {
  id: string;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  protocol: string;
  length: number;
  content: string;
  status: string;
  idAnalisis?: number;
}

interface PacketManagementProps {
  activeAnalysisId: number | null;
}



export const PacketManagement: React.FC<PacketManagementProps> = ({ activeAnalysisId }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [exportingState, setExportingState] = useState<'idle' | 'exporting'>('idle');
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterExactDate, setFilterExactDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterContent, setFilterContent] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPackets = async (page = 0) => {
    try {
      const res = await fetch(`/api/packets?page=${page}&size=100`);
      if (res.ok) {
        const data = await res.json();
        const rawList = data.content ?? data;
        if (data.totalPages !== undefined) {
          setTotalPages(data.totalPages);
          setCurrentPage(data.number);
        }
        const mapped = rawList.map((p: any) => ({
          id: p.id ? `PKT-${p.id}` : `PKT-${Math.floor(Math.random() * 90000)}`,
          timestamp: new Date().toISOString().substring(11, 23),
          sourceIp: p.fuente,
          destIp: p.destino,
          protocol: p.tipoPaquete,
          content: p.contenidos || '',
          length: p.longitud ?? (p.contenidos ? p.contenidos.length : 128),
          status: 'allowed',
          idAnalisis: p.idAnalisis
        }));
        setPackets(mapped);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPackets(0);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      fetchPackets(currentPage);
    }, 1800);
    return () => clearInterval(timer);
  }, [isPlaying, activeAnalysisId, currentPage]);

  const handleTogglePlay = () => setIsPlaying(!isPlaying);

  const filteredPackets = packets.filter((p) => {
    // 1. Session filter
    if (activeAnalysisId && p.idAnalisis !== activeAnalysisId) return false;

    // 2. Exact date
    if (filterExactDate) {
      // Very simple matching since timestamp is "HH:mm:ss.mmm" in mapped data currently
      if (!p.timestamp.includes(filterExactDate)) return false;
    } else {
      // 3. Date range
      if (filterStartDate && p.timestamp < filterStartDate) return false;
      if (filterEndDate && p.timestamp > filterEndDate) return false;
    }

    // 4. Packet type
    if (filterType && p.protocol.toLowerCase() !== filterType.toLowerCase()) return false;

    // 5. Content match
    if (filterContent && !p.content.toLowerCase().includes(filterContent.toLowerCase())) return false;

    return true;
  });

  const handleExport = async (type: 'CSV' | 'JSON' | 'PDF') => {
    setExportingState('exporting');
    setExportMessage(`Preparando salida ${type}...`);
    
    if (activeAnalysisId) {
      try {
        if (type === 'PDF') {
          const res = await fetch('/api/reports/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: activeAnalysisId.toString(), reportType: "PDF_PACKETS" })
          });
          if (res.ok) {
            const report = await res.json();
            if (report.downloadUrl) {
              window.open(report.downloadUrl, '_blank');
            }
          }
        } else {
          const response = await fetch(`/api/packets/export/${activeAnalysisId}?format=${type}`);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `session_${activeAnalysisId}_packets.${type.toLowerCase()}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        }
        }
      } catch (e) {
        console.error('Failed to export from backend', e);
      }
    } else {
      if (type === 'PDF') {
        const res = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reportType: "PDF_PACKETS" })
        });
        if (res.ok) {
          const report = await res.json();
          if (report.downloadUrl) window.open(report.downloadUrl, '_blank');
        }
      } else {
        let exportContent = '';
        if (type === 'CSV') {
        exportContent = 'id,timestamp,sourceIp,destIp,protocol,length,content\n';
        exportContent += packets.map(p => `${p.id},${p.timestamp},${p.sourceIp},${p.destIp},${p.protocol},${p.length},${p.content}`).join('\n');
      } else {
        exportContent = JSON.stringify(packets, null, 2);
      }
      
      const dataUri = `data:text/${type === 'CSV' ? 'csv' : 'json'};charset=utf-8,` + encodeURIComponent(exportContent);
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `packets_export.${type.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      }
    }
    
    setExportingState('idle');
    setExportMessage(`Archivo guardado.`);
    setTimeout(() => setExportMessage(null), 3000);
  };

  const getBadge = (proto: string) => {
    if (proto === 'TCP') return 'bg-primary-container text-primary border-primary/20';
    if (proto === 'UDP') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (proto === 'HTTPS') return 'bg-[#ceffdf] text-[#006d45] border-[#006d45]/20';
    if (proto === 'DNS') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  return (
    <div className="space-y-6 font-sans mt-4">

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50">
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1.5 rounded-lg w-max"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt</span>
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>
            
            {showFilters && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <input 
                  type="date" 
                  title="Fecha Exacta" 
                  value={filterExactDate} 
                  onChange={e => setFilterExactDate(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <span className="text-xs text-slate-400">ó rango:</span>
                <input 
                  type="date" 
                  title="Fecha Inicio" 
                  value={filterStartDate} 
                  onChange={e => setFilterStartDate(e.target.value)} 
                  disabled={!!filterExactDate}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-50"
                />
                <input 
                  type="date" 
                  title="Fecha Fin" 
                  value={filterEndDate} 
                  onChange={e => setFilterEndDate(e.target.value)}
                  disabled={!!filterExactDate}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-50"
                />
                <select
                  title="Tipo de Paquete"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-28 bg-white"
                >
                  <option value="">Cualquier Tipo</option>
                  {PROTOCOLS.map(proto => (
                    <option key={proto} value={proto}>{proto}</option>
                  ))}
                </select>
                <input 
                  type="text" 
                  placeholder="Buscar contenido..." 
                  value={filterContent} 
                  onChange={e => setFilterContent(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 md:mt-0">
            <div className="flex items-center gap-2">
              <button onClick={() => handleExport('PDF')} className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold hover:bg-[#F1F5F9]">PDF</button>
              <button onClick={() => handleExport('CSV')} className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold hover:bg-[#F1F5F9]">CSV</button>
              <button onClick={() => handleExport('JSON')} className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold hover:bg-[#F1F5F9]">JSON</button>
            </div>
            <button
              onClick={handleTogglePlay}
              className={`px-4 py-1.5 font-sans font-semibold rounded-lg text-xs tracking-wide transition-all ${isPlaying ? 'bg-primary text-white' : 'bg-green-600 text-white animate-pulse'}`}
            >
              {isPlaying ? 'Pausar DB Stream' : 'Reanudar DB Stream'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-sans font-bold text-[#64748B] uppercase">
                <th className="p-4 pl-6">Marca de Tiempo</th>
                <th className="p-4">IP de Origen</th>
                <th className="p-4">IP de Destino</th>
                <th className="p-4">Protocolo</th>
                <th className="p-4 text-right">Longitud (B)</th>
                <th className="p-4 text-right pr-6">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] font-medium text-[#1E293B]">
              {filteredPackets.map((pkt) => (
                <tr key={pkt.id} className="hover:bg-[#F8FAFC] animate-[fadeIn_0.1s_ease-out]">
                  <td className="p-4 pl-6 text-[#64748B]">{pkt.timestamp}</td>
                  <td className="p-4 font-semibold text-[#0F172A]">{pkt.sourceIp}</td>
                  <td className="p-4 text-[#1E293B]">{pkt.destIp}</td>
                  <td className="p-4"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold tracking-wide ${getBadge(pkt.protocol)} border`}>{pkt.protocol}</span></td>
                  <td className="p-4 text-right font-semibold">{pkt.length}</td>
                  <td className="p-4 text-right pr-6">
                    <button
                      onClick={() => setSelectedPacket(pkt)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-primary border border-primary/20 rounded-md text-xs font-sans font-semibold flex items-center justify-end gap-1 ml-auto transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">visibility</span>
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPackets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#64748B] font-sans text-xs">
                    No se encontraron paquetes para los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-[#E2E8F0] bg-slate-50 rounded-b-xl">
            <span className="text-xs text-slate-500 font-sans">
              Mostrando página {currentPage + 1} de {totalPages} &mdash; 100 paquetes por página
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 0}
                onClick={() => fetchPackets(currentPage - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => fetchPackets(currentPage + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Packet Detail Modal */}
      {selectedPacket && (
        <Modal
          isOpen={!!selectedPacket}
          onClose={() => setSelectedPacket(null)}
          title={`Detalle de Paquete: ${selectedPacket.id}`}
          subtitle="Metadatos y carga útil decodificada de la trama de red"
          icon="inventory_2"
          badge={{ text: selectedPacket.protocol, variant: selectedPacket.protocol === 'TCP' ? 'purple' : 'blue' }}
          fields={[
            { label: 'ID Transacción', value: selectedPacket.id },
            { label: 'Marca de Tiempo', value: selectedPacket.timestamp },
            { label: 'Dirección IP Origen', value: selectedPacket.sourceIp },
            { label: 'Dirección IP Destino', value: selectedPacket.destIp },
            { label: 'Protocolo de Red', value: selectedPacket.protocol },
            { label: 'Tamaño de Carga (Bytes)', value: `${selectedPacket.length} B` },
            { label: 'ID Sesión de Análisis', value: selectedPacket.idAnalisis ? `#${selectedPacket.idAnalisis}` : 'Global / Pasivo' },
            { label: 'Estado de Inspección', value: 'PERMITIDO / INTEGRIDAD VALIDADA' },
            { label: 'Payload Decodificado', value: selectedPacket.content || 'Sin datos de carga útil.', fullWidth: true, isCode: true }
          ]}
        />
      )}
    </div>
  );
};
