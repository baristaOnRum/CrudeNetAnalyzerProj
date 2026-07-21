/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Modal } from './common/Modal';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';

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
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSessions = async (page = 0) => {
    try {
      const res = await fetch(`/api/analysis?page=${page}&size=20`);
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

  const handleGenerateReport = async (id: number) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    
    let reqBody: any = { sessionId: id.toString(), reportType: "PDF_STATS" };

    try {
      Swal.fire({
        title: 'Generando Reporte...',
        text: 'Compilando informe estadístico en PDF.',
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody)
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
          Swal.fire({ title: 'Error', text: 'No se pudo generar el reporte.', icon: 'error' });
      }
    } catch (e) {
        Swal.fire({ title: 'Error', text: 'Error de red.', icon: 'error' });
    }
  };

  const filteredSessions = sessions.filter(s => {
    const sessionDate = s.fechaEjecucion ? s.fechaEjecucion.substring(0, 10) : '';
    
    if (filterExactDate) {
      if (sessionDate !== filterExactDate) return false;
    } else {
      if (filterStartDate && sessionDate < filterStartDate) return false;
      if (filterEndDate && sessionDate > filterEndDate) return false;
    }
    return true;
  });

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
              <div className="flex gap-2 items-center flex-wrap p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <input 
                  type="date" 
                  value={filterExactDate} 
                  onChange={e => setFilterExactDate(e.target.value)} 
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  title="Fecha Exacta"
                />
                <span className="text-xs text-slate-400">ó rango:</span>
                <input 
                  type="date" 
                  value={filterStartDate} 
                  onChange={e => setFilterStartDate(e.target.value)} 
                  disabled={!!filterExactDate}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-50"
                  title="Fecha Inicio"
                />
                <input 
                  type="date" 
                  value={filterEndDate} 
                  onChange={e => setFilterEndDate(e.target.value)}
                  disabled={!!filterExactDate}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs disabled:opacity-50"
                  title="Fecha Fin"
                />
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
                    <span className="text-slate-500 text-sm font-bold uppercase mb-2">Puntuación de Red (QoS)</span>
                    <div className="flex items-center gap-3">
                        <span className={`text-5xl font-black ${
                            sessionStats.networkScore >= 80 ? 'text-emerald-500' :
                            sessionStats.networkScore >= 50 ? 'text-amber-500' :
                            'text-red-500'
                        }`}>
                            {sessionStats.networkScore?.toFixed(0)} <span className="text-2xl font-normal text-slate-400">/ 100</span>
                        </span>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                            sessionStats.networkScore >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                            sessionStats.networkScore >= 50 ? 'bg-amber-100 text-amber-700 border-amber-300' :
                            'bg-red-100 text-red-700 border-red-300'
                        }`}>
                            {sessionStats.networkScore >= 80 ? 'Excelente' :
                             sessionStats.networkScore >= 50 ? 'Regular' : 'Deficiente'}
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 max-w-lg">
                        Métrica dinámica calculada en base a la latencia (P99), el jitter y la eficiencia de la sesión. Una puntuación alta indica una red óptima para transmisiones en tiempo real.
                    </p>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Latencia (P99)</span>
                        <span className="text-2xl font-black text-rose-600">{sessionStats.latencyP99?.toFixed(2)} <span className="text-sm font-normal text-slate-400">ms</span></span>
                        <span className="text-[10px] text-slate-400 mt-1">Media: {sessionStats.latencyMean?.toFixed(2)} ms | P50: {sessionStats.latencyP50?.toFixed(2)} ms</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Jitter Promedio</span>
                        <span className="text-2xl font-black text-indigo-600">{sessionStats.averageJitter?.toFixed(2)} <span className="text-sm font-normal text-slate-400">ms</span></span>
                        <span className="text-[10px] text-slate-400 mt-1">P90: {sessionStats.jitter90thPercentile?.toFixed(2)} ms</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Tasa de Descarga</span>
                        <span className="text-2xl font-black text-emerald-600">{sessionStats.downloadRate?.toFixed(2)} <span className="text-sm font-normal text-slate-400">B/s</span></span>
                        <span className="text-[10px] text-slate-400 mt-1">P90 Tamaño: {sessionStats.size90thPercentile?.toFixed(2)} B</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Tasa de Paquetes</span>
                        <span className="text-2xl font-black text-amber-600">{sessionStats.packetRate?.toFixed(2)} <span className="text-sm font-normal text-slate-400">pkt/s</span></span>
                        <span className="text-[10px] text-slate-400 mt-1">Total: {sessionStats.totalPackets}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pareto Chart */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 text-center">Pareto: Distribución de Errores de Red</h4>
                        <div className="h-64">
                            {paretoData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={paretoData} margin={{bottom: 20}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="errorName" tick={{fontSize: 9}} interval={0} angle={-25} textAnchor="end" height={60} />
                                        <YAxis yAxisId="left" tick={{fontSize: 10}} />
                                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} domain={[0, 100]} />
                                        <Tooltip />
                                        <Legend wrapperStyle={{fontSize: '10px'}} />
                                        <Bar yAxisId="left" dataKey="count" name="Frecuencia" barSize={20} fill="#EF4444" />
                                        <Line yAxisId="right" type="monotone" dataKey="acumulado" name="% Acumulado" stroke="#ff7300" strokeWidth={2} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 text-emerald-500">check_circle</span>
                                    <p className="text-sm font-medium">No se detectaron errores ni anomalías en esta sesión.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 text-center">Proporción de Protocolos (Torta)</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                        style={{fontSize: '10px'}}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
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
