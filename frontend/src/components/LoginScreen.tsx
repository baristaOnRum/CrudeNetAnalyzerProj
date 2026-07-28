/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { DatabaseSettings } from './DatabaseSettings';
import { Modal } from './common/Modal';
import logoImg from '../assets/Picture1.png';

interface LoginScreenProps {
  onLoginSuccess: (user: { sourceId: string; role: string; token: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [sourceId, setSourceId] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [showDbModal, setShowDbModal] = useState(false);
  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !password) {
      setStatus('error');
      Swal.fire({
        title: 'Campos Requeridos',
        text: 'Por favor ingrese el usuario y la contraseña.',
        icon: 'warning',
        confirmButtonColor: '#0059B3'
      });
      return;
    }

    setStatus('connecting');
    Swal.fire({
      title: 'Iniciando sesión...',
      text: 'Verificando credenciales de acceso...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setTimeout(async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: sourceId, password: password })
        });
        
        if (response.ok) {
          const data = await response.json();
          const role = sourceId === 'Invitado' ? 'OBSERVADOR' : data.role;
          const token = data.token; // Guardar el token validado desde el backend
          setStatus('success');
          Swal.close();
          setTimeout(() => {
            onLoginSuccess({ sourceId, role, token });
          }, 600);
        } else {
          setStatus('error');
          Swal.fire({
            title: 'Credenciales Incorrectas',
            text: 'El nombre de usuario o la contraseña ingresados son incorrectos. Por favor, verifique e intente nuevamente.',
            icon: 'error',
            confirmButtonColor: '#0059B3'
          });
        }
      } catch (err) {
        setStatus('error');
        Swal.fire({
          title: 'Error de Conexión',
          text: 'No se pudo establecer conexión con el servicio de autenticación.',
          icon: 'error',
          confirmButtonColor: '#0059B3'
        });
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
          <img src={logoImg} alt="PGP Telecom Logo" className="h-16 mx-auto mb-3 object-contain" />
          <h1 className="text-3xl font-bold tracking-tight text-[#0F172A] font-sans flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">shield_lock</span>
            Sistema de Asistencia al Monitoreo y Auditoria
          </h1>
        </div>

        {/* Central Login Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-8 relative overflow-hidden transition-all duration-300">
          <header className="mb-6 border-b border-[#F1F5F9] pb-4 text-center">
            <h2 className="text-lg font-bold text-[#0F172A]">Acceso al Sistema</h2>
          </header>

          <form className="space-y-5" onSubmit={handleConnect}>
            {/* System Identifier */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold text-[#64748B] uppercase flex justify-between tracking-wider" htmlFor="source_id">
                <span>Usuario <span className="text-red-500 text-[10px] font-semibold normal-case ml-1">*</span></span>
              </label>
              <input 
                id="source_id"
                name="source_id"
                type="text"
                placeholder="Juan Pérez"
                required={true}
                disabled={status === 'connecting' || status === 'success'}
                value={sourceId}
                onChange={(e) => { setSourceId(e.target.value); setStatus('idle'); }}
                className="w-full bg-[#F1F5F9] border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-4 py-2.5 font-mono text-xs text-[#1E293B] transition-all duration-150 outline-none placeholder-[#94A3B8]"
              />
            </div>

            {/* Access Key */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold text-[#64748B] uppercase flex justify-between tracking-wider" htmlFor="password">
                <span>Contraseña <span className="text-red-500 text-[10px] font-semibold normal-case ml-1">*</span></span>
              </label>
              <input 
                id="password"
                name="password"
                type="password"
                placeholder=""
                required={true}
                disabled={status === 'connecting' || status === 'success'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setStatus('idle'); }}
                className="w-full bg-[#F1F5F9] border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-4 py-2.5 font-mono text-xs text-[#1E293B] transition-all duration-150 outline-none placeholder-[#94A3B8]"
              />
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
                        role: 'OBSERVADOR',
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


    </div>
  );
};
