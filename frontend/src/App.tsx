/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AppView } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { PacketManagement } from './components/PacketManagement';
import { NetworkAnalyzer } from './components/NetworkAnalyzer';
import { ReportsConsole } from './components/ReportsConsole';
import { UserManager } from './components/UserManager';
import { AuditExplorer } from './components/AuditExplorer';
import { SettingsPanel } from './components/SettingsPanel';
import { ErrorBoundary } from './components/ErrorBoundary';

// Capturar promesas rechazadas sin manejador para evitar crash del renderer en Electron
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Global] Unhandled Promise Rejection:', event.reason);
    event.preventDefault(); // Impide que Electron mate el renderer
  });
}

export default function App() {
  const [view, setView] = useState<AppView>('uplink');
  const [session, setSession] = useState({ name: 'Invitado', role: 'OBSERVADOR', token: '' });
  const [activeAnalysisId, setActiveAnalysisId] = useState<number | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const handleLoginSuccess = (user: { sourceId: string; role: string; token: string }) => {
    setSession({ name: user.sourceId, role: user.role, token: user.token });
    // After logging in, redirect to packets which represents Page 1 live streaming packets
    setView('packets');
  };

  const handleLogout = async () => {
    if (session.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: session.token
        });
      } catch (e) {}
    }
    
    // Cleanup any lingering SweetAlert2 modals that might trap focus in the Login screen
    import('sweetalert2').then(({ default: Swal }) => {
       Swal.close();
    });

    setSession({ name: 'Invitado', role: 'OBSERVADOR', token: '' });
    setView('uplink');
    setActiveAnalysisId(null);
  };



  const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  const WARNING_MS = 20 * 1000; // 20 seconds
  const lastActivityTimeRef = React.useRef<number>(Date.now());
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  useEffect(() => {
    if (view === 'uplink') return;

    const resetTimer = () => {
      lastActivityTimeRef.current = Date.now();
      setShowInactivityWarning(prev => {
        if (prev) return false;
        return prev;
      });
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetTimer));

    const interval = setInterval(() => {
      if (isMonitoring || activeAnalysisId !== null) {
        lastActivityTimeRef.current = Date.now();
        setShowInactivityWarning(prev => {
          if (prev) return false;
          return prev;
        });
        return;
      }

      const now = Date.now();
      const timeInactive = now - lastActivityTimeRef.current;
      const timeRemaining = TIMEOUT_MS - timeInactive;

      if (timeRemaining <= 0) {
        handleLogout();
        setShowInactivityWarning(false);
        import('sweetalert2').then(({ default: Swal }) => {
          Swal.fire({
            title: 'Sesión Expirada',
            text: 'Su sesión ha sido cerrada por inactividad.',
            icon: 'info',
            confirmButtonColor: '#4F46E5'
          });
        });
      } else if (timeRemaining <= WARNING_MS) {
        setShowInactivityWarning(prev => {
           if (!prev) return true;
           return prev;
        });
      }
    }, 1000);

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, resetTimer));
      clearInterval(interval);
    };
  }, [view, isMonitoring, activeAnalysisId, session.token]);

  // Render view screen selector
  const renderContent = () => {
    switch (view) {
      case 'packets':
        return <PacketManagement activeAnalysisId={activeAnalysisId} />;
      case 'dashboard':
        return <NetworkAnalyzer activeAnalysisId={activeAnalysisId} setActiveAnalysisId={setActiveAnalysisId} isMonitoring={isMonitoring} setIsMonitoring={setIsMonitoring} />;
      case 'reports':
        return <ReportsConsole />;
      case 'audits':
        return <AuditExplorer />;
      case 'users':
        return <UserManager currentUserRole={session.role} />;
      case 'settings':
        return <SettingsPanel currentUserRole={session.role} onConfigChange={handleLogout} />;
      default:
        return <PacketManagement activeAnalysisId={activeAnalysisId} />;
    }
  };

  if (view === 'uplink') {
    return (
      <ErrorBoundary>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#f8f9ff] text-[#191c1e] font-sans antialiased relative">
        {/* Sidebar navigation */}
        <Sidebar
          currentView={view}
          onViewChange={setView}
          userName={session.name}
          userRole={session.role}
          onLogout={handleLogout}
          activeAnalysisId={activeAnalysisId}
          isMonitoring={isMonitoring}
        />

        {/* Main container with offset left sidebar width (64 / 16rem ) */}
        <div className="pl-64 flex flex-col min-h-screen">
          {/* Top Header navbar */}
          <Header
            currentView={view}
          />

          {/* Core content wrapper area with top header offset padding */}
          <main className="flex-1 mt-16 p-6 md:p-8 animate-[fadeIn_0.2s_ease-out] overflow-y-auto max-w-[1600px] w-full mx-auto pb-16">
            <ErrorBoundary>
              {renderContent()}
            </ErrorBoundary>
          </main>
        </div>

        {/* Modal Inactividad */}
        {showInactivityWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-xl p-6 w-full max-w-sm m-4 relative animate-[slideUp_0.2s_ease-out] transform">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-[32px]">hourglass_bottom</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Inactividad Detectada</h3>
                  <p className="text-sm text-slate-500 mt-1">Su sesión expirará en breve por falta de actividad.</p>
                  <p className="text-xs font-mono font-bold text-amber-600 mt-2">Mueva el ratón o presione una tecla para mantener la sesión.</p>
                </div>
                <button
                  onClick={() => {
                    setLastActivityTime(Date.now());
                    setShowInactivityWarning(false);
                  }}
                  className="w-full mt-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  Extender Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

