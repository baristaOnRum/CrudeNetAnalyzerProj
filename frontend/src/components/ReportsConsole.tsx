/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import logoImg from '../assets/Picture1.png';
import { Modal } from './common/Modal';
import { formatDateVE, formatEmissionDateVE, formatDateForCriteria } from '../utils/dateUtils';
import { DateInput } from './common/DateInput';
import { ReportConfigModal, ReportConfig } from './ReportConfigModal';
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

const ERROR_DESCRIPTIONS: Record<string, string> = {
  'ACK Duplicado': 'Confirmación repetida generada cuando se reciben paquetes fuera de secuencia o se detecta una brecha en el flujo de datos.',
  'Retransmisión TCP': 'Reenvío de un segmento de datos tras expirar el temporizador de retransmisión (RTO) por falta de confirmación del receptor.',
  'Retransmisión Rápida TCP': 'Reenvío acelerado activado inmediatamente al recibir 3 confirmaciones duplicadas (ACKs) seguidas sin esperar al temporizador.',
  'TTL Expirado': 'El tiempo de vida (TTL) del paquete se redujo a 0 en un router intermedio antes de poder alcanzar la dirección IP de destino.',
  'Destino Inalcanzable (ICMP)': 'Mensaje ICMP de control devuelto cuando el equipo, la red o el servicio/puerto solicitado no se encuentra disponible.',
  'Conexión Reseteada (RST)': 'Terminación abrupta del socket TCP solicitada por el servidor, host o regla de seguridad de un firewall.'
};

const CustomParetoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const name = data.errorName;
    const desc = ERROR_DESCRIPTIONS[name] || 'Anomalía de red capturada durante la sesión.';
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1.5 max-w-xs select-none">
        <div className="font-bold text-slate-800 border-b border-slate-100 pb-1">{name}</div>
        <p className="text-[11px] text-slate-600 leading-relaxed font-normal">{desc}</p>
        <div className="pt-1.5 border-t border-slate-100 flex justify-between font-mono text-[10px]">
          <span className="text-slate-500">Ocurrencias: <strong className="text-blue-600 font-bold">{data.count}</strong></span>
          <span className="text-slate-500">% Acumulado: <strong className="text-rose-600 font-bold">{data.cumulativePercentage?.toFixed(1)}%</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

interface AnalisisRed {
  id: number;
  fechaEjecucion: string;
  duracionAnalisis: number;
}

export const ReportsConsole: React.FC = () => {
  const [sessions, setSessions] = useState<AnalisisRed[]>([]);
  const [selectedSession, setSelectedSession] = useState<AnalisisRed | null>(null);
  const [pendingSession, setPendingSession] = useState<AnalisisRed | null>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    mode: 'FULL',
    visibleSections: {
      networkScore: true,
      latencyDistribution: true,
      jitterAverage: true,
      downloadRate: true,
      packetRate: true,
      errorRate: true,
      paretoErrorDistribution: true,
      protocolDistribution: true,
      topSourceIps: true,
      topDestIps: true
    }
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDuration, setNewDuration] = useState('60');

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [fuzzySearch, setFuzzySearch] = useState('');

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
      fetchSessions(p - 1);
    }
  };

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
      Swal.fire({ title: 'Cargando sesiones...', text: 'Por favor espere.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const payload = {
         term: fuzzySearch || null,
         startDate: formatDateForCriteria(filterStartDate, true),
         endDate: formatDateForCriteria(filterEndDate, false)
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
        Swal.close();
      } else {
        Swal.fire('Error', 'Fallo al obtener las sesiones de análisis', 'error');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Error de conexión', 'error');
    }
  };

  useEffect(() => {
    fetchSessions(0);
    fetchQosThresholds();
  }, []);

  const handleViewStats = async (session: AnalisisRed) => {
    setPendingSession(session);
    setSessionStats(null);
    try {
      Swal.fire({ title: 'Calculando estadísticas...', text: 'Analizando paquetes y métricas.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await fetch('/api/reports/statistics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id.toString() })
      });
      if (res.ok) {
        const data = await res.json();
        setSessionStats(data);
        Swal.close();
        setIsConfigModalOpen(true);
      } else {
        Swal.fire('Error', 'Fallo al calcular estadísticas', 'error');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Error de conexión', 'error');
    }
  };

  const handleConfirmReportConfig = (config: ReportConfig) => {
    setReportConfig(config);
    setIsConfigModalOpen(false);
    if (pendingSession) {
      setSelectedSession(pendingSession);
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
            setTimeout(() => {
              toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2 })
                .then((dataUrl) => {
                  const pdf = new jsPDF('p', 'mm', 'letter');
                  const pdfWidth = pdf.internal.pageSize.getWidth();
                  const pdfPageHeight = pdf.internal.pageSize.getHeight();
                  
                  const marginX = 12; // 12mm left/right margin
                  const marginTop = 24; // 24mm top margin for header
                  
                  const availableWidth = pdfWidth - (marginX * 2);
                  const contentHeight = (element.offsetHeight * availableWidth) / element.offsetWidth;
                  
                  // 1. Membrete (Header)
                  pdf.setFont('helvetica', 'bold');
                  pdf.setFontSize(10);
                  pdf.setTextColor(15, 23, 42); // Slate 900
                  pdf.text("REPORTE ESTADÍSTICO DE ANÁLISIS", marginX, 12);
                  
                  const dateStr = "Emisión: " + formatEmissionDateVE();
                  pdf.setFont('helvetica', 'normal');
                  pdf.setFontSize(8);
                  pdf.setTextColor(100, 116, 139);
                  pdf.text(dateStr, marginX, 17);

                  // Company Logo (Top Right corner with correct natural 5.63:1 aspect ratio)
                  const logoHeight = 7.5; // 7.5mm height
                  const logoWidth = logoHeight * (259.0 / 46.0); // ~42.23mm width
                  pdf.addImage(logoImg, 'PNG', pdfWidth - marginX - logoWidth, 9, logoWidth, logoHeight);
                  
                  pdf.setDrawColor(226, 232, 240); // Slate 200
                  pdf.setLineWidth(0.3);
                  pdf.line(marginX, 20, pdfWidth - marginX, 20);

                  // 2. Main Content Image
                  pdf.addImage(dataUrl, 'PNG', marginX, marginTop, availableWidth, contentHeight);

                  // 3. Pie de página (Footer)
                  const bannerHeight = 10; // 10mm banner
                  const bannerY = pdfPageHeight - 16;
                  
                  // Blue Footer Banner
                  pdf.setFillColor(29, 78, 216); // Royal Blue #1d4ed8
                  pdf.rect(marginX, bannerY, availableWidth, bannerHeight, 'F');

                  // Contact text inside banner
                  pdf.setFont('helvetica', 'normal');
                  pdf.setFontSize(7.5);
                  pdf.setTextColor(255, 255, 255);

                  const line1 = "Bolívar - El Tigre - Maturín   0291-6441738 / 0412-6747686";
                  const line2 = "Barcelona - Cumaná - Margarita   0412-5747286";

                  pdf.text(line1, pdfWidth / 2, bannerY + 4, { align: 'center' });
                  pdf.text(line2, pdfWidth / 2, bannerY + 8, { align: 'center' });

                  // Page Numbering "Página 1 de 1" below banner
                  pdf.setFontSize(8);
                  pdf.setTextColor(100, 116, 139);
                  const pageStr = "Página 1 de 1";
                  pdf.text(pageStr, pdfWidth - marginX - pdf.getTextWidth(pageStr), pdfPageHeight - 3);

                  pdf.save(`Reporte_Estadistico_${id}_${Date.now()}.pdf`);
                  
                  fetch('/api/reports/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: id.toString(), reportType: "PDF_STATS" })
                  });
                  Swal.fire('Éxito', 'El PDF ha sido generado y descargado correctamente.', 'success');
                })
                .catch((err: any) => {
                  console.error("Error generating PDF:", err);
                  Swal.fire('Error', `No se pudo generar el PDF: ${err.message || err}`, 'error');
                });
          }, 300);
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
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50">
          <div className="flex flex-col gap-3 w-full">
             <h3 className="font-sans font-bold text-base text-[#0F172A]">Historial de Sesiones de Análisis de Red</h3>
             <div className="flex flex-wrap items-center gap-2">
                <DateInput 
                  title="Fecha Inicio" 
                  value={filterStartDate} 
                  onChange={setFilterStartDate} 
                />
                <span className="text-xs text-slate-400 font-medium">a</span>
                <DateInput 
                  title="Fecha Fin" 
                  value={filterEndDate} 
                  onChange={setFilterEndDate}
                />
                <div className="relative w-36">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[15px]">tag</span>
                  <input 
                    type="text" 
                    placeholder="ID Sesión..." 
                    value={fuzzySearch} 
                    onChange={e => setFuzzySearch(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
                        e.preventDefault();
                        fetchSessions(0);
                      }
                    }}
                    className="pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
                    title="Buscar por ID de Sesión"
                  />
                </div>
                <button 
                  onClick={() => fetchSessions(0)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Filtrar
                </button>
                <button 
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setFuzzySearch('');
                    fetchSessions(0);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Limpiar Filtros
                </button>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-sans font-bold text-[#64748B] uppercase">
                <th className="p-4 pl-6 w-36">ID de Sesión</th>
                <th className="p-4 w-auto">Fecha de Ejecución</th>
                <th className="p-4 pr-6 text-right w-48">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm text-[#1E293B]">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-[#F8FAFC] transition-colors group">
                  <td className="p-4 pl-6 font-semibold text-[#0F172A] truncate max-w-0" title={String(session.id)}>
                    #{session.id}
                  </td>
                  <td className="p-4 font-mono text-xs text-[#64748B] truncate max-w-0" title={formatDateVE(session.fechaEjecucion)}>
                    {formatDateVE(session.fechaEjecucion)}
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button 
                      onClick={() => handleViewStats(session)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold transition-colors border border-blue-200 cursor-pointer"
                    >
                      Ver Estadísticas
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
                de {totalPages}
              </span>
            </div>
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
            <div className="space-y-6" id="statistics-modal-content">
                {/* Puntuación de Red */}
                {reportConfig.visibleSections.networkScore && (
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-inner">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-slate-500 text-sm font-bold uppercase">Puntuación de Red (QoS)</span>
                        <div className="relative group inline-flex items-center">
                            <span className="material-symbols-outlined text-[#64748B] text-[16px] cursor-help">info</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 left-1/2 -translate-x-1/2 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
                                <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Puntuación de Red (QoS)</div>
                                <div>Métrica dinámica calculada en base a la latencia (P90), el jitter y la eficiencia de la sesión. Una puntuación alta indica una red óptima para transmisiones en tiempo real.</div>
                            </div>
                        </div>
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
                )}

                {/* Metric Cards Grid */}
                {(reportConfig.visibleSections.latencyDistribution ||
                  reportConfig.visibleSections.jitterAverage ||
                  reportConfig.visibleSections.downloadRate ||
                  reportConfig.visibleSections.packetRate ||
                  reportConfig.visibleSections.errorRate) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="metric-cards">
                    {reportConfig.visibleSections.latencyDistribution && (
                    <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-center text-center relative">
                        <div className="absolute top-2 right-2 group z-50">
                            <span className="material-symbols-outlined text-blue-500 text-[18px] cursor-help">info</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
                                <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Distribución de Latencia</div>
                                <p className="mb-1">La latencia determina la velocidad de respuesta de la red.</p>
                                <p className="mb-1">Una mediana baja indica buena fluidez general.</p>
                                <p>Si el P90 está muy alejado de la mediana, significa picos de retardo en aplicaciones en tiempo real.</p>
                            </div>
                        </div>
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
                                 <div className="w-full space-y-2">
                                     {/* Gráfico de Vela y Mechas con valores directos en la interfaz */}
                                     <div className="w-full h-16 relative flex items-center group cursor-crosshair">
                                         {/* Eje base */}
                                         <div className="absolute w-full h-px bg-slate-300 left-0"></div>
                                         
                                         {/* Mechas (Min -> P90) */}
                                         <div className="absolute h-[2px] bg-slate-500" style={{ left: `${pMin}%`, width: `${pMax - pMin}%` }}></div>
                                         
                                         {/* Extremo Izquierdo (Mínimo) */}
                                         <div className="absolute h-3 w-[2px] bg-slate-700" style={{ left: `${pMin}%`, top: '50%', transform: 'translateY(-50%)' }}>
                                             <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-600 whitespace-nowrap bg-white px-1 border border-slate-200 rounded">
                                                 Mín: {sessionStats.latencyMin?.toFixed(1)} ms
                                             </span>
                                         </div>

                                         {/* Cuerpo de la Vela (P25 -> P75) */}
                                         <div className="absolute h-6 bg-rose-200 border border-rose-500 rounded-sm shadow-sm" style={{ left: `${p25}%`, width: `${Math.max(1, p75 - p25)}%`, top: '50%', transform: 'translateY(-50%)' }}></div>
                                         
                                         {/* Mediana (P50) en la Vela */}
                                         <div className="absolute h-8 w-[3px] bg-rose-600 rounded-full shadow-sm z-10" style={{ left: `${p50}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
                                             <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-rose-700 whitespace-nowrap bg-rose-100 px-1 border border-rose-300 rounded shadow-xs">
                                                 P50: {sessionStats.latencyP50?.toFixed(1)} ms
                                             </span>
                                         </div>

                                         {/* Extremo Derecho (P90) */}
                                         <div className="absolute h-3 w-[2px] bg-slate-700" style={{ left: `${pMax}%`, top: '50%', transform: 'translateY(-50%)' }}>
                                             <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-slate-600 whitespace-nowrap bg-white px-1 border border-slate-200 rounded">
                                                 P90: {sessionStats.latencyP90?.toFixed(1)} ms
                                             </span>
                                         </div>
                                         
                                         {/* Custom Tooltip complementario */}
                                         <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-2.5 rounded-lg shadow-xl text-left text-[11px] z-50 top-full mt-1 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap flex flex-col gap-1">
                                             <div className="font-bold text-slate-700 mb-1 border-b border-slate-100 pb-1">Distribución Latencia (ms)</div>
                                             <div className="flex justify-between gap-6"><span className="text-slate-500">Mínimo:</span> <span className="font-mono">{sessionStats.latencyMin?.toFixed(2)}</span></div>
                                             <div className="flex justify-between gap-6"><span className="text-slate-500">Perc. 25:</span> <span className="font-mono">{sessionStats.latencyP25?.toFixed(2)}</span></div>
                                             <div className="flex justify-between gap-6"><span className="font-semibold text-rose-600">Mediana (P50):</span> <span className="font-mono font-bold text-rose-600">{sessionStats.latencyP50?.toFixed(2)}</span></div>
                                             <div className="flex justify-between gap-6"><span className="text-slate-500">Perc. 75:</span> <span className="font-mono">{sessionStats.latencyP75?.toFixed(2)}</span></div>
                                             <div className="flex justify-between gap-6"><span className="text-slate-500">Tope (P90):</span> <span className="font-mono">{sessionStats.latencyP90?.toFixed(2)}</span></div>
                                             <div className="flex justify-between gap-6 mt-1 border-t border-slate-100 pt-1"><span className="text-slate-400">Máximo abs:</span> <span className="font-mono text-slate-400">{sessionStats.latencyMax?.toFixed(2)}</span></div>
                                         </div>
                                     </div>

                                     {/* Panel de valores estático fuera del tooltip */}
                                     <div className="grid grid-cols-5 gap-1 pt-4 text-[10px] font-mono select-none">
                                         <div className="bg-white p-1 rounded border border-slate-200 text-center">
                                             <span className="text-slate-400 block text-[8px] uppercase font-bold">Mínimo</span>
                                             <span className="font-bold text-slate-700">{sessionStats.latencyMin?.toFixed(1)} ms</span>
                                         </div>
                                         <div className="bg-white p-1 rounded border border-slate-200 text-center">
                                             <span className="text-slate-400 block text-[8px] uppercase font-bold">P25</span>
                                             <span className="font-bold text-slate-700">{sessionStats.latencyP25?.toFixed(1)} ms</span>
                                         </div>
                                         <div className="bg-rose-50 p-1 rounded border border-rose-300 text-center shadow-xs">
                                             <span className="text-rose-600 block text-[8px] uppercase font-bold font-sans">Mediana</span>
                                             <span className="font-extrabold text-rose-700">{sessionStats.latencyP50?.toFixed(1)} ms</span>
                                         </div>
                                         <div className="bg-white p-1 rounded border border-slate-200 text-center">
                                             <span className="text-slate-400 block text-[8px] uppercase font-bold">P75</span>
                                             <span className="font-bold text-slate-700">{sessionStats.latencyP75?.toFixed(1)} ms</span>
                                         </div>
                                         <div className="bg-white p-1 rounded border border-slate-200 text-center">
                                             <span className="text-slate-400 block text-[8px] uppercase font-bold">P90</span>
                                             <span className="font-bold text-slate-700">{sessionStats.latencyP90?.toFixed(1)} ms</span>
                                         </div>
                                     </div>
                                 </div>
                                )
                           })() : <span className="text-sm text-slate-400 mx-auto">Sin datos</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2 font-medium">Caja: P25-P75 | Línea: Mediana | Tope: P90</span>
                    </div>
                    )}

                    {reportConfig.visibleSections.jitterAverage && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center relative transition-colors hover:bg-slate-100">
                        <div className="absolute top-2 right-2 group z-50">
                            <span className="material-symbols-outlined text-indigo-500 text-[18px] cursor-help">info</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
                                <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Variación de Retardo (Jitter)</div>
                                <p className="mb-1.5">Mide la estabilidad en la llegada de paquetes consecutivos. Un Jitter elevado (&gt; 30 ms) causa distorsiones en llamadas de voz (VoIP) y streaming.</p>
                                <div className="space-y-0.5 font-mono text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <div className="flex justify-between"><span className="text-slate-500">Jitter P50 (Mediana):</span> <span>{sessionStats.jitterP50?.toFixed(2)} ms</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Jitter P90:</span> <span>{sessionStats.jitter90thPercentile?.toFixed(2)} ms</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Jitter P99 (Picos):</span> <span>{sessionStats.jitterP99?.toFixed(2)} ms</span></div>
                                </div>
                            </div>
                        </div>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Jitter Promedio</span>
                        <span className="text-2xl font-black text-indigo-600">{sessionStats.averageJitter?.toFixed(2)} <span className="text-sm font-normal text-slate-400">ms</span></span>
                        <span className="text-[10px] text-slate-400 mt-1">P90: {sessionStats.jitter90thPercentile?.toFixed(2)} ms</span>
                    </div>
                    )}

                    {reportConfig.visibleSections.downloadRate && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center relative transition-colors hover:bg-slate-100">
                        <div className="absolute top-2 right-2 group z-50">
                            <span className="material-symbols-outlined text-emerald-500 text-[18px] cursor-help">info</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
                                <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Tasa de Descarga (Pico)</div>
                                <p className="mb-1.5">Representa la velocidad máxima instantánea alcanzada en ráfagas de transferencia durante la captura.</p>
                                <div className="space-y-0.5 font-mono text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <div className="flex justify-between"><span className="text-slate-500">Tasa en Mbps:</span> <span className="font-bold text-emerald-600">{((sessionStats.downloadRate * 8) / 1_000_000).toFixed(2)} Mbps</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Tasa en Bytes/s:</span> <span>{formatBytes(sessionStats.downloadRate)}/s</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Tamaño P50 Pkts:</span> <span>{formatBytes(sessionStats.sizeP50)}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Tamaño P90 Pkts:</span> <span>{formatBytes(sessionStats.size90thPercentile)}</span></div>
                                </div>
                            </div>
                        </div>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Tasa de Descarga (Pico)</span>
                        <span className="text-2xl font-black text-emerald-600">
                            {((sessionStats.downloadRate * 8) / 1_000_000).toFixed(2)} <span className="text-sm font-normal text-slate-400">Mbps</span>
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">Equiv: {formatBytes(sessionStats.downloadRate)}/s | P90: {formatBytes(sessionStats.size90thPercentile)}</span>
                    </div>
                    )}

                    {reportConfig.visibleSections.sustainedDownloadRate && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center relative transition-colors hover:bg-slate-100">
                        <div className="absolute top-2 right-2 group z-50">
                            <span className="material-symbols-outlined text-teal-500 text-[18px] cursor-help">info</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
                                <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Tasa de Descarga Sostenida</div>
                                <p className="mb-1.5">Mide el flujo constante y efectivo de transferencia a lo largo de toda la sesión (bytes totales / tiempo total). Determina la capacidad real para descargas y streaming continuo.</p>
                                <div className="space-y-0.5 font-mono text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <div className="flex justify-between"><span className="text-slate-500">Tasa en Mbps:</span> <span className="font-bold text-teal-600">{(((sessionStats.sustainedDownloadRate || sessionStats.downloadRate) * 8) / 1_000_000).toFixed(2)} Mbps</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Tasa en Bytes/s:</span> <span>{formatBytes(sessionStats.sustainedDownloadRate || sessionStats.downloadRate)}/s</span></div>
                                </div>
                            </div>
                        </div>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Tasa Descarga Sostenida</span>
                        <span className="text-2xl font-black text-teal-600">
                            {(((sessionStats.sustainedDownloadRate || sessionStats.downloadRate) * 8) / 1_000_000).toFixed(2)} <span className="text-sm font-normal text-slate-400">Mbps</span>
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">Equiv: {formatBytes(sessionStats.sustainedDownloadRate || sessionStats.downloadRate)}/s | Promedio sesión</span>
                    </div>
                    )}

                    {reportConfig.visibleSections.packetRate && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center relative transition-colors hover:bg-slate-100">
                        <div className="absolute top-2 right-2 group z-50">
                            <span className="material-symbols-outlined text-amber-500 text-[18px] cursor-help">info</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
                                <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Tasa de Paquetes (Packets/Sec)</div>
                                <p className="mb-1.5">Indica la densidad e intensidad de paquetes procesados por segundo (PPS). Una alta tasa de PPS demanda mayor consumo de CPU en routers e interfaces de red.</p>
                                <div className="space-y-0.5 font-mono text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <div className="flex justify-between"><span className="text-slate-500">Total Paquetes:</span> <span>{sessionStats.totalPackets}</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Protocolo Mayoritario:</span> <span>{sessionStats.primaryProtocol}</span></div>
                                </div>
                            </div>
                        </div>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Tasa de Paquetes</span>
                        <span className="text-2xl font-black text-amber-600">{sessionStats.packetRate?.toFixed(2)} <span className="text-sm font-normal text-slate-400">pkt/s</span></span>
                        <span className="text-[10px] text-slate-400 mt-1">Total: {sessionStats.totalPackets}</span>
                    </div>
                    )}

                    {reportConfig.visibleSections.errorRate && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center relative transition-colors hover:bg-slate-100">
                        <div className="absolute top-2 right-2 group z-50">
                            <span className="material-symbols-outlined text-rose-500 text-[18px] cursor-help">info</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-64 text-slate-600 leading-relaxed font-normal normal-case">
                                <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Tasa de Errores de Red</div>
                                <p className="mb-1.5">Proporción porcentual de tráfico afectado por fallos (retransmisiones TCP, paquetes duplicados, caídas de conexión o paquetes ICMP inalcanzables).</p>
                                <div className="space-y-0.5 font-mono text-[10px] bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <div className="flex justify-between"><span className="text-slate-500">Umbral Óptimo:</span> <span className="text-emerald-600 font-bold">&lt; 1%</span></div>
                                    <div className="flex justify-between"><span className="text-slate-500">Umbral Crítico:</span> <span className="text-rose-600 font-bold">&gt; 5%</span></div>
                                </div>
                            </div>
                        </div>
                        <span className="text-slate-500 text-xs font-bold uppercase mb-1">Tasa de Errores</span>
                        <span className="text-2xl font-black text-rose-600">{sessionStats.errorRate?.toFixed(2)} <span className="text-sm font-normal text-slate-400">%</span></span>
                        <span className="text-[10px] text-slate-400 mt-1">% del tráfico con anomalías</span>
                    </div>
                    )}
                </div>
                )}

                {/* Charts Row */}
                {(reportConfig.visibleSections.paretoErrorDistribution || reportConfig.visibleSections.protocolDistribution) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pareto Chart */}
                    {reportConfig.visibleSections.paretoErrorDistribution && (
                    <div className={`bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative ${!reportConfig.visibleSections.protocolDistribution ? 'col-span-2' : ''}`}>
                        <div className="absolute top-4 right-4 group z-50">
                            <span className="material-symbols-outlined text-slate-400 text-[18px] cursor-help">info</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-72 text-slate-600 leading-relaxed font-normal normal-case">
                                <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Distribución de Errores de Red</div>
                                <p className="mb-1.5">Aplica el principio de Pareto (80/20) para clasificar las anomalías y priorizar la resolución de fallos:</p>
                                <div className="space-y-1 text-[10px]">
                                    <div><strong className="text-slate-700">ACK Duplicado:</strong> Paquetes desordenados o brechas de datos.</div>
                                    <div><strong className="text-slate-700">Retransmisión TCP:</strong> Reenvío por expirar temporizador (RTO).</div>
                                    <div><strong className="text-slate-700">Retransmisión Rápida:</strong> Reenvío tras 3 ACKs duplicados.</div>
                                    <div><strong className="text-slate-700">TTL Expirado:</strong> Salto excedido antes del destino.</div>
                                    <div><strong className="text-slate-700">ICMP Inalcanzable:</strong> Host, red o puerto no disponible.</div>
                                    <div><strong className="text-slate-700">RST:</strong> Conexión terminada abruptamente por socket o firewall.</div>
                                </div>
                            </div>
                        </div>
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 text-center">Distribución de Errores de Red</h4>
                        <div className="h-64">
                            {paretoData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={paretoData} margin={{bottom: 20}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="errorName" tick={{fontSize: 9}} interval={0} angle={-25} textAnchor="end" height={60} />
                                        <YAxis yAxisId="left" tick={{fontSize: 10}} />
                                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} domain={[0, 100]} />
                                        <Tooltip content={<CustomParetoTooltip />} />
                                        <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Cantidad" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                                        <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#EF4444" name="% Acumulado" strokeWidth={2} dot={{r: 4}} isAnimationActive={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <span className="text-sm text-slate-400 italic">No se detectaron errores significativos</span>
                                </div>
                            )}
                        </div>
                    </div>
                    )}

                    {/* Protocol Pie Chart */}
                    {reportConfig.visibleSections.protocolDistribution && (
                    <div className={`bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col justify-between relative ${!reportConfig.visibleSections.paretoErrorDistribution ? 'col-span-2' : ''}`}>
                        <div className="absolute top-4 right-4 group z-50">
                            <span className="material-symbols-outlined text-slate-400 text-[18px] cursor-help">info</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-60 text-slate-600 leading-relaxed font-normal normal-case">
                                <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Distribución de Protocolos</div>
                                <div>Proporción de tráfico consumido por cada protocolo. Oculta aquellos que representen menos del 16% del tráfico total.</div>
                            </div>
                        </div>
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 text-center">Distribución de Protocolos</h4>
                        <div className="h-64">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={true} isAnimationActive={false}>
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '0.75rem', borderColor: '#e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', fontSize: '11px' }} formatter={(value: number) => value + " pkt"} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <span className="text-sm text-slate-400 italic">Sin datos de protocolos</span>
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                </div>
                )}

                {/* Top IPs */}
                {(reportConfig.visibleSections.topSourceIps || reportConfig.visibleSections.topDestIps) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reportConfig.visibleSections.topSourceIps && (
                    <div className={`bg-white border border-slate-200 p-4 rounded-xl shadow-sm ${!reportConfig.visibleSections.topDestIps ? 'col-span-2' : ''}`}>
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 flex items-center justify-between">
                            Top 5 IPs Origen (Emisores)
                            <div className="relative group inline-flex items-center">
                                <span className="material-symbols-outlined text-slate-400 text-[18px] cursor-help">info</span>
                                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-60 text-slate-600 leading-relaxed font-normal normal-case">
                                    <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Top IPs Origen</div>
                                    <div>Los 5 dispositivos que más tráfico generaron. Útil para detectar cuellos de botella u orígenes de ataques.</div>
                                </div>
                            </div>
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
                    )}
                    {reportConfig.visibleSections.topDestIps && (
                    <div className={`bg-white border border-slate-200 p-4 rounded-xl shadow-sm ${!reportConfig.visibleSections.topSourceIps ? 'col-span-2' : ''}`}>
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-4 flex items-center justify-between">
                            Top 5 IPs Destino (Receptores)
                            <div className="relative group inline-flex items-center">
                                <span className="material-symbols-outlined text-slate-400 text-[18px] cursor-help">info</span>
                                <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-left text-[11px] z-50 top-full mt-1 right-0 pointer-events-none w-60 text-slate-600 leading-relaxed font-normal normal-case">
                                    <div className="font-bold text-slate-800 mb-1 border-b border-slate-100 pb-1">Top IPs Destino</div>
                                    <div>Los 5 dispositivos que más tráfico recibieron.</div>
                                </div>
                            </div>
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
                    )}
                </div>
                )}

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
                  handleGenerateReport(selectedSession.id);
                }}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 cursor-pointer flex items-center gap-1 hover:bg-primary/90"
             >
               <span className="material-symbols-outlined text-sm">download</span> Descargar Informe PDF
             </button>
          </div>
        </Modal>
      )}

      {/* Report Character Configuration Modal */}
      <ReportConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onConfirm={handleConfirmReportConfig}
        sessionStats={sessionStats}
      />

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
