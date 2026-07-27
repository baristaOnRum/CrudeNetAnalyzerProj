/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Modal } from './common/Modal';
import { formatDateVE, formatDateForCriteria } from '../utils/dateUtils';
import { DateInput } from './common/DateInput';

interface AuditRecord {
  id: string;
  timestamp: string;
  name: string;
  details: string;
  raw: any;
}

export const AuditExplorer: React.FC = () => {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [fuzzySearch, setFuzzySearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    setPageInput(String(currentPage + 1));
  }, [currentPage]);

  const handlePageSubmit = () => {
    let p = parseInt(pageInput, 10);
    if (isNaN(p) || p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setPageInput(String(p));
    if (p - 1 !== currentPage) {
      fetchAudits(p - 1);
    }
  };

  const [metadata, setMetadata] = useState<{ minDate: string; maxDate: string }>({
    minDate: '',
    maxDate: ''
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch('/api/audits/metadata');
        if (res.ok) setMetadata(await res.json());
      } catch (e) { console.error(e); }
    };
    fetchMetadata();
  }, []);

  const fetchAudits = async (page = 0) => {
    try {
      Swal.fire({
        title: 'Cargando registros...',
        text: 'Por favor espere mientras se obtienen los datos.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      const criteria = { 
        term: fuzzySearch, 
        startDate: formatDateForCriteria(startDate, true), 
        endDate: formatDateForCriteria(endDate, false) 
      };
      const res = await fetch(`/api/audits/search?page=${page}&size=20&sort=fechaHora,desc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(criteria)
      });
      if (res.ok) {
        const data = await res.json();
        const rawList = data.content ?? data;
        if (data.totalPages !== undefined) {
          setTotalPages(data.totalPages);
          setCurrentPage(data.number);
        }
        const mapped = rawList.map((a: any) => ({
          id: a.idSesion ? a.idSesion.split('#')[0] : (a.id || 'N/A'),
          timestamp: formatDateVE(a.fechaHora),
          name: a.nombreAuditoria || a.name || 'AUDIT_LOG',
          details: a.detalleCambio || a.details || 'Sin detalles registrados',
          raw: a
        }));
        setAudits(mapped);
        Swal.close();
      } else {
        Swal.fire('Error', 'Fallo al obtener los registros de auditoría', 'error');
      }
    } catch (e) {
      console.error(e);
      Swal.fire('Error', 'Error de conexión', 'error');
    }
  };

  useEffect(() => {
    fetchAudits(0);
  }, []);



  return (
    <div className="space-y-6 font-sans mt-4">

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50">
          <div className="flex flex-col gap-3 w-full md:w-auto">
             <h3 className="font-sans font-bold text-base text-[#0F172A]">Registros de Auditoría del Sistema</h3>
             <div className="flex flex-wrap items-center gap-2">
                <DateInput 
                  title="Fecha Inicio" 
                  value={startDate} 
                  onChange={setStartDate} 
                />
                <span className="text-xs text-slate-400">a</span>
                <DateInput 
                  title="Fecha Fin" 
                  value={endDate} 
                  onChange={setEndDate}
                />
                <div className="relative flex-1 min-w-[200px]">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                  <input 
                    type="text" 
                    placeholder="Buscar" 
                    value={fuzzySearch}
                    onChange={(e) => setFuzzySearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.code === 'Enter' || e.keyCode === 13) {
                        e.preventDefault();
                        fetchAudits(0);
                      }
                    }}
                    className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full"
                    title="Búsqueda en todos los campos"
                  />
                </div>
                <button 
                  onClick={() => fetchAudits(0)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Filtrar
                </button>
             </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={async () => {
                try {
                  Swal.fire({
                    title: 'Exportando...',
                    text: 'Generando archivo CSV, por favor espere.',
                    allowOutsideClick: false,
                    didOpen: () => {
                      Swal.showLoading();
                    }
                  });
                  const criteria = { 
                    term: fuzzySearch, 
                    startDate: startDate ? `${startDate}T00:00:00` : null, 
                    endDate: endDate ? `${endDate}T23:59:59` : null 
                  };
                  const res = await fetch('/api/audits/export?format=CSV', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(criteria)
                  });
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `audits_filtered.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    Swal.close();
                  } else {
                    Swal.fire('Error', 'Fallo al exportar el registro de auditoría', 'error');
                  }
                } catch (e) {
                  console.error(e);
                  Swal.fire('Error', 'Error de conexión', 'error');
                }
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-sans font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[17px]">download</span>
              Exportar CSV
            </button>
            <button
              onClick={async () => {
                try {
                  Swal.fire({
                    title: 'Exportando registros...',
                    text: 'Por favor espere mientras se genera el reporte PDF de auditoría.',
                    allowOutsideClick: false,
                    didOpen: () => {
                      Swal.showLoading();
                    }
                  });
                  const criteria = { 
                    term: fuzzySearch, 
                    startDate: formatDateForCriteria(startDate, true), 
                    endDate: formatDateForCriteria(endDate, false) 
                  };
                  const res = await fetch('/api/audits/export?format=PDF', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(criteria)
                  });
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `audits_filtered.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    Swal.close();
                  } else {
                    Swal.fire('Error', 'Fallo al exportar el registro de auditoría', 'error');
                  }
                } catch (e) {
                  console.error(e);
                  Swal.fire('Error', 'Error de conexión', 'error');
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
              Exportar PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono table-fixed">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-sans font-bold text-[#64748B] uppercase">
                <th className="p-4 pl-6 w-28">ID de Sesión</th>
                <th className="p-4 w-48">Fecha y Hora</th>
                <th className="p-4 w-44">Asunto</th>
                <th className="p-4 w-auto">Detalles del Cambio</th>
                <th className="p-4 pr-6 text-right font-sans w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] font-medium text-[#1E293B]">
              {audits.length > 0 ? (
                audits.map((audit) => (
                  <tr key={audit.id + audit.timestamp} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-4 pl-6 text-[#64748B] truncate max-w-0" title={audit.id}>{audit.id}</td>
                    <td className="p-4 font-semibold text-[#0F172A] truncate max-w-0" title={audit.timestamp}>{audit.timestamp}</td>
                    <td className="p-4 truncate max-w-0" title={audit.name}>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-200 block truncate`}>
                        {audit.name}
                      </span>
                    </td>
                    <td className="p-4 text-[#475569] truncate max-w-0" title={audit.details}>{audit.details}</td>
                    <td className="p-4 pr-6 text-right space-x-2 font-sans">
                      <button
                        onClick={() => setSelectedAudit(audit)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-primary border border-primary/20 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#64748B] font-sans">
                    No se encontraron registros de auditoría.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
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
                de {totalPages} &mdash; 20 registros por pág
              </span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 0}
                onClick={() => fetchAudits(currentPage - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={currentPage >= totalPages - 1}
                onClick={() => fetchAudits(currentPage + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <Modal
          isOpen={!!selectedAudit}
          onClose={() => setSelectedAudit(null)}
          title={`Registro de Auditoría: ${selectedAudit.name}`}
          subtitle="Trazabilidad y cambios registrados en el sistema"
          icon="verified_user"
          badge={{ text: 'AUDIT', variant: 'blue' }}
          fields={[
            { label: 'ID de Sesión', value: selectedAudit.id },
            { label: 'Marca de Tiempo', value: selectedAudit.timestamp },
            { label: 'Nombre Auditoría', value: selectedAudit.name },
            { label: 'Detalles del Cambio', value: selectedAudit.details, fullWidth: true }
          ]}
          actions={[]}
        />
      )}


    </div>
  );
};

