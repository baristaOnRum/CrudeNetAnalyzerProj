/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Packet } from '../types';

interface PacketManagementProps {
  searchQuery: string;
  speedMode: 'normal' | 'fast' | 'turbo';
}

// Predefined set of rich mock network IPs and parameters to drive live stream variation
const RANDOM_IPS = [
  '192.168.1.104', '10.0.0.5', '8.8.8.8', '172.16.0.1', '142.250.190.46',
  '192.168.1.1', '10.0.0.1', '1.1.1.1', '142.251.33.110', '185.190.140.5'
];

const PROTOCOLS: ('TCP' | 'UDP' | 'ICMP' | 'DNS' | 'HTTPS')[] = ['TCP', 'UDP', 'ICMP', 'DNS', 'HTTPS'];

export const PacketManagement: React.FC<PacketManagementProps> = ({ searchQuery, speedMode }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [exportingState, setExportingState] = useState<'idle' | 'exporting'>('idle');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Buffer to accumulate initial packets to render table nicely
  useEffect(() => {
    // Bootstrap initial visible packet list
    const initialPackets: Packet[] = [];
    const now = new Date();
    for (let i = 0; i < 9; i++) {
      const timeOffset = new Date(now.getTime() - i * 1800);
      initialPackets.push(generateRandomPacket(timeOffset));
    }
    setPackets(initialPackets);
  }, []);

  // Interval timer ref to let us clear it on component unmount
  useEffect(() => {
    if (!isPlaying) return;

    let intervalDelay = 1800; // default normal
    if (speedMode === 'fast') intervalDelay = 800;
    if (speedMode === 'turbo') intervalDelay = 300;

    const timer = setInterval(() => {
      setPackets((prev) => {
        const nextPacket = generateRandomPacket(new Date());
        // Keep up to 14 rows total for beautiful spacing
        const updated = [nextPacket, ...prev];
        if (updated.length > 14) {
          updated.pop();
        }
        return updated;
      });
    }, intervalDelay);

    return () => clearInterval(timer);
  }, [isPlaying, speedMode]);

  // Generates complete mock packet structure
  function generateRandomPacket(date: Date): Packet {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const millis = String(date.getMilliseconds()).padStart(3, '0');
    const timestampStr = `${hours}:${minutes}:${seconds}.${millis}`;

    const protocol = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
    const sourceIp = RANDOM_IPS[Math.floor(Math.random() * RANDOM_IPS.length)];
    let destIp = RANDOM_IPS[Math.floor(Math.random() * RANDOM_IPS.length)];
    // Prevent source and destination from being identical to mimic actual traffic
    if (destIp === sourceIp) {
      destIp = RANDOM_IPS[(RANDOM_IPS.indexOf(sourceIp) + 1) % RANDOM_IPS.length];
    }

    const sizes = { TCP: [1339, 885, 175, 1052, 348, 363, 1252, 1279], UDP: [64, 128, 512, 1024], ICMP: [32, 64], DNS: [72, 85, 96], HTTPS: [512, 1024, 1432, 1500] };
    const pSizeArray = sizes[protocol];
    const length = pSizeArray[Math.floor(Math.random() * pSizeArray.length)];

    const statsArray: ('allowed' | 'flagged' | 'blocked')[] = ['allowed', 'allowed', 'allowed', 'flagged', 'allowed', 'blocked'];
    const status = statsArray[Math.floor(Math.random() * statsArray.length)];

    return {
      id: `PKT-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: timestampStr,
      sourceIp,
      destIp,
      protocol,
      length,
      status
    };
  }

  // Handle packet stream Pause/Resume Toggle
  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  // Filter packet list based on search term
  const filteredPackets = packets.filter((p) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      p.sourceIp.includes(term) ||
      p.destIp.includes(term) ||
      p.protocol.toLowerCase().includes(term) ||
      p.timestamp.includes(term)
    );
  });

  // Handle quick mock data export (CSV/JSON)
  const handleExport = (type: 'CSV' | 'JSON') => {
    setExportingState('exporting');
    setExportMessage(`Ensamblando transmisiones de sesión. Preparando salida ${type} del sistema...`);

    setTimeout(() => {
      setExportingState('idle');
      // Produce actual standard object triggers and alert messages
      const exportContent = JSON.stringify(packets, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(exportContent);
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `NombrePendiente_PaquetesSesion_${new Date().toISOString().split('T')[0]}.${type.toLowerCase()}`);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);

      setExportMessage(`¡Carga finalizada! Archivo "NombrePendiente_PaquetesSesion.${type.toLowerCase()}" guardado con éxito.`);
      setTimeout(() => setExportMessage(null), 3500);
    }, 1200);
  };

  // Determine beautiful custom background badges for protocols
  const getProtocolBadge = (proto: Packet['protocol']) => {
    switch (proto) {
      case 'TCP':
        return 'bg-primary-container text-primary border border-primary/20';
      case 'UDP':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'HTTPS':
        return 'bg-[#ceffdf] text-[#006d45] border border-[#006d45]/20';
      case 'DNS':
        return 'bg-purple-100 text-purple-700 border border-purple-200';
      default:
        return 'bg-amber-100 text-amber-700 border border-amber-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Live Stream Page Title banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2 select-none">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] font-sans leading-none flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">terminal</span>
            Administrar Paquetes
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-sans">
            Extracción de paquetes de interfaz en tiempo real, inyección y monitor de búfer dinámico.
          </p>
        </div>

        {/* Rapid action bar for packet simulation custom parameters */}
        <div className="flex items-center gap-2">
          {exportMessage && (
            <div className="bg-[#F0FDF4] text-[#166534] text-xs px-3.5 py-2 rounded-lg border border-[#D1FAE5] font-sans shadow-sm flex items-center gap-2 animate-[fadeIn_0.2s_ease-out]">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              {exportMessage}
            </div>
          )}
          {exportingState === 'exporting' && (
            <div className="bg-[#F1F5F9] text-[#0F172A] text-xs px-3.5 py-2 rounded-lg border border-[#E2E8F0] font-mono shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              Preparando descarga...
            </div>
          )}
        </div>
      </div>

      {/* Main Core Packet Stream Box container */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        
        {/* Card Header menu */}
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row gap-3 justify-between items-center bg-white">
          <div className="flex items-center gap-4">
            <h3 className="font-sans font-bold text-base text-[#0F172A]">
              Paquetes de Red Activos
            </h3>
            <span className="text-[10px] uppercase tracking-wider font-mono px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] border border-[#E2E8F0] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#4F46E5] rounded-full glow-pulse" />
              Monitoreando todas las interfaces | {speedMode === 'turbo' ? '12.4k' : speedMode === 'fast' ? '4.8k' : '1.2k'} paq/seg
            </span>
          </div>

          <div className="flex items-center gap-4 select-none">
            {/* Exports controls */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-sans font-medium text-[#64748B] tracking-wide uppercase">
                Exportar:
              </span>
              <button
                onClick={() => handleExport('CSV')}
                disabled={exportingState === 'exporting'}
                className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-slate-700 hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('JSON')}
                disabled={exportingState === 'exporting'}
                className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-lg text-xs font-semibold text-slate-700 hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              >
                JSON
              </button>
            </div>

            {/* Resume/Pause Playback Toggle */}
            <button
              onClick={handleTogglePlay}
              className={`px-4 py-1.5 font-sans font-semibold rounded-lg text-xs tracking-wide transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-primary text-white hover:bg-opacity-90'
                  : 'bg-green-600 text-white hover:bg-green-700 animate-pulse'
              }`}
            >
              {isPlaying ? 'Pausar Transmisión' : 'Reanudar Transmisión'}
            </button>
          </div>
        </div>

        {/* Database packet lists table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] select-none text-[10px] tracking-wider font-sans font-bold text-[#64748B] uppercase">
                <th className="p-4 pl-6">Marca de Tiempo</th>
                <th className="p-4">IP de Origen</th>
                <th className="p-4">IP de Destino</th>
                <th className="p-4">Protocolo</th>
                <th className="p-4 text-right pr-6">Longitud (B)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] font-mono text-[13px] font-medium text-[#1E293B]">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#64748B] font-sans italic">
                    Ningún paquete activo coincide con el criterio "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt) => (
                  <tr
                    key={pkt.id}
                    className="hover:bg-[#F8FAFC] transition-colors group animate-[fadeIn_0.1s_ease-out]"
                  >
                    <td className="p-4 pl-6 text-[#64748B]">
                      {pkt.timestamp}
                    </td>
                    <td className="p-4 font-semibold text-[#0F172A]">
                      {pkt.sourceIp}
                    </td>
                    <td className="p-4 text-[#1E293B]">
                      {pkt.destIp}
                    </td>
                    <td className="p-4 select-none">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold tracking-wide ${getProtocolBadge(pkt.protocol)}`}>
                        {pkt.protocol}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6 text-[#0F172A] font-semibold">
                      {pkt.length}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
