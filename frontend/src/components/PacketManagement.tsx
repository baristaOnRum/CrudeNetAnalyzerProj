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
  status: string;
}

interface PacketManagementProps {
  searchQuery: string;
}

const RANDOM_IPS = ['192.168.1.104', '10.0.0.5', '8.8.8.8', '172.16.0.1', '142.250.190.46'];
const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'DNS', 'HTTPS'];

export const PacketManagement: React.FC<PacketManagementProps> = ({ searchQuery }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [exportingState, setExportingState] = useState<'idle' | 'exporting'>('idle');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

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
          length: p.contenidos ? p.contenidos.length : 128,
          status: 'allowed'
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
      tiempoRespuesta: Math.floor(Math.random() * 50)
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
  }, [isPlaying]);

  const handleTogglePlay = () => setIsPlaying(!isPlaying);

  const filteredPackets = packets.filter((p) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return p.sourceIp.includes(term) || p.destIp.includes(term) || p.protocol.toLowerCase().includes(term);
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
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2 select-none">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">terminal</span>
            Administrar Paquetes
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Conectado a la Base de Datos. Inyección y monitor en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2">
          {exportMessage && (
            <div className="bg-[#F0FDF4] text-[#166534] text-xs px-3.5 py-2 rounded-lg border border-[#D1FAE5] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>{exportMessage}
            </div>
          )}
          {exportingState === 'exporting' && (
            <div className="bg-[#F1F5F9] text-[#0F172A] text-xs px-3.5 py-2 rounded-lg border border-[#E2E8F0] flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Preparando...
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row gap-3 justify-between items-center">
          <h3 className="font-sans font-bold text-base text-[#0F172A]">Paquetes de Red Activos</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button onClick={() => handleExport('CSV')} className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold hover:bg-[#F1F5F9]">CSV</button>
              <button onClick={() => handleExport('JSON')} className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold hover:bg-[#F1F5F9]">JSON</button>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
