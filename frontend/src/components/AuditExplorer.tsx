/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Modal } from './common/Modal';

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

  const fetchAudits = async () => {
    try {
      let res = await fetch('/api/audits');
      if (!res.ok) {
        res = await fetch('/api/events');
      }
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((a: any) => ({
          id: a.idSesion || a.id || 'N/A',
          timestamp: a.fechaHora ? a.fechaHora.replace('T', ' ').substring(0, 19) : new Date().toLocaleString(),
          name: a.nombreAuditoria || a.name || 'AUDIT_LOG',
          details: a.detalleCambio || a.details || 'Sin detalles registrados',
          raw: a
        }));
        setAudits(mapped.reverse());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const handleExportAudit = async (id: string, format: 'CSV' | 'PDF' = 'CSV') => {
    try {
      const res = await fetch(`/api/audits/${id}/export?format=${format}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_${id}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        Swal.fire({ text: `No se pudo exportar la auditoría a ${format}.`, icon: 'error', confirmButtonColor: '#4F46E5' });
      }
    } catch (e) {
      console.error(e);
    }
  };



  return (
    <div className="space-y-6 font-sans mt-4">

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50">
          <h3 className="font-sans font-bold text-base text-[#0F172A]">Registros de Auditoría del Sistema</h3>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/audits/export?format=CSV');
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `audits_full.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } else {
                    Swal.fire('Error', 'Fallo al exportar el registro de auditoría', 'error');
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-sans font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[17px]">download</span>
              Exportar Registro (CSV)
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/audits/export?format=PDF');
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `audits_full.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  } else {
                    Swal.fire('Error', 'Fallo al exportar el registro de auditoría', 'error');
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[17px]">picture_as_pdf</span>
              Exportar Registro (PDF)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-sans font-bold text-[#64748B] uppercase">
                <th className="p-4 pl-6">ID de Sesión</th>
                <th className="p-4">Fecha y Hora</th>
                <th className="p-4">Nombre de Auditoría</th>
                <th className="p-4">Detalles del Cambio</th>
                <th className="p-4 pr-6 text-right font-sans">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] font-medium text-[#1E293B]">
              {audits.length > 0 ? (
                audits.map((audit) => (
                  <tr key={audit.id + audit.timestamp} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-4 pl-6 text-[#64748B]">{audit.id}</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{audit.timestamp}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-200`}>
                        {audit.name}
                      </span>
                    </td>
                    <td className="p-4 text-[#475569]">{audit.details}</td>
                    <td className="p-4 pr-6 text-right space-x-2 font-sans">
                      <button
                        onClick={() => setSelectedAudit(audit)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-primary border border-primary/20 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Ver Detalle
                      </button>
                      <button
                        onClick={() => handleExportAudit(audit.id, 'CSV')}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Exportar CSV
                      </button>
                      <button
                        onClick={() => handleExportAudit(audit.id, 'PDF')}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Exportar PDF
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
            { label: 'Detalles del Cambio', value: selectedAudit.details, fullWidth: true },
            { label: 'Estructura JSON Completa', value: JSON.stringify(selectedAudit.raw, null, 2), fullWidth: true, isCode: true }
          ]}
          actions={[
            {
              label: 'Exportar CSV',
              icon: 'download',
              onClick: () => handleExportAudit(selectedAudit.id, 'CSV')
            },
            {
              label: 'Exportar PDF',
              icon: 'picture_as_pdf',
              onClick: () => handleExportAudit(selectedAudit.id, 'PDF')
            }
          ]}
        />
      )}


    </div>
  );
};

