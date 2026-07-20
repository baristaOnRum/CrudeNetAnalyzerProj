/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Modal } from './common/Modal';

interface AnalisisRed {
  id: number;
  fechaEjecucion: string;
  duracionAnalisis: number;
}

export const ReportsConsole: React.FC = () => {
  const [sessions, setSessions] = useState<AnalisisRed[]>([]);
  const [selectedSession, setSelectedSession] = useState<AnalisisRed | null>(null);
  const [sessionPackets, setSessionPackets] = useState<any[]>([]);
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

  const handleViewPackets = async (session: AnalisisRed) => {
    setSelectedSession(session);
    setSessionPackets([]);
    try {
      const res = await fetch('/api/packets');
      if (res.ok) {
        const data = await res.json();
        const packets = data.filter((p: any) => p.idAnalisis === session.id);
        setSessionPackets(packets);
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
    
    try {
      await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: id })
      });
    } catch (e) {}

    Swal.fire({
      title: 'Generando Reporte...',
      text: 'Compilando informe en PDF.',
      timer: 1500,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    }).then(() => {
      Swal.fire({ text: `Se ha compilado con éxito el informe para el rastreo de paquetes ${id}. ¡Reporte descargado!`, icon: 'success', confirmButtonColor: '#4F46E5' });
      const mockBlobText = `Reporte de Análisis - Sistema de Asistencia al Monitoreo y Auditoria\nID de Sesión: ${id}\nFecha: ${session.fechaEjecucion}\nDuración: ${session.duracionAnalisis}s`;
      const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(mockBlobText);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', `SAMA_Reporte_${id}.txt`);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
    });
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

  return (
    <div className="space-y-6 font-sans mt-4">

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden flex flex-col shadow-sm">
        <div className="p-5 border-b border-[#E2E8F0] bg-white flex justify-between items-center select-none flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-base text-[#0F172A]">
              Historial de Sesiones de Análisis de Red
            </h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Crear Sesión
            </button>
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
                      onClick={() => handleViewPackets(session)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold transition-colors border border-blue-200 cursor-pointer"
                    >
                      Ver
                    </button>
                    <button 
                      onClick={() => handleGenerateReport(session.id)}
                      className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-semibold transition-colors border border-primary/20 cursor-pointer"
                    >
                      Descargar Reporte
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

      {/* Detail Session Modal */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title={`Paquetes de la Sesión #${selectedSession.id}`}
          subtitle="Listado de paquetes interceptados durante el análisis"
          icon="list_alt"
          size="lg"
        >
          <div className="overflow-y-auto max-h-[400px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-bold text-[#64748B] uppercase">
                <tr>
                  <th className="p-3">Protocolo</th>
                  <th className="p-3">Origen</th>
                  <th className="p-3">Destino</th>
                  <th className="p-3">Contenido (bytes)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {sessionPackets.map((pkt: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{pkt.tipoPaquete}</td>
                    <td className="p-3 font-mono">{pkt.fuente}</td>
                    <td className="p-3 font-mono">{pkt.destino}</td>
                    <td className="p-3 font-mono text-slate-500 truncate max-w-[200px]">{pkt.contenidos}</td>
                  </tr>
                ))}
                {sessionPackets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">No hay paquetes guardados para esta sesión.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
             <button
                onClick={() => {
                  const id = selectedSession.id;
                  setSelectedSession(null);
                  handleGenerateReport(id);
                }}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20 cursor-pointer flex items-center gap-1"
             >
               <span className="material-symbols-outlined text-sm">download</span> Generar Informe
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

