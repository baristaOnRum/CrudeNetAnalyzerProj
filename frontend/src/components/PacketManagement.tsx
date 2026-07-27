/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Modal } from './common/Modal';
import { formatDateVE, formatDateForCriteria } from '../utils/dateUtils';
import { DateInput } from './common/DateInput';

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
  isMonitoring?: boolean;
}

const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'ARP', 'TLS', 'SSH', 'DHCP'];


export const PacketManagement: React.FC<PacketManagementProps> = ({ activeAnalysisId, isMonitoring = false }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [resolveDns, setResolveDns] = useState(true);
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [exportingState, setExportingState] = useState<'idle' | 'exporting'>('idle');
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);

  const [filterDate, setFilterDate] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterContent, setFilterContent] = useState('');
  const [filterMinLength, setFilterMinLength] = useState<number | ''>('');
  const [filterMaxLength, setFilterMaxLength] = useState<number | ''>('');

  const [appliedDate, setAppliedDate] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');
  const [appliedType, setAppliedType] = useState('');
  const [appliedContent, setAppliedContent] = useState('');
  const [appliedMinLength, setAppliedMinLength] = useState<number | ''>('');
  const [appliedMaxLength, setAppliedMaxLength] = useState<number | ''>('');

  const handleApplyFilters = () => {
    setAppliedDate(filterDate);
    setAppliedStartDate(filterStartDate);
    setAppliedEndDate(filterEndDate);
    setAppliedType(filterType);
    setAppliedContent(filterContent);
    setAppliedMinLength(filterMinLength);
    setAppliedMaxLength(filterMaxLength);
    
    // Explicitly run query with new filter values regardless of isPlaying pause state
    fetchPackets(0, true, {
      date: filterDate,
      startDate: filterStartDate,
      endDate: filterEndDate,
      type: filterType,
      content: filterContent,
      minLength: filterMinLength,
      maxLength: filterMaxLength
    });
  };

  const handleClearFilters = () => {
    setFilterDate('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterType('');
    setFilterContent('');
    setFilterMinLength('');
    setFilterMaxLength('');
    setAppliedDate('');
    setAppliedStartDate('');
    setAppliedEndDate('');
    setAppliedType('');
    setAppliedContent('');
    setAppliedMinLength('');
    setAppliedMaxLength('');

    // Explicitly run cleared query regardless of isPlaying pause state
    fetchPackets(0, true, {
      date: '',
      startDate: '',
      endDate: '',
      type: '',
      content: '',
      minLength: '',
      maxLength: ''
    });
  };

  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    setPageInput(String(currentPage + 1));
  }, [currentPage]);

  const handlePageSubmit = () => {
    let p = parseInt(pageInput, 10);
    if (isNaN(p) || p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setPageInput(String(p));
    if (p - 1 !== currentPage) {
      fetchPackets(p - 1, true);
    }
  };

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
                  const data = await res.json();
                  setMetadata({
                      minLength: data?.minLength ?? 0,
                      maxLength: data?.maxLength ?? 65535,
                      protocols: Array.isArray(data?.protocols) ? data.protocols : PROTOCOLS
                  });
              }
          } catch (e) {
              console.error(e);
          }

          try {
              const dnsRes = await fetch('/api/configurations/DEFAULT_AUTO_DNS_RESOLVE');
              if (dnsRes.ok) {
                  const dnsData = await dnsRes.json();
                  if (dnsData && dnsData.valorSeleccionado !== undefined) {
                      setResolveDns(dnsData.valorSeleccionado === 'true');
                  }
              }
          } catch (e) {
              console.error("Could not fetch DEFAULT_AUTO_DNS_RESOLVE setting", e);
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

  const buildFullDateTimeString = (datePart: string | null | undefined, timePart: string | null | undefined, isStart: boolean): string | null => {
    if (!timePart && !datePart) return null;
    
    const d = (datePart && datePart.trim()) ? datePart.trim() : (sessionDate || new Date().toISOString().substring(0, 10));
    
    if (!timePart || !timePart.trim()) {
      return formatDateForCriteria(`${d} ${isStart ? '00:00:00' : '23:59:59'}`, isStart);
    }
    
    let t = timePart.trim();
    const tParts = t.split(':');
    if (tParts.length === 2) {
      t = `${t}:${isStart ? '00' : '59'}`;
    } else if (tParts.length === 1) {
      t = `${t}:00:00`;
    }
    
    return formatDateForCriteria(`${d} ${t}`, isStart);
  };

  const fetchPackets = async (
    page = currentPage, 
    showLoading = false,
    filterOverrides?: {
      date?: string;
      startDate?: string;
      endDate?: string;
      type?: string;
      content?: string;
      minLength?: number | '';
      maxLength?: number | '';
    }
  ) => {
    if (!activeAnalysisId) {
      setPackets([]);
      return;
    }

    const effDate = filterOverrides?.date !== undefined ? filterOverrides.date : appliedDate;
    const effStart = filterOverrides?.startDate !== undefined ? filterOverrides.startDate : appliedStartDate;
    const effEnd = filterOverrides?.endDate !== undefined ? filterOverrides.endDate : appliedEndDate;
    const effType = filterOverrides?.type !== undefined ? filterOverrides.type : appliedType;
    const effContent = filterOverrides?.content !== undefined ? filterOverrides.content : appliedContent;
    const effMin = filterOverrides?.minLength !== undefined ? filterOverrides.minLength : appliedMinLength;
    const effMax = filterOverrides?.maxLength !== undefined ? filterOverrides.maxLength : appliedMaxLength;

    if (showLoading) {
      Swal.fire({ title: 'Cargando paquetes...', text: 'Filtrando resultados', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    }
    try {
      const criteria = {
          analysisId: activeAnalysisId,
          term: effContent,
          startDate: buildFullDateTimeString(effDate, effStart, true),
          endDate: buildFullDateTimeString(effDate, effEnd, false),
          type: (effType === 'Todos' || effType === 'Tipo...' || !effType) ? null : effType,
          minLength: effMin || null,
          maxLength: effMax || null
      };
      const res = await fetch(`/api/packets/search?page=${page}&size=100&sort=${sortField},${sortAsc ? 'asc' : 'desc'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(criteria)
      });
      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
        if (data.totalPages !== undefined) {
          setTotalPages(data.totalPages);
          setCurrentPage(data.number);
        }
        const mapped = rawList.map((p: any, idx: number) => ({
          id: p.id ? `PKT-${p.id}` : `PKT-ROW-${idx}`,
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
        if (showLoading) Swal.close();
      }
    } catch (e) {
      console.error(e);
      if (showLoading) Swal.fire('Error', 'Fallo al buscar paquetes', 'error');
    }
  };

  useEffect(() => {
    fetchPackets(0, true); // true for initial load/filter change
  }, [activeAnalysisId, sortField, sortAsc, appliedDate, appliedContent, appliedStartDate, appliedEndDate, appliedType, appliedMinLength, appliedMaxLength]);

  useEffect(() => {
    // Only auto-poll if isPlaying is true AND user is on page 0 (live view)
    if (!isPlaying || currentPage !== 0) return;
    const timer = setInterval(() => {
      fetchPackets(0, false);
    }, 3000);
    return () => clearInterval(timer);
  }, [activeAnalysisId, currentPage, isPlaying, appliedDate, appliedContent, appliedStartDate, appliedEndDate, appliedType, appliedMinLength, appliedMaxLength, sortField, sortAsc, sessionDate]);

  const handleViewDetail = async (pkt: NetworkPacket) => {
    if (pkt.realId) {
      try {
        Swal.fire({ title: 'Cargando detalles...', text: 'Obteniendo la carga útil completa del paquete', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await fetch(`/api/packets/${pkt.realId}`);
        if (res.ok) {
          const detail = await res.json();
          setSelectedPacket({
            ...pkt,
            content: detail.contenidos || pkt.content,
            length: detail.longitud ?? pkt.length
          });
          Swal.close();
          return;
        } else {
          Swal.fire('Error', 'Fallo al obtener detalles', 'error');
        }
      } catch (e) {
        console.error("Failed to load packet details", e);
        Swal.fire('Error', 'Error de conexión', 'error');
      }
    }
    setSelectedPacket(pkt);
  };

  const handleExport = async (type: 'CSV' | 'PDF') => {
    if (activeAnalysisId) {
      try {
        Swal.fire({ title: `Exportando a ${type}...`, text: 'Por favor espere.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const criteria = {
            analysisId: activeAnalysisId,
            term: appliedContent,
            startDate: buildFullDateTimeString(appliedDate, appliedStartDate, true),
            endDate: buildFullDateTimeString(appliedDate, appliedEndDate, false),
            type: (appliedType === 'Todos' || appliedType === 'Tipo...' || !appliedType) ? null : appliedType,
            minLength: appliedMinLength || null,
            maxLength: appliedMaxLength || null,
            resolveDns: resolveDns
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
           Swal.close();
        } else {
           Swal.fire('Error', 'Error al exportar los datos.', 'error');
        }
      } catch (e) {
        console.error('Failed to export from backend', e);
        Swal.fire('Error', 'Error de conexión', 'error');
      }
    }
  };

  const getBadge = (proto: string) => {
    if (proto === 'TCP') return 'bg-primary-container text-primary border-primary/20';
    if (proto === 'UDP') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (proto === 'HTTPS') return 'bg-[#ceffdf] text-[#006d45] border-[#006d45]/20';
    if (proto === 'DNS') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  const canTogglePlay = Boolean(activeAnalysisId && isMonitoring);

  const extractRawIpFrontend = (addr: string) => {
    if (!addr || addr === 'N/A') return addr;
    return addr;
  };

  return (
    <div className="space-y-6 font-sans mt-4">

      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col lg:flex-row gap-3 justify-between items-center bg-white rounded-t-2xl">
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50/80 border border-slate-200 rounded-xl shadow-inner w-full">
              <DateInput 
                title="Fecha" 
                value={filterDate} 
                onChange={setFilterDate} 
              />
              <span className="text-xs text-slate-400 font-medium">De:</span>
              <input 
                type="time" 
                step="1"
                title="Hora Inicio" 
                value={filterStartDate} 
                onChange={e => setFilterStartDate(e.target.value)} 
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              />
              <span className="text-xs text-slate-400 font-medium">a</span>
              <input 
                type="time" 
                step="1"
                title="Hora Fin" 
                value={filterEndDate} 
                onChange={e => setFilterEndDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
              />
              <select
                title="Tipo de Paquete"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs w-24 bg-white"
              >
                <option value="">Tipo...</option>
                {(metadata?.protocols || PROTOCOLS).map(proto => (
                  <option key={proto} value={proto}>{proto}</option>
                ))}
              </select>
              <div className="flex items-center gap-1 border border-slate-200 px-2 py-1.5 rounded-lg bg-white">
                 <span className="text-xs text-slate-400 font-bold">Tamaño (B):</span>
                 <input
                    type="number"
                    placeholder="Mín"
                    title={`Mínimo (${metadata.minLength} B)`}
                    value={filterMinLength}
                    onChange={e => setFilterMinLength(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-12 px-1 text-xs outline-none"
                    min={metadata.minLength}
                    max={metadata.maxLength}
                 />
                 <span className="text-xs text-slate-400">-</span>
                 <input
                    type="number"
                    placeholder="Máx"
                    title={`Máximo (${metadata.maxLength} B)`}
                    value={filterMaxLength}
                    onChange={e => setFilterMaxLength(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-12 px-1 text-xs outline-none"
                    min={metadata.minLength}
                    max={metadata.maxLength}
                 />
              </div>
              <input 
                type="text" 
                placeholder="Buscar contenido..." 
                value={filterContent} 
                onChange={e => setFilterContent(e.target.value)} 
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    handleApplyFilters();
                  }
                }}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs flex-1 min-w-[150px] bg-white"
              />
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={handleApplyFilters}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Filtrar
                </button>
                <button 
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5 w-full">
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                disabled={!canTogglePlay}
                className={`flex-1 px-2.5 py-1.5 ${isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed`}
                title={!canTogglePlay ? "Disponible únicamente durante un análisis activo en vivo" : (isPlaying ? "Pausar actualización en vivo" : "Reanudar actualización en vivo")}
              >
                <span className="material-symbols-outlined text-[15px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
                {isPlaying ? 'Pausar' : 'Reanudar'}
              </button>
              <button 
                onClick={() => setResolveDns(!resolveDns)} 
                className={`flex-1 px-2.5 py-1.5 ${resolveDns ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'} font-sans font-bold text-xs rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm`}
                title={resolveDns ? "Resolución DNS activa (mostrando dominios)" : "Resolución DNS inactiva (mostrando solo IPs)"}
              >
                <span className="material-symbols-outlined text-[15px]">dns</span>
                {resolveDns ? 'DNS: SÍ' : 'DNS: NO'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleExport('CSV')} className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white font-sans font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md">
                <span className="material-symbols-outlined text-[16px]">download</span>
                Exportar CSV
              </button>
              <button onClick={() => handleExport('PDF')} className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md">
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                Exportar PDF
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono table-fixed">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-sans font-bold text-[#64748B] uppercase">
                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors w-48" onClick={() => { setSortField('timestamp'); setSortAsc(!sortAsc); }}>
                  Marca de Tiempo {sortField === 'timestamp' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors w-40" onClick={() => { setSortField('sourceIp'); setSortAsc(!sortAsc); }}>
                  IP de Origen {sortField === 'sourceIp' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors w-40" onClick={() => { setSortField('destIp'); setSortAsc(!sortAsc); }}>
                  IP de Destino {sortField === 'destIp' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors w-32" onClick={() => { setSortField('protocol'); setSortAsc(!sortAsc); }}>
                  Protocolo {sortField === 'protocol' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors w-28" onClick={() => { setSortField('length'); setSortAsc(!sortAsc); }}>
                  Longitud (B) {sortField === 'length' && (sortAsc ? '↑' : '↓')}
                </th>
                <th className="p-4 text-center w-32">Acción</th>
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
              ) : (!packets || packets.length === 0) ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">No hay paquetes que coincidan con los filtros.</td>
                </tr>
              ) : (
                packets.map((pkt) => {
                  const srcDisplay = resolveDns ? pkt.sourceIp : extractRawIpFrontend(pkt.sourceIp);
                  const dstDisplay = resolveDns ? pkt.destIp : extractRawIpFrontend(pkt.destIp);
                  return (
                    <tr key={pkt.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4 pl-6 text-[#64748B] truncate max-w-0" title={formatDateVE(pkt.timestamp)}>{formatDateVE(pkt.timestamp)}</td>
                      <td className="p-4 font-semibold text-[#0F172A] truncate max-w-0" title={srcDisplay}>{srcDisplay}</td>
                      <td className="p-4 text-[#1E293B] truncate max-w-0" title={dstDisplay}>{dstDisplay}</td>
                      <td className="p-4 truncate max-w-0 text-center" title={pkt.protocol}><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold tracking-wide ${getBadge(pkt.protocol)} border block truncate text-center`}>{pkt.protocol}</span></td>
                      <td className="p-4 text-right font-semibold truncate max-w-0" title={String(pkt.length)}>{pkt.length}</td>
                      <td className="p-4 text-center pr-6 space-x-2 font-sans">
                        <button
                          onClick={() => handleViewDetail(pkt)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-primary border border-primary/20 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Ver Detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 border-t border-[#E2E8F0] bg-slate-50 rounded-b-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-sans">Página</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
                    e.preventDefault();
                    handlePageSubmit();
                  }
                }}
                className="w-16 px-2 py-1 border border-slate-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-xs text-slate-500 font-sans">
                de {totalPages} &mdash; 100 paquetes por pág
              </span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 0}
                onClick={() => fetchPackets(currentPage - 1, true)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => fetchPackets(currentPage + 1, true)}
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
            { label: 'Payload Decodificado', value: selectedPacket.content || 'Sin datos de carga útil.', fullWidth: true, isCode: true }
          ]}
        />
      )}
    </div>
  );
};
