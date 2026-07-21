/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { DatabaseSettings } from './DatabaseSettings';
import { Modal } from './common/Modal';

interface LoginScreenProps {
  onLoginSuccess: (user: { sourceId: string; role: string; token: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [sourceId, setSourceId] = useState('SYS-01-LOCAL');
  const [password, setPassword] = useState('ADMIN-ACCESS-SECRET-KEY');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [showDbModal, setShowDbModal] = useState(false);
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !password) {
      setStatus('error');
      return;
    }

    setStatus('connecting');

    setTimeout(async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: sourceId, password: password })
        });
        
        if (response.ok) {
          const data = await response.json();
          const roleStr = data.role === 'ADMIN' ? 'Administrador' : (data.role === 'VIEWER' ? 'Observador' : 'Analista');
          const role = sourceId === 'Invitado' ? 'Invitado' : roleStr;
          const token = data.token; // Guardar el token validado desde el backend
          setStatus('success');
          setTimeout(() => {
            onLoginSuccess({ sourceId, role, token });
          }, 600);
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    }, 850);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#F8FAFC] overflow-hidden font-sans">
      {/* Subtle Sleek Ambient Glow */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none" />

      <main className="w-full max-w-[420px] relative z-10 flex flex-col justify-center">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] font-sans flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">shield_lock</span>
            Sistema de Asistencia al Monitoreo y Auditoria
          </h1>
        </div>

        {/* Central Login Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-8 relative overflow-hidden transition-all duration-300">
          <header className="mb-6 border-b border-[#F1F5F9] pb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Acceso al Sistema</h2>
            <p className="text-xs text-[#64748B] mt-1">
              Autorice la conexión del sistema al analizador de paquetes cifrados.
            </p>
          </header>

          <form className="space-y-5" onSubmit={handleConnect}>
            {/* System Identifier */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold text-[#64748B] uppercase flex justify-between tracking-wider" htmlFor="source_id">
                <span>Identificador del Sistema {status === 'error' && (!sourceId || (sourceId && password)) && <span className="text-red-500 text-[12px] ml-1">*</span>}</span>
                <span className="material-symbols-outlined text-[14px]">router</span>
              </label>
              <input 
                id="source_id"
                name="source_id"
                type="text"
                placeholder="ej. SYS-01-LOCAL"
                required={false}
                disabled={status === 'connecting' || status === 'success'}
                value={sourceId}
                onChange={(e) => { setSourceId(e.target.value); setStatus('idle'); }}
                className="w-full bg-[#F1F5F9] border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-4 py-2.5 font-mono text-xs text-[#1E293B] transition-all duration-150 outline-none placeholder-[#94A3B8]"
              />
            </div>

            {/* Access Key */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold text-[#64748B] uppercase flex justify-between tracking-wider" htmlFor="password">
                <span>Clave de Acceso {status === 'error' && (!password || (sourceId && password)) && <span className="text-red-500 text-[12px] ml-1">*</span>}</span>
                <span className="material-symbols-outlined text-[14px]">key</span>
              </label>
              <input 
                id="password"
                name="password"
                type="password"
                placeholder="••••••••••••••••"
                required={false}
                disabled={status === 'connecting' || status === 'success'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setStatus('idle'); }}
                className="w-full bg-[#F1F5F9] border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-4 py-2.5 font-mono text-xs text-[#1E293B] transition-all duration-150 outline-none placeholder-[#94A3B8]"
              />
              <div className="flex justify-end mt-1">
                <button 
                  type="button"
                  onClick={() => Swal.fire({ text: 'Credenciales de acceso sugeridas: Identificador del sistema es "SYS-01-LOCAL", la clave de acceso puede ser cualquier clave.', icon: 'info', confirmButtonColor: '#4F46E5' })}
                  className="font-sans text-[9px] font-semibold text-[#818cf8] hover:text-primary transition-colors uppercase cursor-pointer"
                >
                  Resolver Clave
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button 
              type="submit"
              disabled={status === 'connecting' || status === 'success'}
              className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 group transition-all duration-155 cursor-pointer ${
                status === 'success' 
                  ? 'bg-green-600 text-white' 
                  : status === 'connecting'
                    ? 'bg-black text-white cursor-wait'
                    : 'bg-primary text-white hover:bg-opacity-95 active:scale-[0.98]'
              }`}
            >
              {status === 'connecting' ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Iniciando sesión...
                </>
              ) : status === 'success' ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Sesión Iniciada
                </>
              ) : (
                <>
                  Iniciar sesión
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[18px]">login</span>
                </>
              )}
            </button>
          </form>

          {/* Guest Session Divider and Button */}
          <div className="mt-5 pt-4 border-t border-[#F1F5F9] flex flex-col gap-2">
            <button
              type="button"
              disabled={status === 'connecting' || status === 'success'}
              onClick={async () => {
                setStatus('connecting');
                try {
                  const response = await fetch('/api/auth/guest', { method: 'POST' });
                  if (response.ok) {
                    const data = await response.json();
                    setStatus('success');
                    setTimeout(() => {
                      onLoginSuccess({
                        sourceId: 'Invitado',
                        role: 'Invitado',
                        token: data.token || 'guest-token'
                      });
                    }, 500);
                  } else {
                    setStatus('error');
                  }
                } catch (e) {
                  setStatus('error');
                }
              }}
              className="w-full py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-amber-600">person_play</span>
              Continuar como Invitado
            </button>

            <button
              type="button"
              onClick={() => setShowDbModal(true)}
              className="w-full py-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-600">database</span>
              Configurar Base de Datos
            </button>
          </div>
        </div>

        {/* Bottom Footer Links */}
        <footer className="mt-8 text-center space-y-4">
          <p className="text-xs text-[#64748B]">
            ¿Terminal virtual no registrado? 
            <button 
              onClick={() => Swal.fire({ text: "Credenciales sugeridas: identificador 'SYS-01-LOCAL', elija cualquier clave de acceso para obtener acceso raíz.", icon: 'info', confirmButtonColor: '#4F46E5' })} 
              className="text-primary font-bold hover:underline ml-1 cursor-pointer"
            >
              Solicitar Acceso
            </button>
          </p>
          <div className="flex items-center justify-center gap-4 border-t border-[#E2E8F0] pt-4">
            <div className="flex items-center gap-1 text-[#94A3B8]">
              <span className="material-symbols-outlined text-[16px]">memory</span>
              <span className="font-mono text-[10px] tracking-wider">v2.4.0-Estable</span>
            </div>
            <div className="flex items-center gap-1 text-[#94A3B8]">
              <span className="material-symbols-outlined text-[16px]">public</span>
              <span className="font-mono text-[10px] tracking-wider">Mapa Global</span>
            </div>
          </div>
        </footer>
      </main>

      <Modal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
        title="Configuración de Base de Datos Local"
        subtitle="Configure los parámetros de conexión antes de iniciar sesión. Requiere reinicio del backend."
        icon="database"
      >
        <DatabaseSettings isLoginContext={true} onConfigChange={() => setShowDbModal(false)} />
      </Modal>

      {/* Decorative Corner for Tech Aesthetic */}
      <div className="fixed bottom-6 right-6 opacity-30 pointer-events-none hidden md:block">
        <div className="w-56 h-56 border-r border-b border-primary/20 relative">
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary/5" />
          <div className="absolute bottom-10 right-10 font-mono text-[10px] text-primary/70 tracking-widest">
            SEC_LEVEL_04
          </div>
        </div>
      </div>
    </div>
  );
};
