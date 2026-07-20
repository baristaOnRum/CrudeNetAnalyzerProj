/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Modal } from './common/Modal';

interface NetworkAnalyzerProps {
  activeAnalysisId: number | null;
  setActiveAnalysisId: (id: number) => void;
  isMonitoring: boolean;
  setIsMonitoring: (val: boolean) => void;
}

export const NetworkAnalyzer: React.FC<NetworkAnalyzerProps> = ({ activeAnalysisId: propAnalysisId, setActiveAnalysisId: setPropAnalysisId, isMonitoring, setIsMonitoring }) => {
  // Device management modal state
  const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false);
  const [devicesList, setDevicesList] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [isAddDeviceModalOpen, setIsAddDeviceModalOpen] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({ nombre: '', tipo: 'Router', direccionIP: '', direccionMAC: '', estado: 'Activo' });

  // Load Analysis modal state
  const [isLoadAnalysisModalOpen, setIsLoadAnalysisModalOpen] = useState(false);
  const [availableAnalyses, setAvailableAnalyses] = useState<any[]>([]);

  const [activeAnalysisId, setActiveAnalysisId] = useState<number | null>(propAnalysisId);
  const activeAnalysisIdRef = useRef<number | null>(propAnalysisId);
  
  const handleSetActiveAnalysisId = (id: number | null) => {
    setActiveAnalysisId(id);
    activeAnalysisIdRef.current = id;
    setPropAnalysisId(id as number);
  };

  // Interface registration modal state
  const [isInterfaceModalOpen, setIsInterfaceModalOpen] = useState(false);
  const [isUsbInterface, setIsUsbInterface] = useState(false);
  const [interfaceData, setInterfaceData] = useState<any>({ idAnalisis: activeAnalysisId || '', nombreInterfaz: '', macAddress: '', ipAddress: '0.0.0.0' });
  const [availableInterfaces, setAvailableInterfaces] = useState<{name: string, mac: string}[]>([]);
  const [packetStream, setPacketStream] = useState<any[]>([]);
  const [pendingAnalysisAction, setPendingAnalysisAction] = useState<'pasivo' | 'activo' | null>(null);

  // Speed Test config modal state
  const [isSpeedTestModalOpen, setIsSpeedTestModalOpen] = useState(false);
  const [speedTestProviders, setSpeedTestProviders] = useState<{id: string, displayName: string, targetHost: string}[]>([]);
  const [speedTestConfig, setSpeedTestConfig] = useState<{
    provider: string;
    testType: string;
    sizeBytes: number;
    customMb: string;
  }>({
    provider: 'CLOUDFLARE',
    testType: 'DOWNLOAD',
    sizeBytes: 10_000_000,
    customMb: ''
  });
  const [speedTestRunning, setSpeedTestRunning] = useState(false);
  const [speedTestResult, setSpeedTestResult] = useState<any>(null);

  // Monitoring states
  const [packetStats, setPacketStats] = useState<any>({ total: 0, protocols: {} });
  const [trafficMetrics, setTrafficMetrics] = useState({ pps: 0, mbps: 0, loss: 0 });
  // Promedio de métricas al finalizar una sesión de análisis activo
  const [sessionAvgMetrics, setSessionAvgMetrics] = useState<{ pps: number; mbps: number; loss: number } | null>(null);
  const metricsAccRef = useRef<{ ppsSum: number; mbpsSum: number; lossSum: number; ticks: number }>({
    ppsSum: 0, mbpsSum: 0, lossSum: 0, ticks: 0
  });
  // Flag separado para el polling interno del análisis activo (speedtest)
  // isMonitoring queda reservado EXCLUSIVAMENTE para el monitoreo pasivo
  const [isActiveCapturing, setIsActiveCapturing] = useState(false);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Incremental fetching refs
  const lastFetchTimestampRef = useRef<number>(Date.now());
  const monitoringStartRef = useRef<number>(Date.now());
  const lastPacketIdRef = useRef<number>(0);
  const sessionProtocolsRef = useRef<Record<string, number>>({});
  const totalSessionPktsRef = useRef<number>(0);

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

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices');
      if (response.ok) {
        const data = await response.json();
        setDevicesList(data);
      }
    } catch (e) {
      console.error('Failed to fetch devices', e);
    }
  };

  const fetchInterfaces = async () => {
    try {
      const response = await fetch('/api/analysis/interfaces');
      if (response.ok) {
        const data = await response.json();
        setAvailableInterfaces(data);
        
        try {
          const activeResp = await fetch('/api/analysis/interface');
          if (activeResp.status === 200) {
            const activeData = await activeResp.json();
            if (activeData && activeData.nombreInterfaz) {
              setInterfaceData((prev: any) => ({
                ...prev,
                nombreInterfaz: activeData.nombreInterfaz,
                macAddress: activeData.macAddress,
                ipAddress: activeData.ipAddress || '0.0.0.0',
                idAnalisis: activeData.idAnalisis || ''
              }));
            } else {
              setInterfaceData((prev: any) => ({ ...prev, nombreInterfaz: '', macAddress: '', idAnalisis: '' }));
            }
          } else {
            setInterfaceData((prev: any) => ({ ...prev, nombreInterfaz: '', macAddress: '', idAnalisis: '' }));
          }
        } catch (err) {
          console.error('No active interface found', err);
        }
      }
    } catch (e) {
      console.error('Failed to fetch interfaces', e);
    }
  };

  const handleCreateDevice = async () => {
    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeviceData)
      });
      if (response.ok) {
        Swal.fire('Éxito', 'Dispositivo de red creado correctamente', 'success');
        setIsAddDeviceModalOpen(false);
        fetchDevices();
      } else {
        Swal.fire('Error', 'No se pudo crear el dispositivo', 'error');
      }
    } catch (e) {
      Swal.fire('Error', 'Fallo de conexión al servidor', 'error');
    }
  };

  const handleDeleteDevice = async (id: number) => {
    try {
      const response = await fetch(`/api/devices/${id}`, { method: 'DELETE' });
      if (response.ok) {
        Swal.fire('Eliminado', 'Dispositivo eliminado', 'success');
        fetchDevices();
      }
    } catch (e) {
      Swal.fire('Error', 'Fallo al eliminar dispositivo', 'error');
    }
  };

  const handleRegisterInterface = async () => {
    if (!interfaceData.nombreInterfaz) {
      Swal.fire('Atención', 'Por favor seleccione una interfaz primero', 'warning');
      return;
    }

    setIsUsbInterface(interfaceData.nombreInterfaz.toLowerCase().includes('usbpcap'));
    
    try {
      const response = await fetch('/api/analysis/interface', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...interfaceData,
          idAnalisis: activeAnalysisId || interfaceData.idAnalisis
        })
      });
      if (response.ok) {
        setIsInterfaceModalOpen(false);
        
        if (pendingAnalysisAction === 'pasivo') {
          Swal.fire('Éxito', 'Interfaz vinculada', 'success');
          await executeStartPasivo();
          setPendingAnalysisAction(null);
        } else if (pendingAnalysisAction === 'activo') {
          // 1. Crear sesión de análisis activo en el backend
          let newAnalysisId = activeAnalysisId;
          if (!newAnalysisId) {
            try {
              const analysisRes = await fetch('/api/analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: 'Análisis Activo' })
              });
              if (analysisRes.ok) {
                const analysisData = await analysisRes.json();
                handleSetActiveAnalysisId(analysisData.id);
                newAnalysisId = analysisData.id;
              }
            } catch (_) {}
          }
          // 2. Cargar proveedores y abrir modal de configuración del speed test
          try {
            const provRes = await fetch('/api/analysis/active/providers');
            if (provRes.ok) setSpeedTestProviders(await provRes.json());
          } catch (_) {}
          setSpeedTestResult(null);
          setSpeedTestRunning(false);
          setIsSpeedTestModalOpen(true);
          // pendingAnalysisAction se limpia al ejecutar/cancelar el speed test
        } else {
          Swal.fire('Éxito', 'Interfaz de red vinculada', 'success');
          setPendingAnalysisAction(null);
        }
      } else {
        Swal.fire('Error', 'Fallo al vincular la interfaz', 'error');
        setPendingAnalysisAction(null);
      }
    } catch (e) {
      Swal.fire('Error', 'Fallo de red al registrar interfaz', 'error');
      setPendingAnalysisAction(null);
    }
  };

  // Cleanup on unmount, and resume polling if isMonitoring is true
  useEffect(() => {
    fetchInterfaces();
    
    if (isMonitoring) {
      // Resume polling without starting a new backend session
      monitoringIntervalRef.current = setInterval(fetchPackets, 1000);
    }
    
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
    };
  }, [isMonitoring]);

  useEffect(() => {
    if (activeAnalysisId) {
      setInterfaceData(prev => ({ ...prev, idAnalisis: activeAnalysisId }));
    }
  }, [activeAnalysisId]);

  const fetchPackets = async () => {
    const fetchStartTime = Date.now();
    try {
      const sinceId = lastPacketIdRef.current;
      const response = await fetch(`/api/packets?sinceId=${sinceId}`);
      if (response.ok) {
        let data: any[] = await response.json();
        const currentAnalysisId = activeAnalysisIdRef.current;
        if (currentAnalysisId) {
          data = data.filter(p => p.idAnalisis === currentAnalysisId);
        }

        if (data.length > 0) {
          // Update last ID seen
          lastPacketIdRef.current = Math.max(...data.map(p => p.id));
          
          // Prepend to stream, keep last 50
          setPacketStream(prev => {
            const combined = [...data.reverse(), ...prev];
            return combined.slice(0, 50);
          });
          
          // Accumulate stats
          data.forEach(p => {
            const proto = p.tipoPaquete || 'Desconocido';
            sessionProtocolsRef.current[proto] = (sessionProtocolsRef.current[proto] || 0) + 1;
          });
          totalSessionPktsRef.current += data.length;
          
          setPacketStats({
            total: totalSessionPktsRef.current,
            protocols: { ...sessionProtocolsRef.current }
          });
        }

        // Instantaneous metrics
        const intervalSec = Math.max(0.1, (fetchStartTime - lastFetchTimestampRef.current) / 1000);
        
        const deltaPkts = data.length;
        const deltaBytes = data.reduce((acc, p) => {
          if (p.longitud && p.longitud > 0) return acc + p.longitud;
          if (p.contenidos) return acc + new Blob([p.contenidos]).size;
          return acc + 64; 
        }, 0);

        const pps = +(deltaPkts / intervalSec).toFixed(2);
        const mbps = +((deltaBytes * 8) / intervalSec / 1_000_000).toFixed(4);

        lastFetchTimestampRef.current = fetchStartTime;

        // Packet loss
        const noResponse = data.filter(p => !p.respuesta || p.respuesta.trim() === '').length;
        const loss = data.length > 0
          ? +((noResponse / data.length) * 100).toFixed(2)
          : 0;

        // Siempre actualizar métricas, incluso si no llegan paquetes nuevos en este tick
        setTrafficMetrics({ pps, mbps, loss });

        // Acumular para promedio al finalizar sesión
        metricsAccRef.current.ppsSum += pps;
        metricsAccRef.current.mbpsSum += mbps;
        metricsAccRef.current.lossSum += loss;
        metricsAccRef.current.ticks += 1;
      }
    } catch (e) {
      console.error('Failed to fetch packets for monitoring', e);
    }
  };

  const toggleMonitoring = async () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
      try {
        await fetch('/api/analysis/stop', { method: 'POST' });
      } catch (e) {
        console.error('Failed to stop backend capture', e);
      }
    } else {
      setPendingAnalysisAction('pasivo');
      setIsInterfaceModalOpen(true);
    }
  };

  const executeStartPasivo = async () => {
    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: 'Monitoreo Pasivo' })
      });
      if (response.ok) {
        const data = await response.json();
        handleSetActiveAnalysisId(data.id);
        await fetch(`/api/analysis/interface/${interfaceData.nombreInterfaz}/analyze`, { method: 'POST' });
      }
    } catch (e) {
      console.error('Failed to create analysis session', e);
    }
    setIsMonitoring(true);
    monitoringStartRef.current = Date.now();
    lastFetchTimestampRef.current = Date.now();
    lastPacketIdRef.current = 0;
    sessionProtocolsRef.current = {};
    totalSessionPktsRef.current = 0;
    
    setPacketStream([]);
    setPacketStats({ total: 0, protocols: {} });
    setTrafficMetrics({ pps: 0, mbps: 0, loss: 0 });
    fetchPackets();
    monitoringIntervalRef.current = setInterval(fetchPackets, 1000);
    
    // Iniciar diagnósticos base automáticamente en la UI
    if (!isUsbInterface) {
      setPingTarget('8.8.8.8');
      setTraceTarget('8.8.8.8');
      setTimeout(() => {
        handleStartPing(undefined, '8.8.8.8');
        handleStartTrace(undefined, '8.8.8.8');
      }, 100);
    }
  };

  const handleStartActiveAnalysis = async () => {
    setPendingAnalysisAction('activo');
    setIsInterfaceModalOpen(true);
  };

  const executeStartActivo = async () => {
    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: 'Análisis Activo' })
      });
      if (response.ok) {
        const data = await response.json();
        handleSetActiveAnalysisId(data.id);
        Swal.fire('Éxito', `Sesión de análisis activo ${data.id} iniciada`, 'success');
        await fetch(`/api/analysis/interface/${interfaceData.nombreInterfaz}/analyze`, { method: 'POST' });
        
        if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
        setIsMonitoring(true);
        monitoringStartRef.current = Date.now();
        lastFetchTimestampRef.current = Date.now();
        lastPacketIdRef.current = 0;
        sessionProtocolsRef.current = {};
        totalSessionPktsRef.current = 0;
        
        setPacketStream([]);
        setPacketStats({ total: 0, protocols: {} });
        setTrafficMetrics({ pps: 0, mbps: 0, loss: 0 });
        
        fetchPackets();
        monitoringIntervalRef.current = setInterval(fetchPackets, 1000);
        
        // Iniciar diagnósticos base automáticamente en la UI
        if (!isUsbInterface) {
          setPingTarget('8.8.8.8');
          setTraceTarget('8.8.8.8');
          setTimeout(() => {
            handleStartPing(undefined, '8.8.8.8');
            handleStartTrace(undefined, '8.8.8.8');
          }, 100);
        }
      }
    } catch (e) {
      console.error('Failed to start active analysis', e);
        Swal.fire('Error', 'Fallo al iniciar análisis activo', 'error');
    }
  };

  const handleOpenLoadAnalysis = async () => {
    try {
      const response = await fetch('/api/analysis?page=0&size=50');
      if (response.ok) {
        const data = await response.json();
        setAvailableAnalyses(data.content || data);
        setIsLoadAnalysisModalOpen(true);
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'No se pudieron cargar las sesiones de análisis', 'error');
    }
  };

  const handleLoadAnalysis = async (session: any) => {
    setIsLoadAnalysisModalOpen(false);
    Swal.fire({
      title: 'Cargando sesión...',
      text: 'Calculando tráfico promedio y obteniendo paquetes',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      // 1. Fetch Summary
      const summaryRes = await fetch(`/api/analysis/${session.id}/summary`);
      let summary = null;
      if (summaryRes.ok) summary = await summaryRes.json();

      // 2. Fetch last packets (page 0, size 50)
      const packetsRes = await fetch(`/api/packets?idAnalisis=${session.id}&page=0&size=50`);
      let packets: any[] = [];
      if (packetsRes.ok) {
        const pData = await packetsRes.json();
        packets = pData.content || pData;
      }

      if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
      setIsMonitoring(false);
      handleSetActiveAnalysisId(session.id);

      // Populate cards
      if (summary) {
        const pps = summary.durationSeconds > 0 ? +(summary.totalPackets / summary.durationSeconds).toFixed(2) : 0;
        const mbps = summary.durationSeconds > 0 ? +((summary.totalBytes * 8 / 1_000_000) / summary.durationSeconds).toFixed(4) : 0;
        
        setPacketStats({
          total: summary.totalPackets,
          protocols: summary.protocolDistribution || {}
        });
        setTrafficMetrics({ pps, mbps, loss: 0 }); // Note: loss calculation for historical can be complex, defaulting to 0 or we could iterate packets if needed
      }

      setPacketStream(packets.map((p: any) => ({
        ...p,
        id: p.id || Math.floor(Math.random() * 90000)
      })));

      Swal.close();
      Swal.fire('Cargado', `Sesión #${session.id} cargada exitosamente.`, 'success');
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Fallo al cargar la sesión', 'error');
    }
  };

  const getProtocolSlices = () => {
    if (!packetStats.protocols || packetStats.total === 0) return [];
    
    let otherCount = 0;
    const slices: any[] = [];
    const threshold = 0.16 * packetStats.total; // 16%

    const sortedProtos = Object.entries(packetStats.protocols).sort((a: any, b: any) => b[1] - a[1]);
    
    for (const [proto, count] of sortedProtos) {
      if ((count as number) >= threshold) {
        slices.push({ name: proto, count: count as number });
      } else {
        otherCount += (count as number);
      }
    }
    
    if (otherCount > 0) {
      slices.push({ name: 'Otros', count: otherCount });
    }

    const colorMap: any = {
      'TCP': '#3B82F6',
      'UDP': '#F97316',
      'ICMP': '#22C55E',
      'TLSv1.2': '#A855F7',
      'TLSv1.3': '#EC4899',
      'DNS': '#EAB308',
      'MDNS': '#06B6D4',
      'Otros': '#94A3B8'
    };
    const defaultColors = ['#F43F5E', '#8B5CF6', '#14B8A6', '#F59E0B', '#3B82F6'];
    let colorIdx = 0;

    const circumference = 100;
    let currentOffset = 0;

    return slices.map(s => {
      const pct = Math.round((s.count / packetStats.total) * 100);
      const stroke = (pct / 100) * circumference;
      const offset = circumference - currentOffset;
      const color = colorMap[s.name] || defaultColors[colorIdx++ % defaultColors.length];
      
      currentOffset += stroke;

      return {
        ...s,
        pct,
        color,
        dasharray: `${stroke} ${circumference - stroke}`,
        offset
      };
    });
  };

  const protocolSlices = getProtocolSlices();

  const handleStartPing = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent, overrideTarget?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    const target = overrideTarget || pingTarget;
    if (!target) return;

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
    setPingLogs([`PING [${target}] with 32 bytes of data:`]);
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
          body: JSON.stringify({ target: target })
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
            setPingLogs((prev) => [...prev, `Request timed out for seq ${seq}. Target: ${target}`]);
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

  const handleStartTrace = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent, overrideTarget?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    const target = overrideTarget || traceTarget;
    if (!target) return;

    setTraceStatus('tracing');
    setTraceHops([]);

    try {
      const response = await fetch('/api/diagnostics/traceroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target })
      });

      if (!response.ok) {
        throw new Error('Trace failed');
      }

      const data = await response.json();
      
      const mappedHops = data.map((hop: any) => ({
        hop: hop.hop,
        ip: hop.ip || '*',
        location: hop.timeout ? 'Request timed out' : (hop.hostname || 'Unknown'),
        latency: hop.latency ?? 0
      }));

      setTraceHops(mappedHops);
    } catch (err) {
      console.error(err);
      setTraceHops([{ hop: 1, ip: 'error', location: 'Trace failed to execute', latency: 0 }]);
    } finally {
      setTraceStatus('complete');
    }
  };

  const handleOpenInterfaceModal = async () => {
    try {
      const statusRes = await fetch('/api/analysis/npcap-status');
      if (statusRes.ok) {
        const isInstalled = await statusRes.json();
        if (!isInstalled) {
          const result = await Swal.fire({
            title: 'Dependencia Faltante',
            text: 'Npcap no está instalado. Es un controlador necesario para capturar paquetes de red nativos. ¿Desea instalarlo ahora?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, instalar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#4F46E5'
          });
          if (result.isConfirmed) {
            Swal.fire({
              title: 'Instalando Npcap...',
              text: 'Sigue las instrucciones en la ventana del instalador. Esta alerta se cerrará al terminar.',
              allowOutsideClick: false,
              didOpen: () => { Swal.showLoading(); }
            });
            const installRes = await fetch('/api/analysis/install-npcap', { method: 'POST' });
            if (installRes.ok) {
              Swal.fire({ title: 'Completado', text: 'Npcap se ha instalado correctamente.', icon: 'success', timer: 2000, showConfirmButton: false });
            } else {
              Swal.fire('Error', 'Hubo un problema al instalar Npcap.', 'error');
              return;
            }
          } else {
            return;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    await fetchInterfaces();
    setIsInterfaceModalOpen(true);
  };

  return (
    <div className="space-y-6 font-sans mt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 select-none">
        <div>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0 flex-wrap">


                    <button 
                      onClick={toggleMonitoring}
                      className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 w-full md:w-auto shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[20px]">{isMonitoring ? 'stop_circle' : 'play_circle'}</span>
                      {isMonitoring ? 'Detener Monitoreo Pasivo' : 'Monitoreo Pasivo'}
                    </button>
                    <button 
                      onClick={handleStartActiveAnalysis}
                      disabled={isMonitoring}
                      className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 w-full md:w-auto disabled:opacity-50 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[20px]">radar</span>
                      Análisis Activo
                    </button>
                    <button 
                      onClick={handleOpenLoadAnalysis}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 w-full md:w-auto shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[20px]">history</span>
                      Cargar Análisis
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
            <span className="text-3xl font-extrabold text-[#0F172A] font-mono">
              {(isMonitoring || isActiveCapturing)
                ? trafficMetrics.pps
                : sessionAvgMetrics
                ? sessionAvgMetrics.pps
                : activeAnalysisId ? trafficMetrics.pps : '--'}
            </span>
            {!isMonitoring && !isActiveCapturing && sessionAvgMetrics && (
              <span className="text-[10px] text-slate-400 mb-1 font-semibold tracking-wide uppercase">prom.</span>
            )}
            <span className="text-sm text-[#64748B] mb-1 font-bold">pps</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#64748B] text-lg">network_check</span>
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tasa de Datos</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-[#0F172A] font-mono">
              {(isMonitoring || isActiveCapturing)
                ? trafficMetrics.mbps
                : sessionAvgMetrics
                ? sessionAvgMetrics.mbps
                : activeAnalysisId ? trafficMetrics.mbps : '--'}
            </span>
            {!isMonitoring && !isActiveCapturing && sessionAvgMetrics && (
              <span className="text-[10px] text-slate-400 mb-1 font-semibold tracking-wide uppercase">prom.</span>
            )}
            <span className="text-sm text-[#64748B] mb-1 font-bold">Mbps</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#64748B] text-lg">warning</span>
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Pérdida de Paquetes</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-extrabold text-[#F59E0B] font-mono">
              {(isMonitoring || isActiveCapturing)
                ? trafficMetrics.loss
                : sessionAvgMetrics
                ? sessionAvgMetrics.loss
                : activeAnalysisId ? trafficMetrics.loss : '--'}
            </span>
            {!isMonitoring && !isActiveCapturing && sessionAvgMetrics && (
              <span className="text-[10px] text-slate-400 mb-1 font-semibold tracking-wide uppercase">prom.</span>
            )}
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
          {protocolSlices.slice(0, 3).map((s, idx) => (
            <div key={idx} className="col-span-12 md:col-span-4 bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-sans text-[10px] uppercase font-bold tracking-wider text-[#64748B]">Tráfico {s.name}</p>
                  <h3 className={`text-2xl font-bold mt-1 font-sans ${(isMonitoring || activeAnalysisId) ? 'text-primary' : 'text-slate-300'}`}>
                    {(isMonitoring || activeAnalysisId) ? s.count : '--'} Pkts
                  </h3>
                </div>
                <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border uppercase ${(isMonitoring || activeAnalysisId) ? 'bg-[#F0FDF4] text-[#166534] border-[#D1FAE5]' : 'text-slate-400 bg-slate-50 border-slate-200'}`}>
                  {(isMonitoring || activeAnalysisId) ? 'Activo' : 'Esperando'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Protocol Distribution Circular Chart section */}
      <section className="bg-white border border-[#E2E8F0] rounded-2xl flex flex-col min-h-[460px] overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#E2E8F0] bg-white flex justify-between items-center select-none">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-[#0F172A]">Análisis de Distribución de Protocolos</h3>
            <span className={`text-[10px] font-mono tracking-widest px-2.5 py-0.5 rounded font-bold uppercase border ${(isMonitoring || activeAnalysisId) ? 'bg-[#F0FDF4] text-[#166534] border-[#D1FAE5]' : 'bg-slate-100 text-slate-400 border-[#E2E8F0]'}`}>
              {isMonitoring ? 'Registrando en Vivo' : (activeAnalysisId ? 'Visualizando Histórico' : 'Sin datos activos')}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-8 gap-8">
          <div className={`relative w-72 h-72 flex-shrink-0 select-none ${(isMonitoring || activeAnalysisId) ? '' : 'opacity-50'}`}>
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#F1F5F9" strokeWidth="3" />
              {(isMonitoring || activeAnalysisId) && packetStats.total > 0 && protocolSlices.map((s, i) => (
                <circle key={i} cx="18" cy="18" fill="transparent" r="15.915" stroke={s.color} strokeWidth="3" strokeDasharray={s.dasharray} strokeDashoffset={s.offset} />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-4xl font-extrabold ${(isMonitoring || activeAnalysisId) ? 'text-[#0F172A]' : 'text-slate-300'}`}>
                {(isMonitoring || activeAnalysisId) ? packetStats.total : '--'}
              </span>
              <span className={`text-[10px] font-mono tracking-wider font-bold uppercase mt-1 ${(isMonitoring || activeAnalysisId) ? 'text-[#64748B]' : 'text-slate-400'}`}>
                Total Pkts
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-xl flex items-center justify-center border border-[#E2E8F0] rounded-xl bg-white min-h-[200px] shadow-sm">
            {(isMonitoring || activeAnalysisId) ? (
              <div className="w-full p-6 space-y-4">
                {protocolSlices.map((s, i) => (
                  <div key={i} className="flex justify-between items-center group hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: s.color }}></div>
                      <span className="font-semibold text-slate-700">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-800 tabular-nums w-12 text-right">{s.pct}%</span>
                    </div>
                  </div>
                ))}
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

          <div className="col-span-12 md:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4 select-none">
              <span className="material-symbols-outlined text-primary text-xl">router</span>
              <h3 className="font-bold text-sm text-[#0F172A]">Prueba de Conectividad (Ping)</h3>
            </div>

            {isUsbInterface && (
              <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>Herramienta inactiva: No aplicable a capturas de bus USB.</span>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ingrese IP o Hostname de destino (ej. 8.8.8.8)"
                value={pingTarget}
                onChange={(e) => setPingTarget(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !(!isMonitoring || pingStatus === 'testing' || isUsbInterface) && handleStartPing(e)}
                disabled={pingStatus === 'testing' || !isMonitoring || isUsbInterface}
                className="flex-1 bg-[#F1F5F9] border-none rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-[#1E293B] placeholder-[#94A3B8] font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleStartPing}
                disabled={!isMonitoring || isUsbInterface}
                className={`text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-opacity-90 transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed ${pingStatus === 'testing' ? 'bg-red-500' : 'bg-primary'}`}
              >
                {pingStatus === 'testing' ? 'Detener Prueba' : 'Iniciar Prueba'}
              </button>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <div className="flex justify-between text-[11px] font-mono text-[#64748B] mb-3 pb-1 border-b border-[#E2E8F0] select-none">
                <span>Estado en tiempo real</span>
                <span className={`font-bold uppercase ${pingStatus === 'testing' ? 'text-[#F59E0B] animate-pulse' : 'text-[#4F46E5]'}`}>
                  {pingStatus === 'testing' ? 'PROBANDO...' : pingStatus === 'complete' ? 'COMPLETADO' : 'LISTO'}
                </span>
              </div>

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

          <div className="col-span-12 md:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4 select-none">
              <span className="material-symbols-outlined text-primary text-xl">alt_route</span>
              <h3 className="font-bold text-sm text-[#0F172A]">Traza de Ruta</h3>
            </div>

            {isUsbInterface && (
              <div className="mb-4 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">warning</span>
                <span>Herramienta inactiva: No aplicable a capturas de bus USB.</span>
              </div>
            )}

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Ingrese hostname de destino (ej. google.com)"
                value={traceTarget}
                onChange={(e) => setTraceTarget(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !(!isMonitoring || traceStatus === 'tracing' || isUsbInterface) && handleStartTrace(e)}
                disabled={traceStatus === 'tracing' || !isMonitoring || isUsbInterface}
                className="flex-1 bg-[#F1F5F9] border-none rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 text-[#1E293B] placeholder-[#94A3B8] font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={handleStartTrace}
                disabled={traceStatus === 'tracing' || !isMonitoring || isUsbInterface}
                className="bg-primary text-white font-semibold px-4 py-2 rounded-lg text-xs hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-sans"
              >
                {traceStatus === 'tracing' ? 'Rastreando' : 'Trazar Ruta'}
              </button>
            </div>

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

      {/* Network Devices List Modal */}
      <Modal
        isOpen={isDevicesModalOpen}
        onClose={() => setIsDevicesModalOpen(false)}
        title="Gestión de Dispositivos de Red"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-600">Dispositivos registrados en la infraestructura de red</p>
            <button
              onClick={() => setIsAddDeviceModalOpen(true)}
              className="bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-opacity-90 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Nuevo Dispositivo
            </button>
          </div>

          <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3">Nombre</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">IP</th>
                  <th className="p-3">MAC</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {devicesList.length > 0 ? (
                  devicesList.map((dev) => (
                    <tr key={dev.idDispositivo} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">{dev.nombre}</td>
                      <td className="p-3 text-slate-600">{dev.tipo}</td>
                      <td className="p-3 font-mono text-slate-700">{dev.direccionIP}</td>
                      <td className="p-3 font-mono text-slate-500">{dev.direccionMAC || 'N/A'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${dev.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {dev.estado || 'Activo'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedDevice(dev)}
                          className="text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Detalles
                        </button>
                        <button
                          onClick={() => handleDeleteDevice(dev.idDispositivo)}
                          className="text-red-500 hover:underline font-semibold cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-slate-400 italic">
                      No hay dispositivos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Add New Device Modal */}
      <Modal
        isOpen={isAddDeviceModalOpen}
        onClose={() => setIsAddDeviceModalOpen(false)}
        title="Registrar Nuevo Dispositivo"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              value={newDeviceData.nombre}
              onChange={(e) => setNewDeviceData({ ...newDeviceData, nombre: e.target.value })}
              className="w-full bg-[#F1F5F9] border-none rounded-lg px-3 py-2 text-xs text-slate-800"
              placeholder="ej. Router Principal Norte"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
              <select
                value={newDeviceData.tipo}
                onChange={(e) => setNewDeviceData({ ...newDeviceData, tipo: e.target.value })}
                className="w-full bg-[#F1F5F9] border-none rounded-lg px-3 py-2 text-xs text-slate-800"
              >
                <option value="Router">Router</option>
                <option value="Switch">Switch</option>
                <option value="Firewall">Firewall</option>
                <option value="Servidor">Servidor</option>
                <option value="Access Point">Access Point</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
              <select
                value={newDeviceData.estado}
                onChange={(e) => setNewDeviceData({ ...newDeviceData, estado: e.target.value })}
                className="w-full bg-[#F1F5F9] border-none rounded-lg px-3 py-2 text-xs text-slate-800"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Mantenimiento">Mantenimiento</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dirección IP</label>
            <input
              type="text"
              value={newDeviceData.direccionIP}
              onChange={(e) => setNewDeviceData({ ...newDeviceData, direccionIP: e.target.value })}
              className="w-full bg-[#F1F5F9] border-none rounded-lg px-3 py-2 text-xs font-mono text-slate-800"
              placeholder="192.168.1.1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dirección MAC</label>
            <input
              type="text"
              value={newDeviceData.direccionMAC}
              onChange={(e) => setNewDeviceData({ ...newDeviceData, direccionMAC: e.target.value })}
              className="w-full bg-[#F1F5F9] border-none rounded-lg px-3 py-2 text-xs font-mono text-slate-800"
              placeholder="00:11:22:33:44:55"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAddDeviceModalOpen(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateDevice}
              className="px-4 py-2 bg-primary hover:bg-opacity-90 rounded-lg text-xs font-semibold text-white"
            >
              Guardar Dispositivo
            </button>
          </div>
        </div>
      </Modal>

      {/* Selected Device Details Modal */}
      {selectedDevice && (
        <Modal
          isOpen={!!selectedDevice}
          onClose={() => setSelectedDevice(null)}
          title={`Detalles de Dispositivo: ${selectedDevice.nombre}`}
          size="md"
        >
          <div className="space-y-3 font-sans text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">ID Dispositivo:</span>
                <span className="font-mono text-slate-800">{selectedDevice.idDispositivo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Nombre:</span>
                <span className="text-slate-800">{selectedDevice.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Tipo:</span>
                <span className="text-slate-800">{selectedDevice.tipo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">IP:</span>
                <span className="font-mono text-slate-800">{selectedDevice.direccionIP}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">MAC:</span>
                <span className="font-mono text-slate-800">{selectedDevice.direccionMAC || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Estado:</span>
                <span className="font-bold text-emerald-600">{selectedDevice.estado}</span>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDevice(null)}
                className="px-4 py-2 bg-primary text-white rounded-lg font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Register Interface Modal */}
      <Modal
        isOpen={isInterfaceModalOpen}
        onClose={() => setIsInterfaceModalOpen(false)}
        title={pendingAnalysisAction === 'activo' ? 'Seleccionar Interfaz — Análisis Activo (Paso 1 de 2)' : 'Vincular Interfaz de Red'}
        size="md"
      >
        <div className="space-y-4">
          {pendingAnalysisAction === 'activo' && (
            <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
              <span className="material-symbols-outlined text-indigo-500 text-[18px] mt-0.5">info</span>
              <p className="text-xs text-indigo-700">
                Selecciona una interfaz de red <strong>Ethernet o Wi-Fi</strong>. Las interfaces USB no están disponibles para análisis activo.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Interfaz</label>
            <select
              value={interfaceData.nombreInterfaz}
              onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) {
                  setInterfaceData({ ...interfaceData, nombreInterfaz: '', macAddress: '' });
                  return;
                }
                const selectedIface = availableInterfaces.find(iface => iface.name.startsWith(`${selectedId}.`));
                setInterfaceData({ 
                  ...interfaceData, 
                  nombreInterfaz: selectedId, 
                  macAddress: selectedIface ? selectedIface.mac : '00:00:00:00:00:00' 
                });
              }}
              className="w-full bg-[#F1F5F9] border-none rounded-lg px-3 py-2 text-xs text-slate-800 cursor-pointer"
            >
              <option value="" disabled>Seleccione una interfaz...</option>
              {availableInterfaces.length === 0 && <option value="1">1. Default Interface</option>}
              {availableInterfaces
                .filter(iface => {
                  // En modo análisis activo, excluir interfaces USB/USBPcap
                  if (pendingAnalysisAction === 'activo') {
                    const lc = iface.name.toLowerCase();
                    return !lc.includes('usbpcap') && !lc.includes('usb');
                  }
                  return true;
                })
                .map(iface => {
                  const id = iface.name.split('.')[0];
                  let friendlyName = iface.name;
                  const match = iface.name.match(/\(([^)]+)\)/);
                  if (match) {
                    friendlyName = match[1];
                  } else {
                    friendlyName = iface.name.replace(/^\d+\.\s*/, '');
                  }
                  return <option key={id} value={id}>{id}. {friendlyName}</option>;
                })}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dirección MAC</label>
            <input
              type="text"
              disabled={true}
              value={interfaceData.macAddress}
              className="w-full bg-[#F1F5F9] border-none rounded-lg px-3 py-2 text-xs font-mono text-slate-500 cursor-not-allowed"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setIsInterfaceModalOpen(false);
                setPendingAnalysisAction(null);
              }}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleRegisterInterface}
              className="px-4 py-2 bg-primary hover:bg-opacity-90 rounded-lg text-xs font-semibold text-white"
            >
              Vincular Interfaz
            </button>
          </div>
        </div>
      </Modal>

      {/* Speed Test Config Modal */}
      <Modal
        isOpen={isSpeedTestModalOpen}
        onClose={() => {
          setIsSpeedTestModalOpen(false);
          setPendingAnalysisAction(null);
        }}
        title="Configurar Análisis Activo"
        size="md"
      >
        <div className="space-y-5">
          {!speedTestResult && (
            <>
              {/* Proveedor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proveedor / Servicio</label>
                <select
                  value={speedTestConfig.provider}
                  onChange={e => {
                    setSpeedTestConfig(prev => ({ ...prev, provider: e.target.value }));
                  }}
                  className="w-full bg-[#F1F5F9] border-none rounded-lg px-3 py-2 text-xs text-slate-800 cursor-pointer"
                  disabled={speedTestRunning}
                >
                  {speedTestProviders.length > 0
                    ? speedTestProviders.map(p => (
                        <option key={p.id} value={p.id}>{p.displayName}</option>
                      ))
                    : <option value="CLOUDFLARE">Cloudflare Speed Test</option>
                  }
                </select>
                {/* Host objetivo derivado del proveedor (solo informativo) */}
                {speedTestProviders.find(p => p.id === speedTestConfig.provider) && (
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Host: {speedTestProviders.find(p => p.id === speedTestConfig.provider)!.targetHost}
                  </p>
                )}
              </div>

              {/* Tipo de prueba */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Prueba</label>
                <div className="flex gap-3">
                  {['DOWNLOAD', 'UPLOAD'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSpeedTestConfig(prev => ({ ...prev, testType: t }))}
                      disabled={speedTestRunning}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                        speedTestConfig.testType === t
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'DOWNLOAD' ? '↓ Descarga' : '↑ Subida'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tamaño del payload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tamaño del Payload</label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 5, 10, 25, 50, 100].map(mb => (
                    <button
                      key={mb}
                      onClick={() => setSpeedTestConfig(prev => ({ ...prev, sizeBytes: mb * 1_000_000, customMb: '' }))}
                      disabled={speedTestRunning}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        speedTestConfig.sizeBytes === mb * 1_000_000 && !speedTestConfig.customMb
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      } disabled:opacity-50`}
                    >
                      {mb} MB
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    placeholder="MB personalizado..."
                    value={speedTestConfig.customMb || ''}
                    disabled={speedTestRunning}
                    onChange={e => {
                      const val = e.target.value;
                      setSpeedTestConfig(prev => ({
                        ...prev,
                        customMb: val,
                        sizeBytes: val ? Number(val) * 1_000_000 : prev.sizeBytes
                      }));
                    }}
                    className="flex-1 px-3 py-1.5 bg-[#F1F5F9] border-none rounded-lg text-xs text-slate-800 placeholder-slate-400"
                  />
                  <span className="text-xs text-slate-500">MB</span>
                </div>
              </div>

              {speedTestRunning && (
                <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-indigo-700 font-medium">Ejecutando prueba y capturando tráfico en tiempo real...</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setIsSpeedTestModalOpen(false); setPendingAnalysisAction(null); }}
                  disabled={speedTestRunning}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-semibold text-slate-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  disabled={speedTestRunning}
                  onClick={async () => {
                    if (!activeAnalysisId) {
                      Swal.fire('Atención', 'No hay una sesión de análisis activa', 'warning');
                      return;
                    }
                    setSpeedTestRunning(true);

                    // Iniciar polling ANTES de la prueba (sin tocar isMonitoring del pasivo)
                    if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
                    setIsActiveCapturing(true);
                    monitoringStartRef.current = Date.now();
                    lastFetchTimestampRef.current = Date.now();
                    lastPacketIdRef.current = 0;
                    sessionProtocolsRef.current = {};
                    totalSessionPktsRef.current = 0;
                    // Resetear acumulador de promedios
                    metricsAccRef.current = { ppsSum: 0, mbpsSum: 0, lossSum: 0, ticks: 0 };
                    setSessionAvgMetrics(null);
                    setPacketStream([]);
                    setPacketStats({ total: 0, protocols: {} });
                    setTrafficMetrics({ pps: 0, mbps: 0, loss: 0 });
                    monitoringIntervalRef.current = setInterval(fetchPackets, 1000);

                    try {
                      const res = await fetch('/api/analysis/active/speedtest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          provider: speedTestConfig.provider,
                          testType: speedTestConfig.testType,
                          sizeBytes: speedTestConfig.sizeBytes,
                          interfaceName: interfaceData.nombreInterfaz,
                          // Usar ref en lugar de state para evitar race condition
                          // cuando el estado de React aún no se ha propagado al closure
                          analysisId: activeAnalysisIdRef.current
                        })
                      });
                      if (res.ok) {
                        // Detener polling y calcular promedios de la sesión
                        if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
                        setIsActiveCapturing(false);
                        const acc = metricsAccRef.current;
                        if (acc.ticks > 0) {
                          setSessionAvgMetrics({
                            pps: +(acc.ppsSum / acc.ticks).toFixed(2),
                            mbps: +(acc.mbpsSum / acc.ticks).toFixed(4),
                            loss: +(acc.lossSum / acc.ticks).toFixed(2),
                          });
                        }
                        // Cerrar modal automáticamente al terminar
                        setIsSpeedTestModalOpen(false);
                        setPendingAnalysisAction(null);
                      } else {
                        const errText = await res.text();
                        // Detener polling si hubo error
                        if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
                        setIsActiveCapturing(false);
                        Swal.fire('Error', `La prueba falló: ${errText}`, 'error');
                      }
                    } catch (e) {
                      if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
                      setIsActiveCapturing(false);
                      Swal.fire('Error', 'No se pudo conectar con el backend', 'error');
                    } finally {
                      setSpeedTestRunning(false);
                    }
                  }}
                  className="px-4 py-2 bg-primary hover:bg-opacity-90 rounded-lg text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-2"
                >
                  {speedTestRunning && <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />}
                  Iniciar Prueba
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Flujo de Paquetes en Vivo */}
      <section className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm mt-6 mb-10 overflow-hidden">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-500">list_alt</span>
          Flujo de Paquetes (En Vivo)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-3">ID</th>
                <th className="p-3">Protocolo</th>
                <th className="p-3">Fuente</th>
                <th className="p-3">Destino</th>
                <th className="p-3">Tamaño</th>
                <th className="p-3">Info</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {packetStream.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 italic">No hay paquetes capturados en la sesión actual...</td>
                </tr>
              ) : (
                packetStream.map((pkt, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-500 font-mono text-xs">{pkt.id}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${pkt.tipoPaquete === 'TCP' ? 'bg-blue-100 text-blue-700' : pkt.tipoPaquete === 'UDP' ? 'bg-orange-100 text-orange-700' : pkt.tipoPaquete === 'ICMP' ? 'bg-green-100 text-green-700' : pkt.tipoPaquete === 'TLSv1.2' || pkt.tipoPaquete === 'TLSv1.3' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                        {pkt.tipoPaquete}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-xs text-slate-700">{pkt.fuente}</td>
                    <td className="p-3 font-mono text-xs text-slate-700">{pkt.destino}</td>
                    <td className="p-3 font-mono text-xs text-slate-500">{pkt.longitud ? `${pkt.longitud} B` : '--'}</td>
                    <td className="p-3 text-slate-600 truncate max-w-xs" title={pkt.contenidos || pkt.respuesta}>{pkt.contenidos || pkt.respuesta}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal para Cargar Análisis */}
      <Modal
        isOpen={isLoadAnalysisModalOpen}
        onClose={() => setIsLoadAnalysisModalOpen(false)}
        title="Cargar Sesión de Análisis"
        subtitle="Selecciona una sesión pasada para ver sus estadísticas"
        icon="history"
      >
        <div className="space-y-4 font-sans p-2 max-h-[60vh] overflow-y-auto">
          {availableAnalyses.map(session => (
            <div key={session.id} className="flex justify-between items-center p-3 border border-[#E2E8F0] rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleLoadAnalysis(session)}>
              <div>
                <div className="font-semibold text-sm text-slate-800">Sesión #{session.id}</div>
                <div className="text-xs text-slate-500">{session.fechaEjecucion?.replace('T', ' ').substring(0, 19)}</div>
              </div>
              <span className="material-symbols-outlined text-primary text-[20px]">chevron_right</span>
            </div>
          ))}
          {availableAnalyses.length === 0 && (
            <div className="text-center text-slate-500 text-sm py-4">No hay sesiones disponibles.</div>
          )}
        </div>
      </Modal>

    </div>
  );
};
