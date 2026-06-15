/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface NetworkAnalyzerProps {
  searchQuery: string;
}

interface PingResult {
  seq: number;
  ip: string;
  bytes: number;
  time: number;
  ttl: number;
}

export const NetworkAnalyzer: React.FC<NetworkAnalyzerProps> = ({ searchQuery }) => {
  // Stats random modifier to make charts dynamic
  const [ticker, setTicker] = useState(0);
  const [tcpRate, setTcpRate] = useState(42.8);
  const [udpRate, setUdpRate] = useState(18.2);

  // Ping states
  const [pingTarget, setPingTarget] = useState('8.8.8.8');
  const [pingStatus, setPingStatus] = useState<'Ready' | 'testing' | 'complete'>('Ready');
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [pingStats, setPingStats] = useState({ avgLatency: '--', loss: '0%' });

  // Route trace states
  const [traceTarget, setTraceTarget] = useState('google.com');
  const [traceStatus, setTraceStatus] = useState<'Ready' | 'tracing' | 'complete'>('Ready');
  const [traceHops, setTraceHops] = useState<{ hop: number; ip: string; location: string; latency: number }[]>([]);

  // Fluctuates metric numbers slightly to feel live and organic
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
      setTcpRate((prev) => parseFloat((prev + (Math.random() - 0.5) * 0.4).toFixed(1)));
      setUdpRate((prev) => parseFloat((prev + (Math.random() - 0.5) * 0.2).toFixed(1)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Ping execution simulator
  const handleStartPing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pingTarget) return;

    setPingStatus('testing');
    setPingLogs([`PING [${pingTarget}] with 64 bytes of cryptographically secure header data:`]);
    setPingStats({ avgLatency: '--', loss: '0%' });

    const hopsCount = 4;
    let seq = 1;
    const latencyValues: number[] = [];
    const targetIp = pingTarget.match(/^\d+\.\d+\.\d+\.\d+$/) ? pingTarget : '142.250.190.46';

    const triggerPingReply = () => {
      if (seq <= hopsCount) {
        const ms = Math.floor(8 + Math.random() * 12);
        latencyValues.push(ms);
        setPingLogs((prev) => [
          ...prev,
          `Reply ${seq} from ${targetIp}: bytes=64 time=${ms}ms TTL=54 PROTO=ICMPv4`
        ]);
        seq++;
        setTimeout(triggerPingReply, 450);
      } else {
        const avg = Math.round(latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length);
        setPingStats({
          avgLatency: `${avg} ms`,
          loss: '0%'
        });
        setPingLogs((prev) => [
          ...prev,
          `--- ${pingTarget} ping statistics ---`,
          `${hopsCount} packets transmitted, ${hopsCount} received, 0% packet loss, time ${avg * 4}ms`
        ]);
        setPingStatus('complete');
      }
    };

    setTimeout(triggerPingReply, 250);
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
      <div className="flex items-center justify-between mt-2 select-none">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">insights</span>
            Análisis de Red
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Core diagnostic packet metrics: throughput, capacity, routing anomalies, and diagnostics.
          </p>
        </div>
      </div>

      {/* Packet Type Overview Cards */}
      <section className="select-none">
        <h2 className="text-base font-bold text-[#0F172A] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">dashboard</span>
          Packet Type Overview
        </h2>
        
        <div className="grid grid-cols-12 gap-6">
          {/* TCP Card */}
          <div className="col-span-12 md:col-span-4 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                  TCP Traffic
                </p>
                <h3 className="text-2xl font-bold text-primary mt-1 font-sans">
                  {tcpRate} GB/s
                </h3>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-[#166534] font-semibold bg-[#F0FDF4] px-2.5 py-1 rounded-full border border-[#D1FAE5]">
                <span className="material-symbols-outlined text-[13px]">trending_up</span>
                +12.4%
              </span>
            </div>
            {/* SVG line graph represent TCP flow waves */}
            <div className="h-16 w-full mt-4">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path
                  d="M0,15 Q10,5 20,12 T40,8 T60,15 T80,5 T100,10"
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* UDP Card */}
          <div className="col-span-12 md:col-span-4 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                  UDP Traffic
                </p>
                <h3 className="text-2xl font-bold text-secondary mt-1 font-sans">
                  {udpRate} GB/s
                </h3>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-[#991B1B] font-semibold bg-[#FEE2E2] px-2.5 py-1 rounded-full border border-[#FCA5A5]">
                <span className="material-symbols-outlined text-[13px]">trending_down</span>
                -2.1%
              </span>
            </div>
            {/* SVG line graph represent UDP flow waves */}
            <div className="h-16 w-full mt-4">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path
                  d="M0,10 Q15,18 30,10 T60,5 T100,12"
                  fill="none"
                  stroke="#0EA5E9"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          {/* ICMP Card */}
          <div className="col-span-12 md:col-span-4 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                  ICMP Traffic
                </p>
                <h3 className="text-2xl font-bold text-[#F59E0B] mt-1 font-sans">
                  0.4 GB/s
                </h3>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold bg-slate-100 px-2.5 py-1 rounded-full border border-slate-250">
                <span className="material-symbols-outlined text-[13px]">horizontal_rule</span>
                stable
              </span>
            </div>
            {/* SVG ICMP pulse line graph */}
            <div className="h-16 w-full mt-4">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 20">
                <path
                  d="M0,10 L20,10 L25,5 L35,15 L40,10 L100,10"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>
      {/* Protocol Distribution Circular Chart section */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl flex flex-col min-h-[460px] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#E2E8F0] bg-white flex justify-between items-center select-none">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-[#0F172A]">
              Protocol Distribution Analysis
            </h3>
            <span className="text-[10px] font-mono tracking-widest bg-[#F1F5F9]/50 border border-[#E2E8F0] px-2.5 py-0.5 rounded text-[#64748B] font-bold uppercase">
              Real-time breakdown
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#F1F5F9]/50 text-[#64748B] hover:text-[#0F172A] rounded-lg cursor-pointer transition-colors" title="Filter list">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
            </button>
            <button className="p-2 hover:bg-[#F1F5F9]/50 text-[#64748B] hover:text-[#0F172A] rounded-lg cursor-pointer transition-colors" title="More options">
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-8 gap-8">
          {/* Center visual donut chart widget */}
          <div className="relative w-72 h-72 flex-shrink-0 select-none">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#F1F5F9" strokeWidth="3" />
              {/* TCP: 70.2% color: #4F46E5 */}
              <circle 
                cx="18" cy="18" fill="transparent" r="15.915" 
                stroke="#4F46E5" strokeWidth="3" 
                strokeDasharray="70.2 29.8" strokeDashoffset="0" 
              />
              {/* UDP: 19.5% color: #0EA5E9 */}
              <circle 
                cx="18" cy="18" fill="transparent" r="15.915" 
                stroke="#0EA5E9" strokeWidth="3" 
                strokeDasharray="19.5 80.5" strokeDashoffset="-70.2" 
              />
              {/* ICMP: 10.3% color: #F59E0B */}
              <circle 
                cx="18" cy="18" fill="transparent" r="15.915" 
                stroke="#F59E0B" strokeWidth="3" 
                strokeDasharray="10.3 89.7" strokeDashoffset="-89.7" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-extrabold text-primary">100%</span>
              <span className="text-[10px] font-mono tracking-wider font-bold text-[#64748B] uppercase">
                Network Capacity
              </span>
              <p className="text-xs font-semibold text-[#0F172A] mt-1">
                Active Throughput
              </p>
            </div>
          </div>

          {/* Legend descriptive cards details */}
          <div className="flex-1 max-w-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* TCP details */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex items-start gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-primary mt-1 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#0F172A]">TCP Traffic</span>
                  <span className="text-xs text-[#64748B]">Transmission Control</span>
                  <span className="text-xl font-bold text-primary mt-1">70.2%</span>
                  <p className="text-xs text-[#64748B] mt-2 font-sans font-medium">
                    Primary payload carrier for application layer data and web traffic.
                  </p>
                </div>
              </div>

              {/* UDP details */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex items-start gap-3">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0EA5E9] mt-1 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#0F172A]">UDP Traffic</span>
                  <span className="text-xs text-[#64748B]">User Datagram</span>
                  <span className="text-xl font-bold text-[#0EA5E9] mt-1">19.5%</span>
                  <p className="text-xs text-[#64748B] mt-2 font-sans font-medium">
                    High-speed streaming, voice calls, and real-time multiplayer protocols.
                  </p>
                </div>
              </div>

              {/* ICMP details banner */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] flex items-start gap-3 col-span-1 sm:col-span-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B] mt-1 flex-shrink-0 animate-pulse" />
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[#0F172A]">ICMP & Others</span>
                    <span className="text-lg font-bold text-[#F59E0B]">10.3%</span>
                  </div>
                  <span className="text-xs text-[#64748B]">Control & Management</span>
                  <p className="text-xs text-[#64748B] mt-2 font-sans font-medium">
                    System diagnostic pings, routing advertisements, and low-level network signaling.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Total stats sub header bottom */}
        <div className="p-4 bg-white border-t border-[#E2E8F0] flex justify-center select-none font-sans font-bold">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 
              82.4 TB Processed
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 
              22.1 TB Processed
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" /> 
              11.8 TB Processed
            </div>
          </div>
        </div>
      </section>

      {/* Network Diagnostics tools box */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2 select-none">
          <span className="material-symbols-outlined text-sm">construction</span>
          Active Network Diagnostics
        </h2>

        <div className="grid grid-cols-12 gap-6">

          {/* Widget 1: Interactive PING Test tool */}
          <div className="col-span-12 md:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4 select-none">
              <span className="material-symbols-outlined text-primary text-xl">router</span>
              <h3 className="font-bold text-sm text-[#0F172A]">Connectivity Test (Ping)</h3>
            </div>

            <form onSubmit={handleStartPing} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter target IP or Hostname (e.g. 8.8.8.8)"
                value={pingTarget}
                onChange={(e) => setPingTarget(e.target.value)}
                disabled={pingStatus === 'testing'}
                className="flex-1 bg-[#F1F5F9] border-none rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-[#1E293B] placeholder-[#94A3B8] font-sans"
              />
              <button
                type="submit"
                disabled={pingStatus === 'testing'}
                className="bg-primary text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-opacity-90 disabled:opacity-50 transition-all cursor-pointer font-sans"
              >
                {pingStatus === 'testing' ? 'Testing' : 'Start Test'}
              </button>
            </form>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <div className="flex justify-between text-[11px] font-mono text-[#64748B] mb-3 pb-1 border-b border-[#E2E8F0] select-none">
                <span>Real-time status</span>
                <span className={`font-bold uppercase ${pingStatus === 'testing' ? 'text-[#F59E0B]' : 'text-[#4F46E5]'}`}>
                  {pingStatus === 'testing' ? 'Testing...' : pingStatus === 'complete' ? 'COMPLETE' : 'READY'}
                </span>
              </div>

              {/* Ping Replies details window */}
              {pingLogs.length > 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-indigo-200 space-y-1 h-[90px] overflow-y-auto mb-3">
                  {pingLogs.map((log, i) => (
                    <div key={i} className={log.includes('statistics') ? 'text-green-400 mt-2 border-t border-slate-800 pt-1' : ''}>
                      {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-dashed border-[#E2E8F0] rounded-lg p-3 h-[90px] flex items-center justify-center font-sans text-xs italic text-[#64748B] text-center mb-3Edge">
                  Awaiting test trace. Standard replies will map packet loss ratio in real-time.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] font-mono text-[#64748B] font-bold uppercase select-none">Avg Latency</p>
                  <p className="text-lg font-bold text-primary mt-0.5 font-mono">{pingStats.avgLatency}</p>
                </div>
                <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] font-mono text-[#64748B] font-bold uppercase select-none">Packet Loss</p>
                  <p className="text-lg font-bold text-[#F59E0B] mt-0.5 font-mono">{pingStats.loss}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Route Trace widget */}
          <div className="col-span-12 md:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4 select-none">
              <span className="material-symbols-outlined text-primary text-xl">alt_route</span>
              <h3 className="font-bold text-sm text-[#0F172A]">Route Trace</h3>
            </div>

            <form onSubmit={handleStartTrace} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter destination hostname (e.g. google.com)"
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
                {traceStatus === 'tracing' ? 'Tracing' : 'Trace Path'}
              </button>
            </form>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 h-[190px] overflow-y-auto">
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
                      Interrogating next autonomous gateway hop...
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <p className="text-xs text-[#64748B] italic">
                    Path visualization hops list will appear here after diagnostic initiation...
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
