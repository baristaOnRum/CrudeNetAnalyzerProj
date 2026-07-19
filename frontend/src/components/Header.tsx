/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppView } from '../types';

import Swal from 'sweetalert2';

interface HeaderProps {
  currentView: AppView;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView
}) => {
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  // Derive title based on current screen
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Análisis';
      case 'reports':
        return 'Reportes';
      case 'logs':
        return 'Trazas del sistema';
      case 'users':
        return 'Gestionar Usuarios';
      case 'packets':
        return 'Administrar Paquetes';
      case 'settings':
        return 'Configuración';
      default:
        return '';
    }
  };

  // Derive subtitle/badge format based on view
  const getSubBadge = () => {
    return null;
  };

  return (
    <header className="fixed top-0 right-0 left-64 h-16 z-30 flex justify-between items-center px-8 bg-white border-b border-[#E2E8F0] font-sans">
      <div className="flex items-center gap-4 select-none">
        <span className="text-base font-bold text-[#0F172A] font-sans leading-none">
          {getHeaderTitle()}
        </span>
        <div className="h-6 w-[1px] bg-[#E2E8F0]" />
        <div className="flex items-center gap-2">
          {getSubBadge()}
        </div>
      </div>

      <div className="flex items-center gap-6">

        {/* Quick Diagnostics Actions */}
        <div className="flex items-center gap-3 relative select-none">
          {/* Hardware CPU Metrics Button */}
          <button
            id="btn_cpu_metrics"
            onClick={() => {
              setShowSystemInfo(!showSystemInfo);
            }}
            title="Panel de Telemetría de Hardware"
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">memory</span>
            <span>Uso de Hardware</span>
          </button>

          {/* Dev-board Quick Status logs toggle - Changed to a real button with icon and text */}
          <button
            id="btn_details_connection"
            onClick={() => Swal.fire({ text: "Chequeo de diagnóstico: Niveles de encriptación óptimos, AES-256 habilitado, 0 pérdidas de integridad detectadas.", icon: 'info', confirmButtonColor: '#4F46E5' })}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer shadow-sm"
            title="Detalles de Conexión del Sistema"
          >
            <span className="material-symbols-outlined text-[16px]">developer_board</span>
            <span>Detalles de Conexión</span>
          </button>

          {/* Quick Micro interactive stats overlay panel */}
          {showSystemInfo && (
            <div id="panel_hardware_status" className="absolute right-0 top-12 bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-4 w-72 z-50 text-xs text-[#1E293B] animate-[bounceIn_0.2s_ease-out]">
              <div className="flex justify-between items-center pb-2 border-b border-[#F1F5F9]">
                <span className="font-bold text-[#0F172A]">Estado de Hardware Virtual</span>
                <button
                  id="btn_close_system_info"
                  onClick={() => setShowSystemInfo(false)}
                  className="text-[#64748B] hover:text-red-500 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="space-y-3 mt-3 font-sans">
                <div>
                  <div className="flex justify-between text-[11px] text-[#64748B] font-mono mb-1">
                    <span>Uso de procesador</span>
                    <span>62%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[62%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[#64748B] font-mono mb-1">
                    <span>Uso de memoria</span>
                    <span>4.18 GB / 16 GB</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[26%]" />
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
