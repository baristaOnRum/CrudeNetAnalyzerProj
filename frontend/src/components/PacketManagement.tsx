/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

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

const RANDOM_IPS = ['192.168.1.104', '10.0.0.5', '8.8.8.8', '172.16.0.1', '142.250.190.46'];
const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'DNS', 'HTTPS'];

export const PacketManagement: React.FC<PacketManagementProps> = ({ activeAnalysisId }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [exportingState, setExportingState] = useState<'idle' | 'exporting'>('idle');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterExactDate, setFilterExactDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterContent, setFilterContent] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchPackets = async () => {
    try {
      const res = await fetch('/api/packets');
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((p: any) => ({
          id: p.id ? `PKT-${p.id}` : `PKT-${Math.floor(Math.random() * 90000)}`,
          timestamp: new Date().toISOString().substring(11, 23),
          sourceIp: p.fuente,
          destIp: p.destino,
          protocol: p.tipoPaquete,
          content: p.contenidos || '',
          length: p.contenidos ? p.contenidos.length : 128,
          status: 'allowed',
          idAnalisis: p.idAnalisis
        }));
        // Since we want newest first, we reverse it
        setPackets(mapped.reverse().slice(0, 15));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Inject random packets into the DB to simulate real traffic
  const injectPacket = async () => {
    const protocol = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
    const sourceIp = RANDOM_IPS[Math.floor(Math.random() * RANDOM_IPS.length)];
    const destIp = RANDOM_IPS[Math.floor(Math.random() * RANDOM_IPS.length)];
    const payload = {
      tipoPaquete: protocol,
      contenidos: "PAYLOAD_SIMULATED_" + Math.random(),
      fuente: sourceIp,
      destino: destIp,
      respuesta: "ACK",
      tiempoRespuesta: Math.floor(Math.random() * 50),
      idAnalisis: activeAnalysisId
    };
    try {
      await fetch('/api/packets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchPackets();
    } catch (e) {}
  };

  useEffect(() => {
    fetchPackets();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      injectPacket();
    }, 1800);
    return () => clearInterval(timer);
  }, [isPlaying, activeAnalysisId]);

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

  const handleExport = (type: 'CSV' | 'JSON') => {
    setExportingState('exporting');
    setExportMessage(`Preparando salida ${type}...`);
    setTimeout(() => {
      setExportingState('idle');
      const exportContent = JSON.stringify(packets, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(exportContent);
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = `packets_export.${type.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setExportMessage(`Archivo guardado.`);
      setTimeout(() => setExportMessage(null), 3000);
    }, 1000);
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
                <th className="p-4 text-right pr-6">Longitud (B)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] font-medium text-[#1E293B]">
              {filteredPackets.map((pkt) => (
                <tr key={pkt.id} className="hover:bg-[#F8FAFC] animate-[fadeIn_0.1s_ease-out]">
                  <td className="p-4 pl-6 text-[#64748B]">{pkt.timestamp}</td>
                  <td className="p-4 font-semibold text-[#0F172A]">{pkt.sourceIp}</td>
                  <td className="p-4 text-[#1E293B]">{pkt.destIp}</td>
                  <td className="p-4"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold tracking-wide ${getBadge(pkt.protocol)} border`}>{pkt.protocol}</span></td>
                  <td className="p-4 text-right pr-6 font-semibold">{pkt.length}</td>
                </tr>
              ))}
              {filteredPackets.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#64748B] font-sans text-xs">
                    No se encontraron paquetes para los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
