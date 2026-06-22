/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface AuditRecord {
  id: string;
  timestamp: string;
  name: string;
  details: string;
}

export const AuditExplorer: React.FC = () => {
  const [audits, setAudits] = useState<AuditRecord[]>([]);

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api/audits');
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((a: any) => ({
          id: a.idSesion,
          timestamp: a.fechaHora ? a.fechaHora.replace('T', ' ').substring(0, 19) : 'N/A',
          name: a.nombreAuditoria,
          details: a.detalleCambio
        }));
        // Reverse to show newest first if they are chronological
        setAudits(mapped.reverse());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  const filteredAudits = audits;

  return (
    <div className="space-y-6 font-sans mt-4">

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] flex flex-col md:flex-row gap-3 justify-between items-center">
          <h3 className="font-sans font-bold text-base text-[#0F172A]">Registros de Auditoría</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] font-sans font-bold text-[#64748B] uppercase">
                <th className="p-4 pl-6">ID de Sesión</th>
                <th className="p-4">Fecha y Hora</th>
                <th className="p-4">Nombre de Auditoría</th>
                <th className="p-4 pr-6">Detalles del Cambio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px] font-medium text-[#1E293B]">
              {filteredAudits.length > 0 ? (
                filteredAudits.map((audit) => (
                  <tr key={audit.id + audit.timestamp} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-4 pl-6 text-[#64748B]">{audit.id}</td>
                    <td className="p-4 font-semibold text-[#0F172A]">{audit.timestamp}</td>
                    <td className="p-4"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-sans font-semibold tracking-wide bg-blue-50 text-blue-700 border border-blue-200`}>{audit.name}</span></td>
                    <td className="p-4 pr-6 text-[#475569]">{audit.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#64748B] font-sans">
                    No se encontraron registros de auditoría.
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
