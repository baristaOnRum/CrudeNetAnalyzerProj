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
  const [engineStatus, setEngineStatus] = useState<string>('Enforcing SSL tunnel encryption.');
  const [runningSecDiagnostic, setRunningSecDiagnostic] = useState(false);

  const triggerDiagnostic = () => {
    setRunningSecDiagnostic(true);
    setEngineStatus('Analyzing SSL socket integrity & scanning virtual ports...');

    setTimeout(() => {
      setRunningSecDiagnostic(false);
      setEngineStatus('Optimal secure layer validated. Rotation of AES encryption keys SUCCESS.');
      alert('Security Handshake Complete: 0 leaks identified, SOC2 compliance holds active.');
    }, 1200);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Title block banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-3xl">settings</span>
            System Configuration
          </h1>
          <p className="text-sm text-[#42474e] mt-1 font-sans">
            Fine-tune packet simulation buffers, enforce access profiles, and test node compliance parameters.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Configurations inputs taking span 8 */}
        <section className="col-span-12 lg:col-span-8 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-base text-[#191c1e] pb-3 border-b border-slate-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">admin_panel_settings</span>
            Security & Performance Tuners
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Performance Sim Speed selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
                Packet Simulation speed
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
                    {spd.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-1">
                Enforcing shorter buffer sleeps pushes streaming virtual packets faster onto visual table grids.
              </p>
            </div>

            {/* Security Profile levels input selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
                Secure node Override
              </label>
              <select
                value={securityLevel}
                onChange={(e) => setSecurityLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 outline-none font-sans"
              >
                <option value="LEVEL_4_ROOT">LEVEL 4 ROOT (Total write & user profiles control)</option>
                <option value="LEVEL_3_WRITE">LEVEL 3 WRITE ACCESS (Intermediate troubleshooting)</option>
                <option value="LEVEL_1_READ">LEVEL 1 READ-ONLY (Auditing and sessions export)</option>
              </select>
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <label className="text-[11px] font-mono tracking-wider font-extrabold text-slate-400 uppercase block">
              Node Cryptography Core
            </label>

            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-xs font-bold text-slate-800">Dynamic SSL Rotation check</p>
                <p className="text-[11px] text-[#42474e] mt-1 font-mono">{engineStatus}</p>
              </div>

              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={triggerDiagnostic}
                  disabled={runningSecDiagnostic}
                  className="px-4 py-2 bg-primary hover:bg-opacity-95 text-white rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {runningSecDiagnostic ? 'TESTING ENGINE...' : 'ROTATE SSL KEYS'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Informational settings cards taking span 4 */}
        <aside className="col-span-12 lg:col-span-4 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-5 flex flex-col select-none">
          <h3 className="font-bold text-base text-[#191c1e] pb-3 border-b border-slate-100">
            System Operations
          </h3>

          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Node Identifier</span>
              <p className="text-xs font-bold font-mono text-slate-800">NODE-01-ALPHA</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Status state</span>
              <p className="text-xs font-bold text-green-600 flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full bg-green-500 glow-pulse" />
                Heartbeat Verified
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Virtual Client Port</span>
              <p className="text-xs font-bold font-mono text-slate-800">Local port 3000 mapping</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            {/* Destructive Disconnect node uplink action button */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Disconnect node access server? You will return to System Access portal.")) {
                  onLogout();
                }
              }}
              className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white font-sans text-xs font-bold tracking-wide rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-100 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px]">power_off</span>
              DISCONNECT UPLINK
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
