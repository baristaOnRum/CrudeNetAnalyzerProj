/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (nodeId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [nodeId, setNodeId] = useState('NODE-01-ALPHA');
  const [accessKey, setAccessKey] = useState('ADMIN-ACCESS-SECRET-KEY');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeId || !accessKey) {
      setStatus('error');
      setLogs(['[ERROR] Connection failed: Missing parameters.']);
      return;
    }

    setStatus('connecting');
    setLogs(['[SYSTEM] Initializing NetWatch uplink protocol...']);

    // Simulate SSL handshake and sequence authorization
    const steps = [
      { text: '[UPLINK] Initiating secure AES-256-GCM handshake...', delay: 250 },
      { text: '[AUTH] Validating access key signature with root domain...', delay: 550 },
      { text: '[PORT] Sockets established on virtual device adapter interface...', delay: 850 },
      { text: '[SEC] TLS 1.3 encryption handshake complete. Access GRANTED.', delay: 1150 }
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, step.text]);
      }, step.delay);
    });

    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        onLoginSuccess(nodeId);
      }, 600);
    }, 1400);
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
            NetWatch Pro
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-primary glow-pulse" />
            <span className="text-[10px] font-sans tracking-wider text-[#64748B] uppercase font-bold">
              Network Security Protocol Active
            </span>
          </div>
        </div>

        {/* Central Login Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-8 relative overflow-hidden transition-all duration-300">
          <header className="mb-6 border-b border-[#F1F5F9] pb-4">
            <h2 className="text-lg font-bold text-[#0F172A]">System Access</h2>
            <p className="text-xs text-[#64748B] mt-1">
              Authorize node connection to encrypted packet analyzer.
            </p>
          </header>

          <form className="space-y-5" onSubmit={handleConnect}>
            {/* Node Identifier */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold text-[#64748B] uppercase flex justify-between tracking-wider" htmlFor="node_id">
                Node Identifier
                <span className="material-symbols-outlined text-[14px]">router</span>
              </label>
              <input 
                id="node_id"
                name="node_id"
                type="text"
                placeholder="e.g. NODE-01-ALPHA"
                required
                disabled={status === 'connecting' || status === 'success'}
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
                className="w-full bg-[#F1F5F9] border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-4 py-2.5 font-mono text-xs text-[#1E293B] transition-all duration-150 outline-none placeholder-[#94A3B8]"
              />
            </div>

            {/* Access Key */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-sans font-bold text-[#64748B] uppercase flex justify-between tracking-wider" htmlFor="access_key">
                Access Key
                <span className="material-symbols-outlined text-[14px]">key</span>
              </label>
              <input 
                id="access_key"
                name="access_key"
                type="password"
                placeholder="••••••••••••••••"
                required
                disabled={status === 'connecting' || status === 'success'}
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="w-full bg-[#F1F5F9] border-none focus:ring-2 focus:ring-primary/20 rounded-lg px-4 py-2.5 font-mono text-xs text-[#1E293B] transition-all duration-150 outline-none placeholder-[#94A3B8]"
              />
              <div className="flex justify-end mt-1">
                <button 
                  type="button"
                  onClick={() => alert('Access credentials suggested: Node Identifier is "NODE-01-ALPHA", Access Key can be any security key.')}
                  className="font-sans text-[9px] font-semibold text-[#818cf8] hover:text-primary transition-colors uppercase cursor-pointer"
                >
                  Troubleshoot Key
                </button>
              </div>
            </div>

            {/* Interactive Terminal log on handshake */}
            {logs.length > 0 && (
              <div className="bg-[#0F172A] text-[#818cf8] font-mono text-[11px] p-4 rounded-lg border border-[#1e293b] space-y-1 max-h-[140px] overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className={log.startsWith('[ERROR]') ? 'text-red-400' : log.startsWith('[SEC]') ? 'text-green-400' : ''}>
                    {log}
                  </div>
                ))}
              </div>
            )}

            {/* Security Check Banner */}
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-container text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-md">shield_lock</span>
              </div>
              <div>
                <p className="font-sans text-[10px] font-bold text-[#0F172A]">Encryption: AES-256 GCM</p>
                <p className="font-sans text-[10px] text-[#64748B]">TLS 1.3 | Secure Socket Layer</p>
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
                    ? 'bg-slate-400 text-white cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-opacity-95 active:scale-[0.98]'
              }`}
            >
              {status === 'connecting' && (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  Establishing Uplink...
                </>
              )}
              {status === 'success' && (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Access Granted
                </>
              )}
              {status === 'idle' && (
                <>
                  Establish Uplink
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[18px]">bolt</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Footer Links */}
        <footer className="mt-8 text-center space-y-4">
          <p className="text-xs text-[#64748B]">
            Unregistered virtual terminal? 
            <button 
              onClick={() => alert("Credentials suggested: node-id 'NODE-01-ALPHA', choose any access key to gain root Access.")} 
              className="text-primary font-bold hover:underline ml-1 cursor-pointer"
            >
              Request Access
            </button>
          </p>
          <div className="flex items-center justify-center gap-4 border-t border-[#E2E8F0] pt-4">
            <div className="flex items-center gap-1 text-[#94A3B8]">
              <span className="material-symbols-outlined text-[16px]">memory</span>
              <span className="font-mono text-[10px] tracking-wider">v2.4.0-Stable</span>
            </div>
            <div className="flex items-center gap-1 text-[#94A3B8]">
              <span className="material-symbols-outlined text-[16px]">public</span>
              <span className="font-mono text-[10px] tracking-wider">Global Map</span>
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
