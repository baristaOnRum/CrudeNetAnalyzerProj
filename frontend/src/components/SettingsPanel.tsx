/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Swal from 'sweetalert2';

interface SettingsPanelProps {
  onLogout: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onLogout
}) => {
  const [dbHost, setDbHost] = useState('127.0.0.1');
  const [dbPort, setDbPort] = useState('3306');
  const [dbName, setDbName] = useState('netanalyzer_db');
  const [dbUser, setDbUser] = useState('root');
  const [dbPass, setDbPass] = useState('');

  const handleSaveConfig = () => {
    Swal.fire({
      title: 'Configuración Guardada',
      text: 'La configuración de la base de datos ha sido actualizada.',
      icon: 'success',
      confirmButtonColor: '#4F46E5'
    });
  };

  return (
    <div className="space-y-6 font-sans select-none max-w-4xl mx-auto mt-4">
      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-base text-[#191c1e] pb-3 border-b border-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">database</span>
          Configuración de Base de Datos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Host / IP
            </label>
            <input
              type="text"
              value={dbHost}
              onChange={(e) => setDbHost(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Puerto
            </label>
            <input
              type="text"
              value={dbPort}
              onChange={(e) => setDbPort(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Nombre de la Base de Datos
            </label>
            <input
              type="text"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Usuario
            </label>
            <input
              type="text"
              value={dbUser}
              onChange={(e) => setDbUser(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Contraseña
            </label>
            <input
              type="password"
              value={dbPass}
              onChange={(e) => setDbPass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans"
            />
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={handleSaveConfig}
            className="py-2.5 px-6 bg-primary hover:bg-opacity-90 text-white font-sans text-xs font-bold tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">save</span>
            GUARDAR CONFIGURACIÓN
          </button>
          
          <button
            type="button"
            onClick={() => {
              Swal.fire({
                title: '¿Cerrar Sesión?',
                text: 'Volverá al portal de acceso del sistema.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4F46E5',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar'
              }).then((result) => {
                if (result.isConfirmed) {
                  onLogout();
                }
              });
            }}
            className="py-2.5 px-6 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-sans text-xs font-bold tracking-wide rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">power_off</span>
            CERRAR SESIÓN
          </button>
        </div>
      </div>
    </div>
  );
};
