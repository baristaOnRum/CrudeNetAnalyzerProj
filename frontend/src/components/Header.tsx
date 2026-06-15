/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSpeedToggle?: () => void;
  speedMode?: 'normal' | 'fast' | 'turbo';
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  onSpeedToggle,
  speedMode = 'normal'
}) => {
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  // Derive title based on current screen
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Análisis de Red';
      case 'reports':
        return 'Generar Reportes';
      case 'logs':
        return 'Explorador de Registros';
      case 'users':
        return 'Gestionar Usuarios';
      case 'packets':
        return 'Administrar Paquetes';
      case 'settings':
        return 'Configuración del Sistema';
      default:
        return 'Analizador "Nombre Pendiente"';
    }
  };

  // Derive subtitle/badge format based on view
  const getSubBadge = () => {
    if (currentView === 'reports') {
      return (
        <span className="text-[10px] font-mono text-primary font-bold tracking-widest bg-primary-container px-2.5 py-1 rounded-full uppercase border border-[#E2E8F0]">
          Consola de Reportes
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs text-primary font-medium bg-[#F0FDF4] text-[#166534] px-2.5 py-1 rounded-full border border-[#D1FAE5]">
        <span className="w-2 h-2 rounded-full bg-[#166534] glow-pulse" />
        Sistema Operativo
      </span>
    );
  };

  // Search input placeholder text helper
  const getSearchPlaceholder = () => {
    switch (currentView) {
      case 'packets':
        return 'Buscar Paquetes...';
      case 'reports':
        return 'Buscar sesiones...';
      case 'users':
        return 'Buscar recursos de sistema...';
      case 'logs':
        return 'Buscar registros de diagnóstico...';
      default:
        return 'Buscar recursos, archivos o tareas...';
    }
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
        {/* Search Input bar */}
        <div className="relative group select-none">
          <input
            type="text"
            placeholder={getSearchPlaceholder()}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-[#F1F5F9] border-none rounded-full pl-5 pr-10 py-1.5 text-[13px] w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[#1E293B] placeholder-[#94A3B8] font-sans"
          />
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[18px]">
            search
          </span>
        </div>

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
            onClick={() => alert("Chequeo de diagnóstico: Niveles de encriptación óptimos, AES-256 habilitado, 0 pérdidas de integridad detectadas.")}
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
                <div>
                  <div className="flex justify-between text-[11px] text-[#64748B] font-mono mb-1">
                    <span>Tasa de paquetes</span>
                    <span>{speedMode === 'turbo' ? '12.4k paq/s' : speedMode === 'fast' ? '4.8k paq/s' : '1.2k paq/s'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[45%]" />
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
