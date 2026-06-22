/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Swal from 'sweetalert2';

interface LoginScreenProps {
  onLoginSuccess: (user: { sourceId: string; role: string; token: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [sourceId, setSourceId] = useState('SYS-01-LOCAL');
  const [password, setPassword] = useState('ADMIN-ACCESS-SECRET-KEY');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !password) {
      setStatus('error');
      setLogs(['[ERROR] Falló la conexión: Faltan parámetros.']);
      return;
    }

    setStatus('connecting');
    setLogs(['[SISTEMA] Inicializando protocolo de enlace de Sistema de Asistencia al Monitoreo y Auditoria...']);

    // Simulate SSL handshake and sequence authorization
    const steps = [
      { text: '[SISTEMA] Iniciando protocolo seguro AES-256-GCM...', delay: 250 },
      { text: '[AUTORIZACIÓN] Validando firma de clave de acceso con dominio principal...', delay: 550 },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, step.text]);
      }, step.delay);
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
          const role = sourceId === 'admin' ? 'ADMINISTRADOR (Nivel 4)' : 'ANALISTA (Nivel 3)';
          const token = data.token; // Guardar el token validado desde el backend
          setLogs((prev) => [...prev, '[SEGURIDAD] Enlace de cifrado TLS 1.3 completado. Acceso PERMITIDO.']);
          setStatus('success');
          setTimeout(() => {
            onLoginSuccess({ sourceId, role, token });
          }, 600);
        } else {
          setLogs((prev) => [...prev, '[ERROR] Credenciales inválidas. Acceso denegado.']);
          setStatus('error');
        }
      } catch (err) {
        setLogs((prev) => [...prev, '[ERROR] Falló la conexión con el servidor.']);
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
                Identificador del Sistema
                <span className="material-symbols-outlined text-[14px]">router</span>
              </label>
              <input 
                id="source_id"
                name="source_id"
                type="text"
                placeholder="ej. SYS-01-LOCAL"
                required
                disabled={status === 'connecting' || status === 'success'}
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full bg-[#F1F5F9] border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-4 py-2.5 font-mono text-xs text-[#1E293B] transition-all duration-150 outline-none placeholder-[#94A3B8]"
              />
            </div>

            {/* Access Key */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold text-[#64748B] uppercase flex justify-between tracking-wider" htmlFor="password">
                Clave de Acceso
                <span className="material-symbols-outlined text-[14px]">key</span>
              </label>
              <input 
                id="password"
                name="password"
                type="password"
                placeholder="••••••••••••••••"
                required
                disabled={status === 'connecting' || status === 'success'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Interactive Terminal log on handshake */}
            {logs.length > 0 && (
              <div className="bg-[#0F172A] text-[#818cf8] font-mono text-[11px] p-4 rounded-lg border border-[#1e293b] space-y-1 max-h-[140px] overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className={log.startsWith('[ERROR]') ? 'text-red-400' : log.startsWith('[SEGURIDAD]') ? 'text-green-400' : ''}>
                    {log}
                  </div>
                ))}
              </div>
            )}

            {/* Submit Action Button */}
            <button 
              type="submit"
              disabled={status === 'connecting' || status === 'success'}
              className={`w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 group transition-all duration-155 cursor-pointer ${
                status === 'success' 
                  ? 'bg-green-600 text-white' 
                  : status === 'connecting'
                    ? 'bg-primary/50 text-white/80 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-opacity-95 active:scale-[0.98]'
              }`}
            >
              {status === 'connecting' ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Establecer Enlace
                </>
              ) : status === 'success' ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Acceso Permitido
                </>
              ) : (
                <>
                  Establecer Enlace
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[18px]">bolt</span>
                </>
              )}
            </button>
          </form>
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
