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


      </div>
    </header>
  );
};
