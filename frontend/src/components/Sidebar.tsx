/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Swal from 'sweetalert2';
import { AppView } from '../types';

import logoImg from '../assets/Picture1.png';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  userName: string;
  userRole: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  userName,
  userRole,
  onLogout
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full z-40 flex flex-col bg-white border-r border-[#E2E8F0] w-64 select-none font-sans">
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-center border-b border-[#F1F5F9]">
        <img src={logoImg} alt="NetAnalyzer Logo" className="h-14 w-auto object-contain mx-auto max-w-full" />
      </div>

      {/* Navigation items list */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {/* Análisis */}
        <button
          onClick={() => onViewChange('dashboard')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${currentView === 'dashboard'
              ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
              : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
            }`}
        >
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span className="text-sm">Análisis</span>
        </button>

        {/* Reportes */}
        <button
          onClick={() => onViewChange('reports')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${currentView === 'reports'
              ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
              : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
            }`}
        >
          <span className="material-symbols-outlined text-[20px]">analytics</span>
          <span className="text-sm">Reportes</span>
        </button>

        {/* Ver Registros */}
        {userRole === 'ADMINISTRADOR' && (
          <button
            onClick={() => onViewChange('audits')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${currentView === 'audits'
                ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
                : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span className="text-sm">Auditorías</span>
          </button>
        )}

        {/* Gestionar Usuarios */}
        {userRole === 'ADMINISTRADOR' && (
          <button
            onClick={() => onViewChange('users')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${currentView === 'users'
                ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
                : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span className="text-sm">Gestionar Usuarios</span>
          </button>
        )}

        {/* Administrar Paquetes */}
        {(userRole === 'ADMINISTRADOR' || userRole === 'ANALISTA') && (
          <button
            onClick={() => onViewChange('packets')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${currentView === 'packets'
                ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
                : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            <span className="text-sm">Administrar Paquetes</span>
          </button>
        )}

        {/* Settings */}
        {(userRole === 'ADMINISTRADOR' || userRole === 'ANALISTA') && (
          <button
            onClick={() => onViewChange('settings')}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${currentView === 'settings'
                ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
                : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
              }`}
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span className="text-sm">Configuración</span>
          </button>
        )}
      </nav>

      {/* User profile section bottom layout */}
      <div className="p-4 border-t border-[#E2E8F0] mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center font-bold text-sm border border-[#E2E8F0]">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold truncate text-[#1E293B]">{userName}</p>
            <p className="text-[9px] font-mono font-bold tracking-wider text-[#64748B] uppercase">
              {userRole}
            </p>
          </div>
          <button
            onClick={() => {
              Swal.fire({
                title: '¿Cerrar sesión?',
                text: '¿Está seguro de que desea cerrar la sesión y cerrar la conexión?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Cancelar'
              }).then((result) => {
                if (result.isConfirmed) {
                  onLogout();
                }
              });
            }}
            title="Desconectar conexión"
            className="p-1 hover:text-[#4F46E5] rounded-md transition-colors cursor-pointer text-[#64748B]"
          >
            <span className="material-symbols-outlined text-md">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
