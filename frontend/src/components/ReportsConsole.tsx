/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface AnalisisRed {
  id: number;
  fechaEjecucion: string;
  duracionAnalisis: number;
}

export const ReportsConsole: React.FC = () => {
  const [sessions, setSessions] = useState<AnalisisRed[]>([]);
  
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterExactDate, setFilterExactDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/analysis');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleViewDetails = (id: number) => {
    Swal.fire({
      title: `Detalles del Análisis #${id}`,
      text: `El reporte para la sesión de análisis ${id} está siendo generado y recopilado...`,
      icon: 'info',
      confirmButtonColor: '#4F46E5'
    });
  };

  const handleGenerateReport = (id: number) => {
    const session = sessions.find(s => s.id === id);
    if (!session) return;
    
    Swal.fire({
      title: 'Generando Reporte...',
      text: 'Compilando informe en PDF.',
      timer: 1800,
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
          <h3 className="font-bold text-base text-[#0F172A]">
            Historial de Sesiones de Análisis
          </h3>
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
                <th className="p-4">Duración (seg)</th>
                <th className="p-4 pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm text-[#1E293B]">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-[#F8FAFC] transition-colors group">
                  <td className="p-4 pl-6 font-semibold text-[#0F172A]">
                    {session.id}
                  </td>
                  <td className="p-4 font-mono text-xs text-[#64748B]">
                    {session.fechaEjecucion ? session.fechaEjecucion.replace('T', ' ').substring(0, 19) : 'N/A'}
                  </td>
                  <td className="p-4 font-mono text-xs text-[#64748B]">
                    {session.duracionAnalisis}s
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button 
                      onClick={() => handleViewDetails(session.id)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold transition-colors border border-blue-200"
                    >
                      Ver Detalles
                    </button>
                    <button 
                      onClick={() => handleGenerateReport(session.id)}
                      className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-semibold transition-colors border border-primary/20"
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
      </div>
    </div>
  );
};
