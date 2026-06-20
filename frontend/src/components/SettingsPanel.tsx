/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface SettingsPanelProps {
  onLogout: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onLogout
}) => {
  const [securityLevel, setSecurityLevel] = useState<string>('LEVEL_4_ROOT');
  
  // Database configuration states
  const [dbType, setDbType] = useState<'sqlite' | 'postgresql'>('sqlite');
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState('');
  const [dbName, setDbName] = useState('netanalyzer.db');
  const [dbUser, setDbUser] = useState('');
  const [dbPass, setDbPass] = useState('');

  useEffect(() => {
    fetch('/api/config/db')
      .then(res => res.json())
      .then(data => {
        if (data && data.url) {
          if (data.url.startsWith('jdbc:postgresql')) {
            setDbType('postgresql');
            // jdbc:postgresql://host:port/dbname
            const parts = data.url.split('://')[1].split('/');
            const hostPort = parts[0].split(':');
            setDbHost(hostPort[0] || '');
            setDbPort(hostPort[1] || '5432');
            setDbName(parts[1] || '');
          } else {
            setDbType('sqlite');
            // jdbc:sqlite:dbname
            const parts = data.url.split(':');
            setDbName(parts[2] || 'netanalyzer.db');
          }
          setDbUser(data.username || '');
          setDbPass(data.password || '');
        }
      })
      .catch(e => console.error("Error cargando configuración", e));
  }, []);

  const handleSaveDbConfig = async () => {
    const url = dbType === 'sqlite' 
        ? `jdbc:sqlite:${dbName}` 
        : `jdbc:postgresql://${dbHost}:${dbPort}/${dbName}`;
        
    const payload = {
        url,
        username: dbUser,
        password: dbPass
    };

    try {
        const response = await fetch('/api/config/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('¡Configuración guardada exitosamente!');
        } else {
            alert('Error al guardar la configuración de la base de datos.');
        }
    } catch (e) {
        alert('Error de conexión con el backend al intentar guardar la configuración.');
    }
  };

  return (
    <div className="space-y-6 font-sans select-none max-w-4xl mx-auto">
      {/* Title block banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">settings</span>
            Configuración del Sistema
          </h1>
          <p className="text-sm text-[#42474e] mt-1 font-sans">
            Ajuste los parámetros de conexión, configure perfiles de acceso y opciones generales de la plataforma.
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="font-bold text-base text-[#191c1e] pb-3 border-b border-slate-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">admin_panel_settings</span>
          Ajustes de Seguridad
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security Profile levels input selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Anulación de Acceso Seguro
            </label>
            <select
              value={securityLevel}
              onChange={(e) => setSecurityLevel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans"
            >
              <option value="LEVEL_4_ROOT">NIVEL 4 RAÍZ (Control total de escritura y perfiles de usuario)</option>
              <option value="LEVEL_3_WRITE">NIVEL 3 ACCESO DE ESCRITURA (Resolución intermedia)</option>
              <option value="LEVEL_1_READ">NIVEL 1 LECTURA (Auditoría y exportación de sesiones)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-4">
          <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">database</span>
            Conexión a Base de Datos
          </label>
          
          <div className="p-5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">Tipo de Base de Datos</label>
                <select 
                  value={dbType} 
                  onChange={e => setDbType(e.target.value as 'sqlite' | 'postgresql')}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans transition-all"
                >
                  <option value="sqlite">SQLite</option>
                  <option value="postgresql">PostgreSQL</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-500">
                  {dbType === 'sqlite' ? 'Ruta / Nombre de Archivo' : 'Nombre de la BD'}
                </label>
                <input 
                  type="text" 
                  value={dbName} 
                  onChange={e => setDbName(e.target.value)} 
                  placeholder="netanalyzer.db" 
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans transition-all" 
                />
              </div>

              {dbType === 'postgresql' && (
                <>
                  <div className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Host</label>
                    <input 
                      type="text" 
                      value={dbHost} 
                      onChange={e => setDbHost(e.target.value)} 
                      placeholder="localhost" 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Puerto</label>
                    <input 
                      type="text" 
                      value={dbPort} 
                      onChange={e => setDbPort(e.target.value)} 
                      placeholder="5432" 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Usuario</label>
                    <input 
                      type="text" 
                      value={dbUser} 
                      onChange={e => setDbUser(e.target.value)} 
                      placeholder="postgres" 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Contraseña</label>
                    <input 
                      type="password" 
                      value={dbPass} 
                      onChange={e => setDbPass(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans transition-all" 
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end pt-2 gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setDbType('sqlite');
                  setDbName('netanalyzer.db');
                  setDbHost('');
                  setDbPort('');
                  setDbUser('');
                  setDbPass('');
                  // Immediately save it
                  fetch('/api/config/db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: 'jdbc:sqlite:netanalyzer.db', username: '', password: '' })
                  }).then(res => {
                    if (res.ok) alert('¡Base de datos interna (SQLite) restaurada exitosamente!');
                  });
                }}
                className="bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-200 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                Restablecer a SQLite
              </button>
              <button 
                type="button" 
                onClick={handleSaveDbConfig}
                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-opacity-95 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("¿Desconectar el servidor de acceso? Volverá al portal de acceso del sistema.")) {
                onLogout();
              }
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
