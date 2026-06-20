/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AppView } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { PacketManagement } from './components/PacketManagement';
import { NetworkAnalyzer } from './components/NetworkAnalyzer';
import { ReportsConsole } from './components/ReportsConsole';
import { UserManager } from './components/UserManager';
import { LogsExplorer } from './components/LogsExplorer';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  const [view, setView] = useState<AppView>('uplink');
  const [session, setSession] = useState({ name: 'Invitado', role: 'OBSERVADOR', token: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const handleLoginSuccess = (user: { sourceId: string; role: string; token: string }) => {
    setSession({ name: user.sourceId, role: user.role, token: user.token });
    // After logging in, redirect to packets which represents Page 1 live streaming packets
    setView('packets');
  };

  const handleLogout = () => {
    setView('uplink');
    setSearchQuery('');
  };



  // Render view screen selector
  const renderContent = () => {
    switch (view) {
      case 'packets':
        return <PacketManagement searchQuery={searchQuery} />;
      case 'dashboard':
        return <NetworkAnalyzer searchQuery={searchQuery} />;
      case 'reports':
        return <ReportsConsole />;
      case 'logs':
        return <LogsExplorer searchQuery={searchQuery} />;
      case 'users':
        return <UserManager searchQuery={searchQuery} currentUserRole={session.role} />;
      case 'settings':
        return (
          <SettingsPanel
            onLogout={handleLogout}
          />
        );
      default:
        return <PacketManagement searchQuery={searchQuery} />;
    }
  };

  if (view === 'uplink') {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#191c1e] font-sans antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        currentView={view}
        onViewChange={setView}
        userName={session.name}
        userRole={session.role}
        onLogout={handleLogout}
      />

      {/* Main container with offset left sidebar width (64 / 16rem ) */}
      <div className="pl-64 flex flex-col min-h-screen">
        {/* Top Header navbar */}
        <Header
          currentView={view}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Core content wrapper area with top header offset padding */}
        <main className="flex-1 mt-16 p-6 md:p-8 animate-[fadeIn_0.2s_ease-out] overflow-y-auto max-w-[1600px] w-full mx-auto pb-16">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

