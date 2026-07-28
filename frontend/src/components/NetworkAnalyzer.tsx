/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { formatDateVE } from '../utils/dateUtils';
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
  const [trafficMetrics, setTrafficMetrics] = useState({ pps: 0, mbps: 0, loss: 0, jitter: 0 });
  // Promedio de métricas al finalizar una sesión de análisis activo
  const [sessionAvgMetrics, setSessionAvgMetrics] = useState<{ pps: number; mbps: number; loss: number; jitter: number } | null>(null);
  const metricsAccRef = useRef<{ ppsSum: number; mbpsSum: number; lossSum: number; jitterSum: number; ticks: number; jitterTicks: number }>({
    ppsSum: 0, mbpsSum: 0, lossSum: 0, jitterSum: 0, ticks: 0, jitterTicks: 0
  });
  // Flag separado para el polling interno del análisis activo (speedtest)
  // isMonitoring queda reservado EXCLUSIVAMENTE para el monitoreo pasivo
  const [isActiveCapturing, setIsActiveCapturing] = useState(false);
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Incremental fetching refs
  const lastFetchTimestampRef = useRef<number>(Date.now());
  const isFetchingRef = useRef<boolean>(false);
  const monitoringStartRef = useRef<number>(Date.now());
  const lastPacketIdRef = useRef<number>(0);
  const sessionProtocolsRef = useRef<Record<string, number>>({});
  const totalSessionPktsRef = useRef<number>(0);
  const rollingBytesRef = useRef<{ bytes: number, time: number }[]>([]);
  const rollingJitterRef = useRef<number[]>([]);
  const lastRttPerFlowRef = useRef<Record<string, number>>({});

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

  useEffect(() => {
    const fetchDefaultTargets = async () => {
      try {
        const pingRes = await fetch('/api/configurations/DEFAULT_PING_TARGET');
        if (pingRes.ok) {
          const data = await pingRes.json();
          if (data.valorSeleccionado) setPingTarget(data.valorSeleccionado);
        }
        const traceRes = await fetch('/api/configurations/DEFAULT_TRACEROUTE_TARGET');
        if (traceRes.ok) {
          const data = await traceRes.json();
          if (data.valorSeleccionado) setTraceTarget(data.valorSeleccionado);
        }
      } catch (e) {
        console.warn("Could not fetch default diagnostic targets:", e);
      }
    };
    fetchDefaultTargets();
  }, []);

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
              const activeId = activeAnalysisIdRef.current || propAnalysisId || activeData.idAnalisis;
              setInterfaceData((prev: any) => ({
                ...prev,
                nombreInterfaz: activeData.nombreInterfaz,
                macAddress: activeData.macAddress,
                ipAddress: activeData.ipAddress || '0.0.0.0',
                idAnalisis: activeId || ''
              }));
              if (activeId && hasAutoLoadedRef.current !== activeId) {
                hasAutoLoadedRef.current = activeId;
                loadActiveAnalysisDetails(activeId, false);
              }
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
    
    const stopAnalysis = () => {
      fetch('/api/analysis/stop', { method: 'POST', keepalive: true }).catch(() => {});
    };
    
    window.addEventListener('beforeunload', stopAnalysis);
    
    return () => {
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
      // We explicitly DO NOT call stopAnalysis() here so the capture can continue
      // running in the background when the user navigates to other screens.
      window.removeEventListener('beforeunload', stopAnalysis);
    };
  }, [isMonitoring]);

  const loadActiveAnalysisDetails = async (id: number, showSuccessToast = false) => {
    Swal.fire({
      title: 'Cargando sesión activa...',
      text: `Calculando métricas y obteniendo paquetes de la sesión #${id}`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const summaryRes = await fetch(`/api/analysis/${id}/summary`);
      let summary = null;
      if (summaryRes.ok) summary = await summaryRes.json();

      const packetsRes = await fetch(`/api/packets?idAnalisis=${id}&page=0&size=50`);
      let packets: any[] = [];
      if (packetsRes.ok) {
        const pData = await packetsRes.json();
        packets = pData.content || pData;
      }

      // Obtenemos estadísticas del backend o las calculamos desde la lista de paquetes
      let calcLoss = 0;
      let calcJitter = 0;

      try {
        const statsRes = await fetch('/api/reports/statistics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: String(id) })
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.errorRate !== undefined) calcLoss = +statsData.errorRate.toFixed(2);
          if (statsData.averageJitter !== undefined) calcJitter = +statsData.averageJitter.toFixed(2);
        }
      } catch (e) {
        console.warn("No se pudieron obtener estadísticas avanzadas de sesión:", e);
      }

      // Fallback a cálculo desde la lista de paquetes si la API retornó 0
      if (calcJitter === 0 && packets.length > 0) {
        let sumDiffs = 0;
        let countDiffs = 0;
        const lastRtt: Record<string, number> = {};
        packets.forEach((p: any) => {
          const rtt = p.tiempoRespuesta;
          if (rtt != null && rtt > 0) {
            const key = `${p.fuente || p.sourceIp}-${p.destino || p.destIp}-${p.tipoPaquete || p.protocol}`;
            if (lastRtt[key] !== undefined) {
              sumDiffs += Math.abs(rtt - lastRtt[key]);
              countDiffs++;
            }
            lastRtt[key] = rtt;
          }
        });
        if (countDiffs > 0) {
          calcJitter = +(sumDiffs / countDiffs).toFixed(2);
        }
      }

      if (calcLoss === 0 && packets.length > 0) {
        const noResp = packets.filter((p: any) => !p.respuesta || String(p.respuesta).trim() === '').length;
        calcLoss = +((noResp / packets.length) * 100).toFixed(2);
      }

      if (summary) {
        const pps = summary.durationSeconds > 0 ? +(summary.totalPackets / summary.durationSeconds).toFixed(2) : 0;
        const mbps = summary.durationSeconds > 0 ? +((summary.totalBytes * 8 / 1_000_000) / summary.durationSeconds).toFixed(4) : 0;
        
        setPacketStats({
          total: summary.totalPackets,
          protocols: summary.protocolDistribution || {}
        });
        setTrafficMetrics({ pps, mbps, loss: calcLoss, jitter: calcJitter });
        setSessionAvgMetrics({ pps, mbps, loss: calcLoss, jitter: calcJitter });
      }

      setPacketStream(packets.map((p: any, idx: number) => ({
        ...p,
        id: p.id || `PKT-${idx}`
      })));

      // Consultamos los paquetes de diagnóstico guardados para esta sesión (Ping, Traceroute, Speedtest)
      try {
        const diagRes = await fetch(`/api/diagnostics/analysis/${id}`);
        if (diagRes.ok) {
          const diagList: any[] = await diagRes.json();
          if (Array.isArray(diagList) && diagList.length > 0) {
            // Filtrar paquetes de Ping
            const pingPkts = diagList.filter(d => d.componente === 'PING' || d.tipoPaquete === 'ICMP');
            if (pingPkts.length > 0) {
              const logs: string[] = [];
              let totalLat = 0;
              let successCount = 0;
              let lossCount = 0;

              pingPkts.forEach(p => {
                if (p.respuesta) {
                  logs.push(`Respuesta desde ${p.destino}: tiempo=${p.tiempoRespuesta}ms ${p.respuesta}`);
                  totalLat += (p.tiempoRespuesta || 0);
                  successCount++;
                } else {
                  logs.push(`Tiempo de espera agotado para la solicitud a ${p.destino}`);
                  lossCount++;
                }
              });

              setPingLogs(logs);
              const avgLatStr = successCount > 0 ? `${(totalLat / successCount).toFixed(2)} ms` : 'No registrada';
              const lossPctStr = `${((lossCount / pingPkts.length) * 100).toFixed(0)}%`;
              setPingStats({ avgLatency: avgLatStr, loss: lossPctStr });
            } else {
              setPingLogs([]);
              setPingStats({ avgLatency: 'No registrada', loss: 'No registrada' });
            }

            const tracePkts = diagList.filter(d => d.componente === 'TRACEROUTE' || d.tipoPaquete === 'TRACEROUTE');
            if (tracePkts.length > 0) {
              const hops = tracePkts.map((p, idx) => {
                let loc = p.respuesta || p.contenidos;
                if (!loc || loc === 'TTL_EXCEEDED') {
                  loc = idx === 0 ? 'Router Local / Pasarela' : (idx === tracePkts.length - 1 ? 'Destino Final Alcanzado' : 'Router / Salto Intermedio');
                }
                return {
                  hop: idx + 1,
                  ip: p.destino || p.fuente || 'Salto Intermedio',
                  latency: p.tiempoRespuesta || 0,
                  location: loc
                };
              });
              setTraceHops(hops);
            } else {
              setTraceHops([]);
            }
          } else {
            setPingLogs([]);
            setPingStats({ avgLatency: 'No registrada', loss: 'No registrada' });
            setTraceHops([]);
          }
        }
      } catch (diagErr) {
        console.warn("Fallo al obtener paquetes de diagnóstico de la sesión:", diagErr);
      }

      Swal.close();
      if (showSuccessToast) {
        Swal.fire('Cargado', `Sesión #${id} cargada exitosamente.`, 'success');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Fallo al obtener los datos de la sesión activa', 'error');
    }
  };

  const hasAutoLoadedRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeAnalysisId) {
      setInterfaceData(prev => ({ ...prev, idAnalisis: activeAnalysisId }));
    }
  }, [activeAnalysisId]);

  // Auto-fetch active/current session data on page reload / navigation back to Análisis
  useEffect(() => {
    const currentId = activeAnalysisId || propAnalysisId;
    if (currentId && hasAutoLoadedRef.current !== currentId) {
      hasAutoLoadedRef.current = currentId;
      loadActiveAnalysisDetails(currentId, false);
    }
  }, [activeAnalysisId, propAnalysisId]);

  const fetchPackets = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const fetchStartTime = Date.now();
    try {
      const sinceId = lastPacketIdRef.current;
      const currentAnalysisId = activeAnalysisIdRef.current;
      const url = currentAnalysisId 
          ? `/api/packets?sinceId=${sinceId}&idAnalisis=${currentAnalysisId}` 
          : `/api/packets?sinceId=${sinceId}`;
          
      const response = await fetch(url);
      if (response.ok) {
        let data: any[] = await response.json();

        if (data.length > 0) {
          // Update last ID seen safely to avoid Maximum call stack size exceeded
          lastPacketIdRef.current = data.reduce((max, p) => p.id > max ? p.id : max, lastPacketIdRef.current);
          
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

        const intervalSec = Math.max(0.1, (fetchStartTime - lastFetchTimestampRef.current) / 1000);
        
        const deltaPkts = data.length;
        const deltaBytes = data.reduce((acc: number, p: any) => {
          if (p.longitud && p.longitud > 0) return acc + p.longitud;
          if (p.contenidos) return acc + new Blob([p.contenidos]).size;
          return acc + 64; 
        }, 0);

        const pps = +(deltaPkts / intervalSec).toFixed(2);
        
        // Tasa de datos suavizada (rolling window de 5 segundos/ticks)
        rollingBytesRef.current.push({ bytes: deltaBytes, time: intervalSec });
        if (rollingBytesRef.current.length > 5) {
            rollingBytesRef.current.shift();
        }
        const totalRollingBytes = rollingBytesRef.current.reduce((acc, val) => acc + val.bytes, 0);
        const totalRollingTime = rollingBytesRef.current.reduce((acc, val) => acc + val.time, 0);
        const mbps = totalRollingTime > 0 ? +((totalRollingBytes * 8) / totalRollingTime / 1_000_000).toFixed(4) : 0;

        lastFetchTimestampRef.current = fetchStartTime;

        // Packet loss
        const noResponse = data.filter((p: any) => !p.respuesta || p.respuesta.trim() === '').length;
        const loss = data.length > 0
          ? +((noResponse / data.length) * 100).toFixed(2)
          : 0;

        // Jitter (ventana de tiempo móvil de los últimos 5 ticks válidos) agrupado por flujo
        let currentJitter = 0;
        let hasValidJitter = false;
        
        // Protección de memoria contra ataques / sesiones masivas
        if (Object.keys(lastRttPerFlowRef.current).length > 5000) {
            lastRttPerFlowRef.current = {};
        }

        let sumDiffs = 0;
        let diffCount = 0;

        data.forEach((p: any) => {
            if (p.tiempoRespuesta != null && p.tiempoRespuesta > 0) {
                const key = `${p.fuente}-${p.destino}-${p.tipoPaquete}`;
                const rtt = p.tiempoRespuesta;
                if (lastRttPerFlowRef.current[key] !== undefined) {
                    sumDiffs += Math.abs(rtt - lastRttPerFlowRef.current[key]);
                    diffCount++;
                }
                lastRttPerFlowRef.current[key] = rtt;
            }
        });

        if (diffCount > 0) {
            currentJitter = +(sumDiffs / diffCount).toFixed(2);
            hasValidJitter = true;
        }

        if (hasValidJitter) {
            rollingJitterRef.current.push(currentJitter);
            if (rollingJitterRef.current.length > 5) {
                rollingJitterRef.current.shift();
            }
        }
        
        const avgJitter = rollingJitterRef.current.length > 0
            ? +(rollingJitterRef.current.reduce((a, b) => a + b, 0) / rollingJitterRef.current.length).toFixed(2)
            : (trafficMetrics.jitter || 0);

        // Acumular para promedio general final de sesión
        if (hasValidJitter) {
            metricsAccRef.current.jitterSum += currentJitter;
            metricsAccRef.current.jitterTicks += 1;
        }

        metricsAccRef.current.ppsSum += pps;
        metricsAccRef.current.mbpsSum += mbps;
        metricsAccRef.current.lossSum += loss;
        metricsAccRef.current.ticks += 1;

        // Siempre actualizar métricas, usando el avgJitter de la ventana móvil
        setTrafficMetrics(prev => ({ pps, mbps, loss, jitter: avgJitter }));
      }
    } catch (e) {
      console.error('Failed to fetch packets for monitoring', e);
    } finally {
      isFetchingRef.current = false;
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
        await fetch('/api/analysis/interface/analyze', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interfaceId: interfaceData.nombreInterfaz })
        });
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
    setTrafficMetrics({ pps: 0, mbps: 0, loss: 0, jitter: 0 });
    metricsAccRef.current = { ppsSum: 0, mbpsSum: 0, lossSum: 0, jitterSum: 0, ticks: 0, jitterTicks: 0 };
    rollingBytesRef.current = [];
    rollingJitterRef.current = [];
    lastRttPerFlowRef.current = {};
    setSessionAvgMetrics(null);
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
        await fetch('/api/analysis/interface/analyze', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interfaceId: interfaceData.nombreInterfaz })
        });
        
        if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
        setIsMonitoring(true);
        monitoringStartRef.current = Date.now();
        lastFetchTimestampRef.current = Date.now();
        lastPacketIdRef.current = 0;
        sessionProtocolsRef.current = {};
        totalSessionPktsRef.current = 0;
        
        setPacketStream([]);
        setPacketStats({ total: 0, protocols: {} });
        setTrafficMetrics({ pps: 0, mbps: 0, loss: 0, jitter: 0 });
        metricsAccRef.current = { ppsSum: 0, mbpsSum: 0, lossSum: 0, jitterSum: 0, ticks: 0, jitterTicks: 0 };
        rollingBytesRef.current = [];
        rollingJitterRef.current = [];
        lastRttPerFlowRef.current = {};
        setSessionAvgMetrics(null);
        
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
    if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
    setIsMonitoring(false);
    handleSetActiveAnalysisId(session.id);
    await loadActiveAnalysisDetails(session.id, true);
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
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 select-none mt-6">
        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex flex-col justify-center relative">
          <div className="absolute top-3 right-3 group z-40">
            <span className="material-symbols-outlined text-[#64748B] text-[18px] cursor-help">info</span>
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Paquetes por Segundo (pps)</div>
              <p className="mb-1">Mide la frecuencia con la que se reciben o transmiten paquetes en la interfaz.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#64748B] text-lg">speed</span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Paquetes / Seg</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-extrabold text-[#0F172A] font-mono">
              {(isMonitoring || isActiveCapturing)
                ? trafficMetrics.pps
                : sessionAvgMetrics
                ? sessionAvgMetrics.pps
                : activeAnalysisId ? trafficMetrics.pps : '--'}
            </span>
            {!isMonitoring && !isActiveCapturing && sessionAvgMetrics && (
              <span className="text-[9px] text-slate-400 mb-0.5 font-semibold tracking-wide uppercase">prom.</span>
            )}
            <span className="text-xs text-[#64748B] mb-0.5 font-bold">pps</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex flex-col justify-center relative">
          <div className="absolute top-3 right-3 group z-40">
            <span className="material-symbols-outlined text-[#64748B] text-[18px] cursor-help">info</span>
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Tasa de Datos (Mbps)</div>
              <p className="mb-1">Mide el rendimiento o ancho de banda consumido en megabits por segundo del último lote de paquetes en la red. Este se puede ver mediante la tabla de flujo en vivo.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#64748B] text-lg">network_check</span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Tasa de Datos</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-extrabold text-[#0F172A] font-mono">
              {(isMonitoring || isActiveCapturing)
                ? trafficMetrics.mbps
                : sessionAvgMetrics
                ? sessionAvgMetrics.mbps
                : activeAnalysisId ? trafficMetrics.mbps : '--'}
            </span>
            {!isMonitoring && !isActiveCapturing && sessionAvgMetrics && (
              <span className="text-[9px] text-slate-400 mb-0.5 font-semibold tracking-wide uppercase">prom.</span>
            )}
            <span className="text-xs text-[#64748B] mb-0.5 font-bold">Mbps</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex flex-col justify-center relative">
          <div className="absolute top-3 right-3 group z-40">
            <span className="material-symbols-outlined text-[#64748B] text-[18px] cursor-help">info</span>
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Tasa de Pérdida (%)</div>
              <p className="mb-1">Porcentaje de solicitudes sin respuesta o paquetes descartados en la red.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#64748B] text-lg">warning</span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Pérdida</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-extrabold text-[#F59E0B] font-mono">
              {(isMonitoring || isActiveCapturing)
                ? trafficMetrics.loss
                : sessionAvgMetrics
                ? sessionAvgMetrics.loss
                : activeAnalysisId ? trafficMetrics.loss : '--'}
            </span>
            {!isMonitoring && !isActiveCapturing && sessionAvgMetrics && (
              <span className="text-[9px] text-slate-400 mb-0.5 font-semibold tracking-wide uppercase">prom.</span>
            )}
            <span className="text-xs text-[#64748B] mb-0.5 font-bold">%</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-sm flex flex-col justify-center relative">
          <div className="absolute top-3 right-3 group z-40">
            <span className="material-symbols-outlined text-[#64748B] text-[18px] cursor-help">info</span>
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Jitter (ms)</div>
              <p className="mb-1">Fluctuación o variación en el tiempo de retardo entre paquetes consecutivos.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-[#64748B] text-lg">timeline</span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Jitter</span>
          </div>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-extrabold text-indigo-500 font-mono">
              {(isMonitoring || isActiveCapturing)
                ? trafficMetrics.jitter
                : sessionAvgMetrics
                ? sessionAvgMetrics.jitter
                : activeAnalysisId ? trafficMetrics.jitter : '--'}
            </span>
            {!isMonitoring && !isActiveCapturing && sessionAvgMetrics && (
              <span className="text-[9px] text-slate-400 mb-0.5 font-semibold tracking-wide uppercase">prom.</span>
            )}
            <span className="text-xs text-[#64748B] mb-0.5 font-bold">ms</span>
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
          {(!isMonitoring && !activeAnalysisId) || packetStats.total === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-12 px-6 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">wifi_off</span>
              <p className="text-sm font-semibold text-slate-600 font-sans">No se detectan paquetes en la red</p>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                {isMonitoring ? 'Esperando tráfico de red en la interfaz seleccionada...' : 'Inicie el monitoreo o seleccione una sesión para capturar paquetes.'}
              </p>
            </div>
          ) : (
            <>
              <div className="relative w-72 h-72 flex-shrink-0 select-none">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#F1F5F9" strokeWidth="3" />
                  {protocolSlices.map((s, i) => (
                    <circle key={i} cx="18" cy="18" fill="transparent" r="15.915" stroke={s.color} strokeWidth="3" strokeDasharray={s.dasharray} strokeDashoffset={s.offset} />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-4xl font-extrabold text-[#0F172A]">
                    {packetStats.total}
                  </span>
                  <span className="text-[10px] font-mono tracking-wider font-bold uppercase mt-1 text-[#64748B]">
                    Total Pkts
                  </span>
                </div>
              </div>

              <div className="flex-1 max-w-xl flex items-center justify-center border border-[#E2E8F0] rounded-xl bg-white min-h-[200px] shadow-sm">
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
              </div>
            </>
          )}
        </div>
      </section>

      {/* Network Diagnostics tools box */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 select-none">
          <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">construction</span>
            Diagnósticos de Red Activos
          </h2>
          <div className="relative group inline-flex items-center">
            <span className="material-symbols-outlined text-[#64748B] text-[18px] cursor-help">info</span>
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 bottom-full mb-2 left-0 pointer-events-none w-72 text-slate-600 leading-relaxed font-normal normal-case">
              <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Diagnósticos de Red Activos</div>
              <div>Herramientas interactivas de inyección de tráfico activo para evaluar conectividad (Ping), rastreo de saltos (Traceroute) y ancho de banda/velocidad de transferencia (Speed Test).</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">

          <div className="col-span-12 md:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm relative">
            <div className="flex items-center justify-between mb-4 select-none">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">router</span>
                <h3 className="font-bold text-sm text-[#0F172A]">Prueba de Conectividad (Ping)</h3>
              </div>
              <div className="relative group z-40">
                <span className="material-symbols-outlined text-[#64748B] text-[18px] cursor-help">info</span>
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
                  <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Prueba de Conectividad (Ping)</div>
                  <p className="mb-1">Envía paquetes ICMP Echo Request al host o IP objetivo de forma continua. Calcula la latencia de respuesta ida y vuelta (RTT) y porcentaje de pérdidas.</p>
                </div>
              </div>
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
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 h-[120px] flex flex-col items-center justify-center text-center mb-3 space-y-1">
                  <span className="material-symbols-outlined text-slate-400 text-xl">sensors_off</span>
                  <p className="text-xs font-semibold text-slate-600">
                    {activeAnalysisId ? 'No se registraron trazas de conectividad (Ping) en esta sesión' : 'Esperando inicio de prueba de conectividad'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {activeAnalysisId ? 'No se ejecutaron sondas ICMP activas en esta captura.' : 'Las respuestas en tiempo real se mostrarán al iniciar la prueba.'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] font-mono text-[#64748B] font-bold uppercase select-none">Latencia Promedio</p>
                  <p className="text-lg font-bold text-primary mt-0.5 font-mono">
                    {pingLogs.length > 0 ? pingStats.avgLatency : 'No registrada'}
                  </p>
                </div>
                <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] font-mono text-[#64748B] font-bold uppercase select-none">Pérdida de Paquetes</p>
                  <p className="text-lg font-bold text-[#F59E0B] mt-0.5 font-mono">
                    {pingLogs.length > 0 ? pingStats.loss : 'No registrada'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm relative">
            <div className="flex items-center justify-between mb-4 select-none">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-xl">alt_route</span>
                <h3 className="font-bold text-sm text-[#0F172A]">Traza de Ruta</h3>
              </div>
              <div className="relative group z-40">
                <span className="material-symbols-outlined text-[#64748B] text-[18px] cursor-help">info</span>
                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
                  <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Traza de Ruta (Traceroute)</div>
                  <p className="mb-1">Rastrea la secuencia de routers e intermediarios hasta el servidor de destino. Registra el incremento progresivo de tiempo de vida (TTL) para registrar IPs y latencias por cada salto.</p>
                </div>
              </div>
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
                className="bg-primary text-[#FFFFFF] font-semibold px-4 py-2 rounded-lg text-xs hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-sans"
              >
                {traceStatus === 'tracing' ? 'Rastreando' : 'Trazar Ruta'}
              </button>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
              <div className="flex justify-between text-[11px] font-mono text-[#64748B] mb-3 pb-1 border-b border-[#E2E8F0] select-none">
                <span>Estado en tiempo real</span>
                <span className={`font-bold uppercase ${traceStatus === 'tracing' ? 'text-[#F59E0B] animate-pulse' : 'text-[#4F46E5]'}`}>
                  {traceStatus === 'tracing' ? 'RASTREANDO...' : traceHops.length > 0 ? 'COMPLETADO' : 'LISTO'}
                </span>
              </div>

              {traceHops.length > 0 ? (
                <div className="space-y-3 font-mono text-xs h-[120px] overflow-y-auto mb-3 pr-1">
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
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 h-[120px] flex flex-col items-center justify-center text-center mb-3 space-y-1">
                  <span className="material-symbols-outlined text-slate-400 text-xl">route</span>
                  <p className="text-xs font-semibold text-slate-600">
                    {activeAnalysisId ? 'No se registraron saltos de ruta (Traceroute) en esta sesión' : 'Esperando diagnóstico de ruta'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {activeAnalysisId ? 'No se rastrearon intermediarios durante esta captura.' : 'La lista de saltos aparecerá al iniciar el diagnóstico.'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] font-mono text-[#64748B] font-bold uppercase select-none">Saltos Totales</p>
                  <p className="text-lg font-bold text-primary mt-0.5 font-mono">
                    {traceHops.length > 0 ? `${traceHops.length} saltos` : 'No registrada'}
                  </p>
                </div>
                <div className="bg-white border border-[#E2E8F0] p-3 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] font-mono text-[#64748B] font-bold uppercase select-none">Tiempo Total de Viaje</p>
                  <p className="text-lg font-bold text-[#4F46E5] mt-0.5 font-mono">
                    {traceHops.length > 0 ? `${traceHops.reduce((acc, h) => acc + (Number(h.latency) || 0), 0)} ms` : 'No registrada'}
                  </p>
                </div>
              </div>
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
            <table className="w-full text-left text-xs font-sans table-fixed">
              <thead className="bg-[#F8FAFC] text-[#64748B] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-3 w-1/4">Nombre</th>
                  <th className="p-3 w-1/6">Tipo</th>
                  <th className="p-3 w-1/5">IP</th>
                  <th className="p-3 w-1/5">MAC</th>
                  <th className="p-3 w-1/6">Estado</th>
                  <th className="p-3 text-right w-28">Acciones</th>
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
                  let friendlyName = iface.displayName || iface.name;
                  if (!friendlyName || friendlyName === iface.name) {
                    const match = iface.name.match(/\(([^)]+)\)/);
                    if (match) {
                      friendlyName = match[1];
                    } else {
                      friendlyName = iface.name.replace(/^\d+\.\s*/, '');
                    }
                  }
                  const labelText = friendlyName || rawName;
                  return <option key={id} value={id}>{labelText}</option>;
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
                    rollingBytesRef.current = [];
                    rollingJitterRef.current = [];
                    // Resetear acumulador de promedios
                  metricsAccRef.current = { ppsSum: 0, mbpsSum: 0, lossSum: 0, jitterSum: 0, ticks: 0, jitterTicks: 0 };
                    setSessionAvgMetrics(null);
                    setPacketStream([]);
                    setPacketStats({ total: 0, protocols: {} });
                    setTrafficMetrics({ pps: 0, mbps: 0, loss: 0, jitter: 0 });
                    monitoringIntervalRef.current = setInterval(fetchPackets, 1000);

                    try {
                      const reqBody = {
                        provider: speedTestConfig.provider,
                        testType: speedTestConfig.testType,
                        sizeBytes: speedTestConfig.sizeBytes,
                        interfaceName: interfaceData.nombreInterfaz,
                        analysisId: activeAnalysisIdRef.current
                      };
                      const res = await fetch('/api/analysis/active/speedtest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(reqBody)
                      });
                      if (res.ok) {
                        const resultData = await res.json();
                        // Detener polling
                        if (monitoringIntervalRef.current) clearInterval(monitoringIntervalRef.current);
                        setIsActiveCapturing(false);
                        
                        // Recargar inmediatamente las métricas, distribución de protocolos y paquetes capturados de la sesión
                        if (activeAnalysisIdRef.current) {
                          await loadActiveAnalysisDetails(activeAnalysisIdRef.current, false);
                        }

                        // Cerrar modal automáticamente al terminar
                        setIsSpeedTestModalOpen(false);
                        setPendingAnalysisAction(null);

                        // Mostrar notificación de éxito con la velocidad medida
                        Swal.fire({
                          title: '¡Prueba Activa Completada!',
                          html: `<div className="text-sm space-y-2">
                            <p><strong>Tipo de prueba:</strong> ${resultData.testType === 'DOWNLOAD' ? 'Descarga' : 'Subida'}</p>
                            <p><strong>Velocidad lograda:</strong> <span className="text-xl font-bold text-indigo-600">${resultData.speedMbps} Mbps</span></p>
                            <p><strong>Duración:</strong> ${resultData.durationMs} ms</p>
                          </div>`,
                          icon: 'success',
                          confirmButtonColor: '#4F46E5'
                        });
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
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="p-3 w-20">ID</th>
                <th className="p-3 w-28">Protocolo</th>
                <th className="p-3 w-36">Fuente</th>
                <th className="p-3 w-36">Destino</th>
                <th className="p-3 w-24">Tamaño</th>
                <th className="p-3 w-auto">Info</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {packetStream.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">No se detectan paquetes en la red</td>
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
                <div className="text-xs text-slate-500">{formatDateVE(session.fechaEjecucion)}</div>
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
