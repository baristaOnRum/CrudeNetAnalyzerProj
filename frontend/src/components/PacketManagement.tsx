/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Modal } from './common/Modal';

interface NetworkPacket {
  id: string;
  realId?: number;
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

const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'ARP', 'TLS', 'SSH', 'DHCP'];


export const PacketManagement: React.FC<PacketManagementProps> = ({ activeAnalysisId }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [exportingState, setExportingState] = useState<'idle' | 'exporting'>('idle');
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterContent, setFilterContent] = useState('');
  const [filterMinLength, setFilterMinLength] = useState<number | ''>('');
  const [filterMaxLength, setFilterMaxLength] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [metadata, setMetadata] = useState<{ minLength: number; maxLength: number; protocols: string[] }>({
      minLength: 0,
      maxLength: 65535,
      protocols: PROTOCOLS
  });
  const [sessionDate, setSessionDate] = useState<string>('');

  useEffect(() => {
      const fetchMetadata = async () => {
          try {
              const res = await fetch('/api/packets/metadata');
              if (res.ok) {
                  setMetadata(await res.json());
              }
          } catch (e) {
              console.error(e);
          }
      };
      fetchMetadata();
  }, []);

  useEffect(() => {
    if (activeAnalysisId) {
      fetch(`/api/analysis/${activeAnalysisId}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.fechaEjecucion) {
                setSessionDate(data.fechaEjecucion.substring(0, 10));
            }
        }).catch(e => console.error(e));
    }
  }, [activeAnalysisId]);

  const fetchPackets = async (page = currentPage) => {
    if (!activeAnalysisId) {
      setPackets([]);
      return;
    }
    try {
      const criteria = {
          analysisId: activeAnalysisId,
          term: filterContent,
          startDate: filterStartDate && sessionDate ? `${sessionDate}T${filterStartDate}:00` : null,
          endDate: filterEndDate && sessionDate ? `${sessionDate}T${filterEndDate}:59` : null,
          type: filterType === 'Todos' ? null : (filterType || null),
          minLength: filterMinLength || null,
          maxLength: filterMaxLength || null
      };
      const res = await fetch(`/api/packets/search?page=${page}&size=100&sort=${sortField},${sortAsc ? 'asc' : 'desc'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(criteria)
      });
      if (res.ok) {
        const data = await res.json();
        const rawList = data.content ?? data;
        if (data.totalPages !== undefined) {
          setTotalPages(data.totalPages);
          setCurrentPage(data.number);
        }
        const mapped = rawList.map((p: any) => ({
          id: p.id ? `PKT-${p.id}` : `PKT-${Math.floor(Math.random() * 90000)}`,
          realId: p.id,
          timestamp: p.fechaHora || p.timestamp || new Date().toISOString(),
          sourceIp: p.fuente || p.sourceIp,
          destIp: p.destino || p.destIp,
          protocol: p.tipoPaquete || p.protocol,
          content: p.contenidos || p.content || '',
          length: p.longitud ?? (p.contenidos ? p.contenidos.length : p.length ?? 0),
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
  }, [activeAnalysisId, sortField, sortAsc]);

  useEffect(() => {
    const timer = setInterval(() => {
      fetchPackets(currentPage);
    }, 1800);
    return () => clearInterval(timer);
  }, [activeAnalysisId, currentPage, filterContent, filterStartDate, filterEndDate, filterType, filterMinLength, filterMaxLength, sortField, sortAsc, sessionDate]);

  const handleViewDetail = async (pkt: NetworkPacket) => {
    if (pkt.realId) {
      try {
        const res = await fetch(`/api/packets/${pkt.realId}`);
        if (res.ok) {
          const detail = await res.json();
          setSelectedPacket({
            ...pkt,
            content: detail.contenidos || pkt.content,
            length: detail.longitud ?? pkt.length
          });
          return;
        }
      } catch (e) {
        console.error("Failed to load packet details", e);
      }
    }
    setSelectedPacket(pkt);
  };

  const handleExport = async (type: 'CSV' | 'PDF') => {
    setExportingState('exporting');
    setExportMessage(`Preparando salida ${type}...`);
    
    if (activeAnalysisId) {
      try {
        const criteria = {
            analysisId: activeAnalysisId,
            term: filterContent,
            startDate: filterStartDate && sessionDate ? `${sessionDate}T${filterStartDate}:00` : null,
            endDate: filterEndDate && sessionDate ? `${sessionDate}T${filterEndDate}:59` : null,
            type: filterType === 'Todos' ? null : (filterType || null),
            minLength: filterMinLength || null,
            maxLength: filterMaxLength || null
        };
        const res = await fetch(`/api/packets/export?format=${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(criteria)
        });
        if (res.ok) {
           const blob = await res.blob();
           const url = window.URL.createObjectURL(blob);
           const a = document.createElement('a');
           a.href = url;
           a.download = `session_${activeAnalysisId}_packets_filtered.${type.toLowerCase()}`;
           document.body.appendChild(a);
           a.click();
           a.remove();
           window.URL.revokeObjectURL(url);
        } else {
           setExportMessage('Error al exportar los datos.');
        }
      } catch (e) {
        console.error('Failed to export from backend', e);
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
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg shadow-sm w-full">
                <input 
                  type="time" 
                  step="1"
                  title="Hora Inicio" 
                  value={filterStartDate} 
                  onChange={e => setFilterStartDate(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <span className="text-xs text-slate-400">a</span>
                <input 
                  type="time" 
                  step="1"
                  title="Hora Fin" 
                  value={filterEndDate} 
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <select
                  title="Tipo de Paquete"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-28 bg-white"
                >
                  <option value="">Todos</option>
                  {metadata.protocols.map(proto => (
                    <option key={proto} value={proto}>{proto}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1 border border-slate-200 px-2 py-1.5 rounded-lg bg-white">
                   <span className="text-xs text-slate-400 font-bold">Tamaño (B):</span>
                   <input
                      type="number"
                      placeholder={`Mín (${metadata.minLength})`}
                      value={filterMinLength}
                      onChange={e => setFilterMinLength(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-16 px-1 text-xs outline-none"
                      min={metadata.minLength}
                      max={metadata.maxLength}
                   />
                   <span className="text-xs text-slate-400">-</span>
                   <input
                      type="number"
                      placeholder={`Máx (${metadata.maxLength})`}
                      value={filterMaxLength}
                      onChange={e => setFilterMaxLength(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-16 px-1 text-xs outline-none"
                      min={metadata.minLength}
                      max={metadata.maxLength}
                   />
                </div>
                <input 
                  type="text" 
                  placeholder="Buscar contenido..." 
                  value={filterContent} 
                  onChange={e => setFilterContent(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs flex-1 min-w-[150px]"
                />
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 md:mt-0">
            <div className="flex items-center gap-2">
              <button onClick={() => handleExport('PDF')} className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold hover:bg-[#F1F5F9] cursor-pointer">PDF</button>
              <button onClick={() => handleExport('CSV')} className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold hover:bg-[#F1F5F9] cursor-pointer">CSV</button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-sans font-bold text-[#64748B] uppercase">
                <th className="p-4 pl-6 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => { setSortField('timestamp'); setSortAsc(!sortAsc); }}>
                  Marca de Tiempo {sortField === 'timestamp' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => { setSortField('sourceIp'); setSortAsc(!sortAsc); }}>
                  IP de Origen {sortField === 'sourceIp' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => { setSortField('destIp'); setSortAsc(!sortAsc); }}>
                  IP de Destino {sortField === 'destIp' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => { setSortField('protocol'); setSortAsc(!sortAsc); }}>
                  Protocolo {sortField === 'protocol' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => { setSortField('length'); setSortAsc(!sortAsc); }}>
                  Longitud (B) {sortField === 'length' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 text-right pr-6">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] font-medium text-[#1E293B]">
              {!activeAnalysisId ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 bg-slate-50 italic">
                    <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">lock</span>
                    Por favor, seleccione o inicie una sesión en el panel de Análisis para ver sus paquetes.
                  </td>
                </tr>
              ) : packets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">No hay paquetes que coincidan con los filtros.</td>
                </tr>
              ) : (
                packets.map((pkt) => (
                  <tr key={pkt.id} className="hover:bg-[#F8FAFC] animate-[fadeIn_0.1s_ease-out]">
                    <td className="p-4 pl-6 text-[#64748B]">{pkt.timestamp}</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{pkt.sourceIp}</td>
                    <td className="p-4 text-[#1E293B]">{pkt.destIp}</td>
                    <td className="p-4"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold tracking-wide ${getBadge(pkt.protocol)} border`}>{pkt.protocol}</span></td>
                    <td className="p-4 text-right font-semibold">{pkt.length}</td>
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => handleViewDetail(pkt)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-primary border border-primary/20 rounded-md text-xs font-sans font-semibold flex items-center justify-end gap-1 ml-auto transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">visibility</span>
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
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
