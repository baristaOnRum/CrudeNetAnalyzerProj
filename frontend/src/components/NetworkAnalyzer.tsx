/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';

interface NetworkAnalyzerProps {
  searchQuery: string;
}

export const NetworkAnalyzer: React.FC<NetworkAnalyzerProps> = ({ searchQuery }) => {
  // Monitoring states
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [packetStats, setPacketStats] = useState({ tcp: 0, udp: 0, icmp: 0, total: 0 });
  const [trafficMetrics, setTrafficMetrics] = useState({ pps: 0, mbps: 0, loss: 0 });
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef({ totalPkts: 0, totalBytes: 0, timestamp: Date.now() });
  const monitoringStartRef = useRef<number>(Date.now());

  // Ping states
  const [pingTarget, setPingTarget] = useState('8.8.8.8');
  const [pingStatus, setPingStatus] = useState<'Ready' | 'testing' | 'complete'>('Ready');
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [pingStats, setPingStats] = useState({ avgLatency: '--', loss: '--' });
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const latencyValuesRef = useRef<number[]>([]);
  const isPingingRef = useRef<boolean>(false);

  // Route trace states
  const [traceTarget, setTraceTarget] = useState('google.com');
  const [traceStatus, setTraceStatus] = useState<'Ready' | 'tracing' | 'complete'>('Ready');
  const [traceHops, setTraceHops] = useState<{ hop: number; ip: string; location: string; latency: number }[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
    };
  }, []);

  const fetchPackets = async () => {
    try {
      const response = await fetch('/api/packets');
      if (response.ok) {
        const data: any[] = await response.json();
        const tcp = data.filter(p => p.tipoPaquete === 'TCP').length;
        const udp = data.filter(p => p.tipoPaquete === 'UDP').length;
        const icmp = data.filter(p => p.tipoPaquete === 'ICMP').length;
        setPacketStats({ tcp, udp, icmp, total: data.length });

        // --- Metric 1: Packets per second (pps) ---
        // Based on total packets vs elapsed monitoring time
        const elapsedSec = Math.max(1, (Date.now() - monitoringStartRef.current) / 1000);
        const pps = +(data.length / elapsedSec).toFixed(2);

        // --- Metric 2: Data rate (Mbps) ---
        // Based on actual byte size of 'contenidos' field in each packet
        const totalBytes = data.reduce((acc, p) => {
          if (p.contenidos) return acc + new Blob([p.contenidos]).size;
          return acc + 64; // assume minimum 64 bytes if no payload
        }, 0);
        const bitsTransferred = totalBytes * 8;
        const mbps = +(bitsTransferred / elapsedSec / 1_000_000).toFixed(4);

        // --- Metric 3: Packet Loss (%) ---
        // Non-speculative: a packet is "lost" if its 'respuesta' field is null or empty,
        // meaning it was captured/sent but received no response from the destination.
        const noResponse = data.filter(p => !p.respuesta || p.respuesta.trim() === '').length;
        const loss = data.length > 0
          ? +((noResponse / data.length) * 100).toFixed(2)
          : 0;

        setTrafficMetrics({ pps, mbps, loss });
      }
    } catch (e) {
      console.error('Failed to fetch packets for monitoring', e);
    }
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
    } else {
      setIsMonitoring(true);
      monitoringStartRef.current = Date.now(); // reset elapsed time baseline
      lastFetchRef.current = { totalPkts: 0, totalBytes: 0, timestamp: Date.now() };
      fetchPackets(); // fetch immediately
      monitoringIntervalRef.current = setInterval(fetchPackets, 2000);
    }
  };

  const getProtocolPercentages = () => {
    if (packetStats.total === 0) return { tcp: 0, udp: 0, icmp: 0, other: 0, original: {tcp:0, udp:0, icmp:0} };
    let tcp = Math.round((packetStats.tcp / packetStats.total) * 100);
    let udp = Math.round((packetStats.udp / packetStats.total) * 100);
    let icmp = Math.round((packetStats.icmp / packetStats.total) * 100);
    let other = 100 - tcp - udp - icmp;
    
    const original = { tcp, udp, icmp };

    // Apply 15% threshold to group into Otros
    if (tcp > 0 && tcp < 15) { other += tcp; tcp = 0; }
    if (udp > 0 && udp < 15) { other += udp; udp = 0; }
    if (icmp > 0 && icmp < 15) { other += icmp; icmp = 0; }

    return { tcp, udp, icmp, other, original };
  };

  const { tcp: tcpPct, udp: udpPct, icmp: icmpPct, other: otherPct, original } = getProtocolPercentages();

  // SVG parameters for donut
  const circumference = 100;
  let currentOffset = 0;
  
  const tcpStroke = (tcpPct / 100) * circumference;
  const udpStroke = (udpPct / 100) * circumference;
  const icmpStroke = (icmpPct / 100) * circumference;
  const otherStroke = (otherPct / 100) * circumference;

  const tcpDasharray = `${tcpStroke} ${circumference - tcpStroke}`;
  const tcpOffset = circumference - currentOffset;
  currentOffset += tcpStroke;

  const udpDasharray = `${udpStroke} ${circumference - udpStroke}`;
  const udpOffset = circumference - currentOffset;
  currentOffset += udpStroke;

  const icmpDasharray = `${icmpStroke} ${circumference - icmpStroke}`;
  const icmpOffset = circumference - currentOffset;
  currentOffset += icmpStroke;

  const otherDasharray = `${otherStroke} ${circumference - otherStroke}`;
  const otherOffset = circumference - currentOffset;

  // Infinite Ping Execution simulator
  const handleStartPing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pingTarget) return;

    if (pingStatus === 'testing') {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
      setPingStatus('complete');

      const values = latencyValuesRef.current;
      const count = values.length;
      if (count > 0) {
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / count);
        setPingStats({ avgLatency: `${avg} ms`, loss: '0%' });
        setPingLogs((prev) => [
          ...prev,
          `--- ${pingTarget} ping statistics ---`,
          `${count} packets transmitted, ${count} received, 0% packet loss, time ${avg * count}ms`
        ]);
      }
      return;
    }

    setPingStatus('testing');
    setPingLogs([`PING [${pingTarget}] with 32 bytes of data:`]);
    setPingStats({ avgLatency: '--', loss: '0%' });
    latencyValuesRef.current = [];
    isPingingRef.current = false;

    let seq = 1;
    let timeouts = 0;

    pingIntervalRef.current = setInterval(async () => {
      if (isPingingRef.current) return;
      isPingingRef.current = true;
      
      try {
        const response = await fetch('/api/diagnostics/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: pingTarget })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.latency !== null) {
            latencyValuesRef.current.push(data.latency);
            const currentAvg = Math.round(latencyValuesRef.current.reduce((a, b) => a + b, 0) / latencyValuesRef.current.length);
            const currentLoss = Math.round((timeouts / (latencyValuesRef.current.length + timeouts)) * 100);
            
            setPingStats({ avgLatency: `${currentAvg} ms`, loss: `${currentLoss}%` });
            setPingLogs((prev) => {
              const updated = [...prev, `Reply ${seq} from ${data.ip}: bytes=32 time=${data.latency}ms TTL=${data.ttl || 115} PROTO=ICMPv4`];
              if (updated.length > 50) return updated.slice(updated.length - 50);
              return updated;
            });
          } else {
            timeouts++;
            const total = latencyValuesRef.current.length + timeouts;
            const currentLoss = Math.round((timeouts / total) * 100);
            setPingStats(prev => ({ ...prev, loss: `${currentLoss}%` }));
            setPingLogs((prev) => [...prev, `Request timed out for seq ${seq}. Target: ${pingTarget}`]);
          }
        }
      } catch (e) {
        setPingLogs((prev) => [...prev, `Error al comunicarse con el servidor de diagnóstico.`]);
      } finally {
        seq++;
        isPingingRef.current = false;
      }
    }, 1500);
  };

  // Route trace execution simulator
  const handleStartTrace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!traceTarget) return;

    setTraceStatus('tracing');
    setTraceHops([]);

    const hopsData = [
      { hop: 1, ip: '10.0.0.1', location: 'Local Gateway Interface', latency: 1 },
      { hop: 2, ip: '192.168.1.1', location: 'Symmetric Border Router', latency: 3 },
      { hop: 3, ip: '172.16.220.10', location: 'Autonomous System Transit Core', latency: 8 },
      { hop: 4, ip: '142.250.190.46', location: 'Cloud Edge Server Destination', latency: 11 }
    ];

    let currentHopIndex = 0;
    const stepTrace = () => {
      if (currentHopIndex < hopsData.length) {
        setTraceHops((prev) => [...prev, hopsData[currentHopIndex]]);
        currentHopIndex++;
        setTimeout(stepTrace, 600);
      } else {
        setTraceStatus('complete');
      }
    };

    setTimeout(stepTrace, 200);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Session Title and descriptions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2 select-none">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">insights</span>
            Análisis de Red
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Métricas fundamentales de diagnóstico de paquetes: rendimiento, capacidad, anomalías de enrutamiento y diagnóstico.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleMonitoring}
            className={`flex items-center gap-2 border px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors ${isMonitoring ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-white border-[#E2E8F0] text-slate-700 hover:bg-[#F1F5F9]'}`}
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            {isMonitoring ? 'Detener Monitoreo' : 'Iniciar Monitoreo (Pasivo)'}
          </button>
          <button className="flex items-center gap-2 bg-primary hover:bg-opacity-95 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">query_stats</span>
            Iniciar Análisis (Activo)
          </button>
        </div>
      </div>

      {/* Global Traffic Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none mt-6">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#64748B] text-lg">speed</span>
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Paquetes / Segundo</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-[#0F172A] font-mono">{isMonitoring ? trafficMetrics.pps : '--'}</span>
            <span className="text-sm text-[#64748B] mb-1 font-bold">pps</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#64748B] text-lg">network_check</span>
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tasa de Datos</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-[#0F172A] font-mono">{isMonitoring ? trafficMetrics.mbps : '--'}</span>
            <span className="text-sm text-[#64748B] mb-1 font-bold">Mbps</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#64748B] text-lg">warning</span>
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Pérdida de Paquetes</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-[#F59E0B] font-mono">{isMonitoring ? trafficMetrics.loss : '--'}</span>
            <span className="text-sm text-[#64748B] mb-1 font-bold">%</span>
          </div>
        </div>
      </section>

      {/* Packet Type Overview Cards */}
      <section className="select-none">
        <h2 className="text-base font-bold text-[#0F172A] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">dashboard</span>
          Resumen de Tipos de Paquetes
        </h2>
        
        <div className="grid grid-cols-12 gap-6">
          {/* TCP Card */}
          <div className="col-span-12 md:col-span-4 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Tráfico TCP</p>
                <h3 className={`text-2xl font-bold mt-1 font-sans ${isMonitoring ? 'text-primary' : 'text-slate-300'}`}>
                  {isMonitoring ? packetStats.tcp : '--'} Pkts
                </h3>
              </div>
              <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border uppercase ${isMonitoring ? 'bg-[#F0FDF4] text-[#166534] border-[#D1FAE5]' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
                {isMonitoring ? 'Activo' : 'Esperando'}
              </span>
            </div>
            <div className="h-16 w-full mt-4 flex items-center justify-center">
              {isMonitoring ? (
                <div className="w-full flex gap-1 items-end h-full">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex-1 bg-primary rounded-t-sm" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Sin datos</span>
              )}
            </div>
          </div>

          {/* UDP Card */}
          <div className="col-span-12 md:col-span-4 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Tráfico UDP</p>
                <h3 className={`text-2xl font-bold mt-1 font-sans ${isMonitoring ? 'text-purple-600' : 'text-slate-300'}`}>
                  {isMonitoring ? packetStats.udp : '--'} Pkts
                </h3>
              </div>
              <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border uppercase ${isMonitoring ? 'bg-purple-50 text-purple-700 border-purple-100' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
                {isMonitoring ? 'Activo' : 'Esperando'}
              </span>
            </div>
            <div className="h-16 w-full mt-4 flex items-center justify-center">
              {isMonitoring ? (
                <div className="w-full flex gap-1 items-end h-full">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex-1 bg-purple-500 rounded-t-sm" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Sin datos</span>
              )}
            </div>
          </div>

          {/* ICMP Card */}
          <div className="col-span-12 md:col-span-4 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Tráfico ICMP</p>
                <h3 className={`text-2xl font-bold mt-1 font-sans ${isMonitoring ? 'text-orange-500' : 'text-slate-300'}`}>
                  {isMonitoring ? packetStats.icmp : '--'} Pkts
                </h3>
              </div>
              <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border uppercase ${isMonitoring ? 'bg-orange-50 text-orange-700 border-orange-100' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
                {isMonitoring ? 'Activo' : 'Esperando'}
              </span>
            </div>
            <div className="h-16 w-full mt-4 flex items-center justify-center">
              {isMonitoring ? (
                <div className="w-full flex gap-1 items-end h-full">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="flex-1 bg-orange-400 rounded-t-sm" style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Sin datos</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Distribution Circular Chart section */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl flex flex-col min-h-[460px] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#E2E8F0] bg-white flex justify-between items-center select-none">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-[#0F172A]">Análisis de Distribución de Protocolos</h3>
            <span className={`text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded font-bold uppercase border ${isMonitoring ? 'bg-[#F0FDF4] text-[#166534] border-[#D1FAE5]' : 'bg-slate-100 text-slate-400 border-[#E2E8F0]'}`}>
              {isMonitoring ? 'Registrando en Vivo' : 'Sin datos activos'}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-8 gap-8">
          {/* Donut chart widget */}
          <div className={`relative w-72 h-72 flex-shrink-0 select-none ${isMonitoring ? '' : 'opacity-50'}`}>
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#F1F5F9" strokeWidth="3" />
              {isMonitoring && packetStats.total > 0 && (
                <>
                  <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#4F46E5" strokeWidth="3" strokeDasharray={tcpDasharray} strokeDashoffset={tcpOffset} />
                  <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#9333EA" strokeWidth="3" strokeDasharray={udpDasharray} strokeDashoffset={udpOffset} />
                  <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#F97316" strokeWidth="3" strokeDasharray={icmpDasharray} strokeDashoffset={icmpOffset} />
                  <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#94A3B8" strokeWidth="3" strokeDasharray={otherDasharray} strokeDashoffset={otherOffset} />
                </>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-4xl font-extrabold ${isMonitoring ? 'text-[#0F172A]' : 'text-slate-300'}`}>
                {isMonitoring ? packetStats.total : '--'}
              </span>
              <span className={`text-[10px] font-mono tracking-wider font-bold uppercase mt-1 ${isMonitoring ? 'text-[#64748B]' : 'text-slate-400'}`}>
                Total Pkts
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 max-w-xl flex items-center justify-center border border-[#E2E8F0] rounded-xl bg-white min-h-[200px] shadow-sm">
            {isMonitoring ? (
              <div className="w-full p-6 space-y-4">
                {tcpPct > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary"></span><span className="text-sm font-bold text-[#1E293B]">TCP</span></div>
                    <span className="text-sm font-mono text-[#64748B]">{tcpPct}%</span>
                  </div>
                )}
                {udpPct > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-600"></span><span className="text-sm font-bold text-[#1E293B]">UDP</span></div>
                    <span className="text-sm font-mono text-[#64748B]">{udpPct}%</span>
                  </div>
                )}
                {icmpPct > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-[#F1F5F9]">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span><span className="text-sm font-bold text-[#1E293B]">ICMP</span></div>
                    <span className="text-sm font-mono text-[#64748B]">{icmpPct}%</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-400"></span><span className="text-sm font-bold text-[#1E293B]">Otros</span></div>
                  <span className="text-sm font-mono text-[#64748B]">{otherPct}%</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic font-sans text-center px-8 bg-slate-50 w-full h-full flex items-center justify-center rounded-xl border border-dashed border-slate-200">
                Inicie el análisis pasivo o activo para recolectar métricas de distribución de protocolos en este segmento de la red.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Network Diagnostics tools box */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-sm">construction</span>
          Diagnósticos de Red Activos
        </h2>

        <div className="grid grid-cols-12 gap-6">

          {/* Widget 1: Interactive PING Test tool */}
          <div className="col-span-12 md:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4 select-none">
              <span className="material-symbols-outlined text-primary text-xl">router</span>
              <h3 className="font-bold text-sm text-[#0F172A]">Prueba de Conectividad (Ping)</h3>
            </div>

            <form onSubmit={handleStartPing} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ingrese IP o Hostname de destino (ej. 8.8.8.8)"
                value={pingTarget}
                onChange={(e) => setPingTarget(e.target.value)}
                disabled={pingStatus === 'testing'}
                className="flex-1 bg-[#F1F5F9] border-none rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-[#1E293B] placeholder-[#94A3B8] font-sans"
              />
              <button
                type="submit"
                className={`text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-opacity-90 transition-all cursor-pointer font-sans ${pingStatus === 'testing' ? 'bg-red-500' : 'bg-primary'}`}
              >
                {pingStatus === 'testing' ? 'Detener Prueba' : 'Iniciar Prueba'}
              </button>
            </form>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <div className="flex justify-between text-[11px] font-mono text-[#64748B] mb-3 pb-1 border-b border-[#E2E8F0] select-none">
                <span>Estado en tiempo real</span>
                <span className={`font-bold uppercase ${pingStatus === 'testing' ? 'text-[#F59E0B] animate-pulse' : 'text-[#4F46E5]'}`}>
                  {pingStatus === 'testing' ? 'PROBANDO...' : pingStatus === 'complete' ? 'COMPLETADO' : 'LISTO'}
                </span>
              </div>

              {/* Ping Replies details window */}
              {pingLogs.length > 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-indigo-200 space-y-1 h-[120px] overflow-y-auto mb-3 flex flex-col-reverse">
                  <div>
                    {pingLogs.map((log, i) => (
                      <div key={i} className={log.includes('statistics') ? 'text-green-400 mt-2 border-t border-slate-800 pt-1' : ''}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
               <div className="bg-white border border-dashed border-[#E2E8F0] rounded-lg p-3 h-[120px] flex items-center justify-center font-sans text-xs italic text-[#64748B] text-center mb-3">
                  Esperando traza de prueba. Las respuestas se mostrarán de forma continua hasta detener la prueba.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] font-mono text-[#64748B] font-bold uppercase select-none">Latencia Promedio</p>
                  <p className="text-lg font-bold text-primary mt-0.5 font-mono">{pingStats.avgLatency}</p>
                </div>
                <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] font-mono text-[#64748B] font-bold uppercase select-none">Pérdida de Paquetes</p>
                  <p className="text-lg font-bold text-[#F59E0B] mt-0.5 font-mono">{pingStats.loss}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Route Trace widget */}
          <div className="col-span-12 md:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4 select-none">
              <span className="material-symbols-outlined text-primary text-xl">alt_route</span>
              <h3 className="font-bold text-sm text-[#0F172A]">Traza de Ruta</h3>
            </div>

            <form onSubmit={handleStartTrace} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ingrese hostname de destino (ej. google.com)"
                value={traceTarget}
                onChange={(e) => setTraceTarget(e.target.value)}
                disabled={traceStatus === 'tracing'}
                className="flex-1 bg-[#F1F5F9] border-none rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-[#1E293B] placeholder-[#94A3B8] font-sans"
              />
              <button
                type="submit"
                disabled={traceStatus === 'tracing'}
                className="bg-primary text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-opacity-90 disabled:opacity-50 transition-all cursor-pointer font-sans"
              >
                {traceStatus === 'tracing' ? 'Rastreando' : 'Trazar Ruta'}
              </button>
            </form>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 h-[220px] overflow-y-auto">
              {traceHops.length > 0 ? (
                <div className="space-y-3 font-mono text-xs">
                  {traceHops.map((hop, i) => (
                    <div key={i} className="flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
                      <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                        {hop.hop}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                           <span className="font-bold text-[#1E293B] truncate">{hop.ip}</span>
                           <span className="text-secondary font-bold font-mono text-[10px]">{hop.latency} ms</span>
                        </div>
                        <p className="text-[10px] text-[#64748B] truncate">{hop.location}</p>
                      </div>
                    </div>
                  ))}
                  {traceStatus === 'tracing' && (
                    <div className="flex items-center justify-center gap-2 py-2 text-[#F59E0B] font-sans text-xs italic">
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                      Interrogando siguiente salto...
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-xs text-[#64748B] italic">
                    La lista de saltos de visualización de la ruta aparecerá aquí después de iniciar el diagnóstico...
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};
