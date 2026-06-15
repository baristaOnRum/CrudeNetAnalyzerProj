/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  currentNodeId: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  currentNodeId,
  onLogout
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full z-40 flex flex-col bg-white border-r border-[#E2E8F0] w-64 select-none font-sans">
      {/* Brand Header */}
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary font-sans flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">router</span>
          NetWatch Pro
        </h1>
        <p className="font-mono text-[10px] uppercase font-bold text-[#64748B] mt-1 tracking-wider">
          Node: {currentNodeId || 'Admin Node 01'}
        </p>
      </div>

      {/* Navigation items list */}
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {/* Análisis */}
        <button
          onClick={() => onViewChange('dashboard')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${
            currentView === 'dashboard'
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
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${
            currentView === 'reports'
              ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
              : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">analytics</span>
          <span className="text-sm">Reportes</span>
        </button>

        {/* Ver Registros */}
        <button
          onClick={() => onViewChange('logs')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${
            currentView === 'logs'
              ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
              : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">receipt_long</span>
          <span className="text-sm">Ver Registros</span>
        </button>

        {/* Gestionar Usuarios */}
        <button
          onClick={() => onViewChange('users')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${
            currentView === 'users'
              ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
              : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">group</span>
          <span className="text-sm">Gestionar Usuarios</span>
        </button>

        {/* Administrar Paquetes */}
        <button
          onClick={() => onViewChange('packets')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${
            currentView === 'packets'
              ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
              : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          <span className="text-sm">Administrar Paquetes</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onViewChange('settings')}
          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-150 cursor-pointer ${
            currentView === 'settings'
              ? 'bg-[#F1F5F9] text-[#0F172A] font-semibold'
              : 'text-[#64748B] hover:bg-[#F1F5F9]/50 hover:text-[#0F172A]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="text-sm">Settings</span>
        </button>
      </nav>

      {/* User profile section bottom layout */}
      <div className="p-4 border-t border-[#E2E8F0] mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center font-bold text-sm border border-[#E2E8F0]">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-semibold truncate text-[#1E293B]">Admin</p>
            <p className="text-[9px] font-mono font-bold tracking-wider text-[#64748B] uppercase">
              LVL 4 ACCESS
            </p>
          </div>
          <button 
            onClick={() => {
              if (window.confirm("Are you sure you want to log out and close node uplink?")) {
                onLogout();
              }
            }}
            title="Disconnect node uplink"
            className="p-1 hover:text-[#4F46E5] rounded-md transition-colors cursor-pointer text-[#64748B]"
          >
            <span className="material-symbols-outlined text-md">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
