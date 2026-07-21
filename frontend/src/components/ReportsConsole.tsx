/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import html2pdf from 'html2pdf.js';
import { Modal } from './common/Modal';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';

const formatBytes = (bytes: number = 0) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface AnalisisRed {
  id: number;
  fechaEjecucion: string;
  duracionAnalisis: number;
}

export const ReportsConsole: React.FC = () => {
  const [sessions, setSessions] = useState<AnalisisRed[]>([]);
  const [selectedSession, setSelectedSession] = useState<AnalisisRed | null>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDuration, setNewDuration] = useState('60');

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterExactDate, setFilterExactDate] = useState('');
  const [fuzzySearch, setFuzzySearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [qosThresholds, setQosThresholds] = useState({
      excellent: 90,
      good: 70,
      regular: 50,
      deficient: 30
  });

  const fetchQosThresholds = async () => {
      try {
          const getParam = async (key: string, defaultVal: number) => {
              const res = await fetch(`/api/configurations/${key}`);
              if (res.ok) {
                  const data = await res.json();
                  return parseInt(data.valorSeleccionado) || defaultVal;
              }
              return defaultVal;
          };
          setQosThresholds({
              excellent: await getParam('SCORE_EXCELLENT', 90),
              good: await getParam('SCORE_GOOD', 70),
              regular: await getParam('SCORE_REGULAR', 50),
              deficient: await getParam('SCORE_DEFICIENT', 30)
          });
      } catch (e) {
          console.error("No se pudo cargar la configuración QoS", e);
      }
  };

  const fetchSessions = async (page = 0) => {
    try {
      const payload = {
         term: fuzzySearch || null,
         startDate: filterStartDate ? `${filterStartDate}T00:00:00` : (filterExactDate ? `${filterExactDate}T00:00:00` : null),
         endDate: filterEndDate ? `${filterEndDate}T23:59:59` : (filterExactDate ? `${filterExactDate}T23:59:59` : null)
      };
      const res = await fetch(`/api/analysis/search?page=${page}&size=20&sort=id,desc`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.content) {
            setSessions(data.content);
            setTotalPages(data.totalPages);
            setCurrentPage(data.number);
        } else {
            setSessions(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessions(0);
    fetchQosThresholds();
  }, []);

  const handleViewStats = async (session: AnalisisRed) => {
    setSelectedSession(session);
    setSessionStats(null);
    try {
      const res = await fetch('/api/reports/statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id.toString() })
      });
      if (res.ok) {
        const data = await res.json();
        setSessionStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duracionAnalisis: parseInt(newDuration) || 60,
          fechaEjecucion: new Date().toISOString()
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        fetchSessions();
        Swal.fire({ title: 'Análisis Creado', text: 'Nueva sesión de análisis registrada en base de datos.', icon: 'success', confirmButtonColor: '#4F46E5' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateReport = async (id: number, type: string = "PDF_STATS") => {
    try {
      Swal.fire({
        title: 'Generando Reporte...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      if (type === 'PDF_STATS') {
          const element = document.getElementById('statistics-modal-content');
          if (!element) {
              Swal.fire('Error', 'Debe abrir el modal de estadísticas para capturar el reporte en PDF.', 'error');
              return;
          }
          
          const opt = {
              margin:       10,
              filename:     `Reporte_Estadistico_${id}_${Date.now()}.pdf`,
              image:        { type: 'jpeg', quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          
          html2pdf().set(opt).from(element).save().then(() => {
              // Llamada para registrar la auditoría
              fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: id.toString(), reportType: "PDF_STATS" })
              });
              Swal.fire('Éxito', 'El PDF ha sido generado y descargado correctamente.', 'success');
          });
          return;
      }

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id.toString(), reportType: type })
      });
      
      if (res.ok) {
        const report = await res.json();
        if (report.downloadUrl) {
            Swal.fire({ text: `¡Reporte generado con éxito!`, icon: 'success', confirmButtonColor: '#4F46E5' });
            window.open(report.downloadUrl, '_blank');
        } else {
            Swal.fire({ text: `Se ha guardado el informe localmente.`, icon: 'success', confirmButtonColor: '#4F46E5' });
        }
      } else {
        Swal.fire('Error', 'Fallo al generar el reporte.', 'error');
      }
    } catch(e) {
      Swal.fire('Error', 'Ocurrió un error al conectar con el servidor.', 'error');
    }
  };

  const filteredSessions = sessions;

  // Prepare Pareto Data (Bar + Line for Errors)
  const paretoData: any[] = [];
  if (sessionStats?.errorDistribution) {
      let cumulative = 0;
      const total = Object.values(sessionStats.errorDistribution).reduce((a:any, b:any) => a + b, 0) as number;
      for (const [errorName, count] of Object.entries(sessionStats.errorDistribution)) {
          cumulative += (count as number);
          const cumPercentage = total > 0 ? (cumulative / total) * 100 : 0;
          paretoData.push({ errorName, count, acumulado: cumPercentage });
      }
  }

  // Prepare Pie Data (Protocols)
  const pieData: any[] = [];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  if (sessionStats?.protocolDistribution) {
      const total = sessionStats.totalPackets || Object.values(sessionStats.protocolDistribution).reduce((a:any, b:any) => a + b, 0) as number;
      const threshold = 0.16 * total;
      let otherCount = 0;
      
      const sortedProtos = Object.entries(sessionStats.protocolDistribution).sort((a: any, b: any) => b[1] - a[1]);
      
      for (const [proto, count] of sortedProtos) {
          if ((count as number) >= threshold) {
              pieData.push({ name: proto, value: count });
          } else {
              otherCount += (count as number);
          }
      }
      
      if (otherCount > 0) {
          pieData.push({ name: 'Otros', value: otherCount });
      }
  }

  return (
    <div className="space-y-6 font-sans mt-4">

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-[#E2E8F0] bg-white flex justify-between items-center select-none flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-[#0F172A]">
              Historial de Sesiones de Análisis de Red
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 px-3 py-1.5 rounded-lg w-max"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt</span>
              {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </button>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white border border-[#E2E8F0] rounded-xl shadow-sm w-full">
                <input 
                  type="date" 
                  title="Fecha Exacta" 
                  value={filterExactDate} 
                  onChange={e => setFilterExactDate(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <span className="text-xs text-slate-400 font-bold mx-1">O Rango:</span>
                <input 
                  type="date" 
                  title="Fecha Inicio" 
                  value={filterStartDate} 
                  onChange={e => setFilterStartDate(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <span className="text-xs text-slate-400">a</span>
                <input 
                  type="date" 
                  title="Fecha Fin" 
                  value={filterEndDate} 
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                />
                <input 
                  type="text" 
                  placeholder="Buscar por ID..." 
                  title="Búsqueda Fuzzy"
                  value={fuzzySearch} 
                  onChange={e => setFuzzySearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchSessions(0)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs flex-1 min-w-[150px]"
                />
                <button
                   onClick={() => fetchSessions(0)}
                   className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                   Filtrar
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-sans font-bold text-[#64748B] uppercase">
                <th className="p-4 pl-6">ID de Sesión</th>
                <th className="p-4">Fecha de Ejecución</th>
                <th className="p-4 pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm text-[#1E293B]">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-[#F8FAFC] transition-colors group">
                  <td className="p-4 pl-6 font-semibold text-[#0F172A]">
                    #{session.id}
                  </td>
                  <td className="p-4 font-mono text-xs text-[#64748B]">
                    {session.fechaEjecucion ? session.fechaEjecucion.replace('T', ' ').substring(0, 19) : 'N/A'}
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button 
                      onClick={() => handleViewStats(session)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold transition-colors border border-blue-200 cursor-pointer"
                    >
                      Ver Estadísticas
                    </button>
                    <button 
                      onClick={() => handleGenerateReport(session.id)}
                      className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-semibold transition-colors border border-primary/20 cursor-pointer"
                    >
                      Descargar Reporte PDF
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[#64748B]">
                    No se encontraron sesiones de análisis para los filtros aplicados.
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
              Mostrando página {currentPage + 1} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 0} 
                onClick={() => fetchSessions(currentPage - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Anterior
              </button>
              <button 
                disabled={currentPage >= totalPages - 1} 
                onClick={() => fetchSessions(currentPage + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Session Modal (Dashboard) */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={`Estadísticas de la Sesión #${selectedSession.id}`}
          subtitle="Métricas de rendimiento e indicadores de red"
          icon="query_stats"
          maxWidth="7xl"
        >
          {sessionStats ? (
            <div className="space-y-6">
                
                {/* Puntuación de Red */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-inner">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-500 text-sm font-bold uppercase">Puntuación de Red (QoS)</span>
                        <span className="material-symbols-outlined text-[#64748B] text-[16px] cursor-help" title="Métrica dinámica calculada en base a la latencia (P90), el jitter y la eficiencia de la sesión. Una puntuación alta indica una red óptima para transmisiones en tiempo real.">info</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-5xl font-black ${
                            sessionStats.networkScore >= 90 ? 'text-emerald-500' :
                            sessionStats.networkScore >= 70 ? 'text-blue-500' :
                            sessionStats.networkScore >= 50 ? 'text-amber-500' :
                            sessionStats.networkScore >= 30 ? 'text-orange-500' :
                            'text-red-500'
                        }`}>
                            {sessionStats.networkScore?.toFixed(0)} <span className="text-2xl font-normal text-slate-400">/ 100</span>
                        </span>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                            sessionStats.networkScore >= 90 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                            sessionStats.networkScore >= 70 ? 'bg-blue-100 text-blue-700 border-blue-300' :
                            sessionStats.networkScore >= 50 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                            sessionStats.networkScore >= 30 ? 'bg-orange-100 text-orange-700 border-orange-300' :
                            'bg-red-100 text-red-700 border-red-300'
                        }`}>
                            {sessionStats.networkScore >= 90 ? 'Excelente' :
                             sessionStats.networkScore >= 70 ? 'Bueno' : 
                             sessionStats.networkScore >= 50 ? 'Regular' :
                             sessionStats.networkScore >= 30 ? 'Deficiente' : 'Crítico'}
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 font-medium max-w-md">
                        {sessionStats.networkScore >= 90 ? 'Condiciones ideales para videoconferencias y streaming. No se experimentarán retrasos.' :
                         sessionStats.networkScore >= 70 ? 'Red estable. Suficiente para la mayoría de operaciones corporativas.' : 
                         sessionStats.networkScore >= 50 ? 'Red con fluctuaciones. Posibles interrupciones ligeras en tiempo real.' :
                         sessionStats.networkScore >= 30 ? 'Congestión notable. Las aplicaciones sensibles experimentarán cortes.' : 'Red severamente degradada o inoperativa. Riesgo alto de pérdida de datos.'}
                    </p>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4" id="metric-cards">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-center text-center relative">
                        <span className="material-symbols-outlined absolute top-2 right-2 text-blue-500 text-[18px] cursor-help" title={`Mínimo: ${sessionStats.latencyMin?.toFixed(2)} ms\nP25: ${sessionStats.latencyP25?.toFixed(2)} ms\nMediana (P50): ${sessionStats.latencyP50?.toFixed(2)} ms\nP75: ${sessionStats.latencyP75?.toFixed(2)} ms\nP90: ${sessionStats.latencyP90?.toFixed(2)} ms\nP99: ${sessionStats.latencyP99?.toFixed(2)} ms\nMáximo: ${sessionStats.latencyMax?.toFixed(2)} ms`}>info</span>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1 mt-3">Distribución Latencia</span>
                        <div className="flex-1 flex flex-col items-center justify-center w-full px-2 mt-2">
                           {sessionStats.latencyMax !== undefined ? (() => {
                               const maxVal = sessionStats.latencyP90 * 1.05 || 100;
                               const pMin = Math.max(0, (sessionStats.latencyMin / maxVal) * 100);
                               const p25 = Math.max(0, (sessionStats.latencyP25 / maxVal) * 100);
                               const p50 = Math.max(0, (sessionStats.latencyP50 / maxVal) * 100);
                               const p75 = Math.max(0, (sessionStats.latencyP75 / maxVal) * 100);
                               const pMax = Math.min(100, (sessionStats.latencyP90 / maxVal) * 100);
                               return (
                                <div className="w-full h-10 relative flex items-center group">
                                    {/* Eje base */}
                                    <div className="absolute w-full h-px bg-slate-300 left-0"></div>
                                    {/* Mechas (Min -> P90) */}
                                    <div className="absolute h-[2px] bg-slate-500" style={{ left: `${pMin}%`, width: `${pMax - pMin}%` }}></div>
                                    {/* Cuerpo (P25 -> P75) */}
                                    <div className="absolute h-5 bg-rose-200 border border-rose-500 rounded-sm shadow-sm" style={{ left: `${p25}%`, width: `${Math.max(1, p75 - p25)}%`, top: '50%', transform: 'translateY(-50%)' }}></div>
                                    {/* Mediana (P50) */}
                                    <div className="absolute h-7 w-[3px] bg-rose-600 rounded-full shadow-sm" style={{ left: `${p50}%`, top: '50%', transform: 'translate(-50%, -50%)' }}></div>
                                </div>
                               )
                           })() : <span className="text-sm text-slate-400 mx-auto">Sin datos</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 font-medium">Caja: P25-P75 | Línea: Mediana | Tope: P90</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center relative transition-colors hover:bg-slate-100">
                        <span className="material-symbols-outlined absolute top-2 right-2 text-indigo-500 text-[18px] cursor-help" title={`Jitter P50: ${sessionStats.jitterP50?.toFixed(2)} ms\nJitter P90: ${sessionStats.jitter90thPercentile?.toFixed(2)} ms\nJitter P99: ${sessionStats.jitterP99?.toFixed(2)} ms`}>info</span>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Jitter Promedio</span>
                        <span className="text-2xl font-black text-indigo-600">{sessionStats.averageJitter?.toFixed(2)} <span className="text-sm font-normal text-slate-400">ms</span></span>
                        <span className="text-[10px] text-slate-400 mt-1">P90: {sessionStats.jitter90thPercentile?.toFixed(2)} ms</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center relative transition-colors hover:bg-slate-100">
                        <span className="material-symbols-outlined absolute top-2 right-2 text-emerald-500 text-[18px] cursor-help" title={`Tamaño P50: ${formatBytes(sessionStats.sizeP50)}\nTamaño P90: ${formatBytes(sessionStats.size90thPercentile)}\nTamaño P99: ${formatBytes(sessionStats.sizeP99)}`}>info</span>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Tasa de Descarga</span>
                        <span className="text-2xl font-black text-emerald-600">
                            {formatBytes(sessionStats.downloadRate).split(' ')[0]} <span className="text-sm font-normal text-slate-400">{formatBytes(sessionStats.downloadRate).split(' ')[1]}/s</span>
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">P90 Tamaño: {formatBytes(sessionStats.size90thPercentile)}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center relative transition-colors hover:bg-slate-100">
                        <span className="material-symbols-outlined absolute top-2 right-2 text-amber-500 text-[18px] cursor-help" title={`Total de paquetes analizados: ${sessionStats.totalPackets}\nProtocolo principal: ${sessionStats.primaryProtocol}`}>info</span>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Tasa de Paquetes</span>
                        <span className="text-2xl font-black text-amber-600">{sessionStats.packetRate?.toFixed(2)} <span className="text-sm font-normal text-slate-400">pkt/s</span></span>
                        <span className="text-[10px] text-slate-400 mt-1">Total: {sessionStats.totalPackets}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center relative transition-colors hover:bg-slate-100">
                        <span className="material-symbols-outlined absolute top-2 right-2 text-rose-500 text-[18px] cursor-help" title={`Porcentaje del tráfico clasificado como error de red (retransmisiones, duplicados, caídas).\nUna tasa mayor al umbral crítico penaliza fuertemente el QoS.`}>info</span>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Tasa de Errores</span>
                        <span className="text-2xl font-black text-rose-600">{sessionStats.errorRate?.toFixed(2)} <span className="text-sm font-normal text-slate-400">%</span></span>
                        <span className="text-[10px] text-slate-400 mt-1">Penaliza QoS al exceder umbral</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pareto Chart */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative">
                        <span className="material-symbols-outlined absolute top-4 right-4 text-slate-400 text-[18px] cursor-help" title={`Permite identificar los problemas más frecuentes de la red.\n\nRetransmisiones: Ocurren por pérdida de paquetes.\nICMP Inalcanzable: Host caído o puerto cerrado.\nRST: Conexión terminada abruptamente.`}>info</span>
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 text-center">Distribución de Errores de Red</h4>
                        <div className="h-64">
                            {paretoData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={paretoData} margin={{bottom: 20}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="errorName" tick={{fontSize: 9}} interval={0} angle={-25} textAnchor="end" height={60} />
                                        <YAxis yAxisId="left" tick={{fontSize: 10}} />
                                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} domain={[0, 100]} />
                                        <Tooltip />
                                        <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Cantidad" radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#EF4444" name="% Acumulado" strokeWidth={2} dot={{r: 4}} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <span className="text-sm text-slate-400 italic">No se detectaron errores significativos</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Protocol Pie Chart */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between relative">
                        <span className="material-symbols-outlined absolute top-4 right-4 text-slate-400 text-[18px] cursor-help" title="Proporción de tráfico consumido por cada protocolo. Oculta aquellos que representen menos del 16% del tráfico total.">info</span>
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 text-center">Distribución de Protocolos</h4>
                        <div className="h-64">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true}>
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => value + " pkt"} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <span className="text-sm text-slate-400 italic">Sin datos de protocolos</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top IPs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 flex items-center justify-between">
                            Top 5 IPs Origen (Emisores)
                            <span className="material-symbols-outlined text-slate-400 text-[18px] cursor-help" title="Los 5 dispositivos que más tráfico generaron. Útil para detectar cuellos de botella u orígenes de ataques.">info</span>
                        </h4>
                        <div className="space-y-2">
                            {sessionStats?.topSourceIps ? Object.entries(sessionStats.topSourceIps).map(([ip, count], idx) => (
                                <div key={ip} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                                    <span className="font-mono text-slate-700"><span className="text-slate-400 font-bold mr-2">{idx + 1}.</span>{ip}</span>
                                    <span className="font-bold text-indigo-600">{count as number} pkt</span>
                                </div>
                            )) : <div className="text-sm text-slate-400 italic text-center py-4">Sin datos</div>}
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 flex items-center justify-between">
                            Top 5 IPs Destino (Receptores)
                            <span className="material-symbols-outlined text-slate-400 text-[18px] cursor-help" title="Los 5 dispositivos que más tráfico recibieron.">info</span>
                        </h4>
                        <div className="space-y-2">
                            {sessionStats?.topDestIps ? Object.entries(sessionStats.topDestIps).map(([ip, count], idx) => (
                                <div key={ip} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg">
                                    <span className="font-mono text-slate-700"><span className="text-slate-400 font-bold mr-2">{idx + 1}.</span>{ip}</span>
                                    <span className="font-bold text-emerald-600">{count as number} pkt</span>
                                </div>
                            )) : <div className="text-sm text-slate-400 italic text-center py-4">Sin datos</div>}
                        </div>
                    </div>
                </div>

            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">
                <span className="material-symbols-outlined animate-spin text-4xl mb-2">progress_activity</span>
                <p>Cargando estadísticas...</p>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
             <button
                onClick={() => {
                  const id = selectedSession.id;
                  setSelectedSession(null);
                  handleGenerateReport(id);
                }}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 cursor-pointer flex items-center gap-1 hover:bg-primary/90"
             >
               <span className="material-symbols-outlined text-sm">download</span> Descargar Informe PDF
             </button>
          </div>
        </Modal>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Registrar Nueva Sesión de Análisis"
          subtitle="Iniciar rastreo persistente de paquetes"
          icon="analytics"
        >
          <form onSubmit={handleCreateAnalysis} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Duración del Análisis (Segundos)
              </label>
              <input
                type="number"
                required
                min="10"
                max="3600"
                value={newDuration}
                onChange={(e) => setNewDuration(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 cursor-pointer"
              >
                Iniciar Sesión
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
