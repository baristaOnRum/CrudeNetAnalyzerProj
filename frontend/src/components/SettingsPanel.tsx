/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface SettingsPanelProps {
  speedMode: 'normal' | 'fast' | 'turbo';
  onSpeedChange: (speed: 'normal' | 'fast' | 'turbo') => void;
  onLogout: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  speedMode,
  onSpeedChange,
  onLogout
}) => {
  const [securityLevel, setSecurityLevel] = useState<string>('LEVEL_4_ROOT');
  const [engineStatus, setEngineStatus] = useState<string>('Forzando el cifrado del túnel SSL.');
  const [runningSecDiagnostic, setRunningSecDiagnostic] = useState(false);

  const triggerDiagnostic = () => {
    setRunningSecDiagnostic(true);
    setEngineStatus('Analizando la integridad del socket SSL y escaneando los puertos virtuales...');

    setTimeout(() => {
      setRunningSecDiagnostic(false);
      setEngineStatus('Capa de seguridad optimizada validada. Rotación exitosa de claves de cifrado AES.');
      alert('Protocolo de seguridad completado: 0 filtraciones identificadas, cumplimiento de SOC2 activo.');
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Title block banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">settings</span>
            Configuración del Sistema
          </h1>
          <p className="text-sm text-[#42474e] mt-1 font-sans">
            Ajuste los búferes de simulación de paquetes, configure perfiles de acceso y pruebe los parámetros de cumplimiento del sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Configurations inputs taking span 8 */}
        <section className="col-span-12 lg:col-span-8 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-base text-[#191c1e] pb-3 border-b border-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">admin_panel_settings</span>
            Ajustes de Seguridad y Rendimiento
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Performance Sim Speed selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
                Velocidad de simulación de paquetes
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'fast', 'turbo'] as const).map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => onSpeedChange(spd)}
                    className={`py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all text-center ${
                      speedMode === spd
                        ? 'bg-primary text-white border-primary shadow-sm font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {spd === 'normal' ? 'NORMAL' : spd === 'fast' ? 'RÁPIDO' : 'TURBO'}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-1">
                Forzar tiempos de espera más cortos del búfer introduce paquetes virtuales más rápido en la tabla visual.
              </p>
            </div>

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
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Núcleo de Criptografía del Sistema
            </label>

            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs font-bold text-slate-800">Verificación Dinámica de Rotación SSL</p>
                <p className="text-[11px] text-[#42474e] mt-1 font-mono">{engineStatus}</p>
              </div>

              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={triggerDiagnostic}
                  disabled={runningSecDiagnostic}
                  className="px-4 py-2 bg-primary hover:bg-opacity-95 text-white rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {runningSecDiagnostic ? 'PROBANDO MOTOR...' : 'ROTAR CLAVES SSL'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Informational settings cards taking span 4 */}
        <aside className="col-span-12 lg:col-span-4 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-5 flex flex-col select-none">
          <h3 className="font-bold text-base text-[#191c1e] pb-3 border-b border-slate-100">
            Operaciones del Sistema
          </h3>

          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Identificador unificado</span>
              <p className="text-xs font-bold font-mono text-slate-800">SISTEMA-01-ALPHA</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Estado</span>
              <p className="text-xs font-bold text-green-600 flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full bg-green-500 glow-pulse" />
                Latido Verificado
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Puerto de Cliente Virtual</span>
              <p className="text-xs font-bold font-mono text-slate-800">Redirección a puerto local 3000</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            {/* Destructive Disconnect connection action button */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm("¿Desconectar el servidor de acceso? Volverá al portal de acceso del sistema.")) {
                  onLogout();
                }
              }}
              className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-sans text-xs font-bold tracking-wide rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-100 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">power_off</span>
              DESCONECTAR CONEXIÓN
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
