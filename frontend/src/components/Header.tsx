/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppView } from '../types';

import Swal from 'sweetalert2';

interface HeaderProps {
  currentView: AppView;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeAnalysisId?: number | null;
  isMonitoring?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  activeAnalysisId,
  isMonitoring
}) => {
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  // ... (keeping existing getHeaderTitle and getSubBadge)
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
        return 'Sistema';
    }
  };

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
          {activeAnalysisId && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-widest uppercase ${isMonitoring ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              <span className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
              Sesión {activeAnalysisId} {isMonitoring && 'REC'}
            </div>
          )}
      </div>
    </header>
  );
};
