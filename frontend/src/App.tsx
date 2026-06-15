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
  const [view, setView] = useState<AppView>('packets');
  const [currentSourceId, setCurrentSourceId] = useState('SYS-01-LOCAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [speedMode, setSpeedMode] = useState<'normal' | 'fast' | 'turbo'>('normal');

  const handleLoginSuccess = (sourceId: string) => {
    setCurrentSourceId(sourceId);
    // After logging in, redirect to packets which represents Page 1 live streaming packets
    setView('packets');
  };

  const handleLogout = () => {
    setView('uplink');
    setSearchQuery('');
  };

  const handleSpeedToggle = () => {
    setSpeedMode((prev) => {
      if (prev === 'normal') return 'fast';
      if (prev === 'fast') return 'turbo';
      return 'normal';
    });
  };

  // Render view screen selector
  const renderContent = () => {
    switch (view) {
      case 'packets':
        return <PacketManagement searchQuery={searchQuery} speedMode={speedMode} />;
      case 'dashboard':
        return <NetworkAnalyzer searchQuery={searchQuery} />;
      case 'reports':
        return <ReportsConsole />;
      case 'logs':
        return <LogsExplorer searchQuery={searchQuery} />;
      case 'users':
        return <UserManager searchQuery={searchQuery} />;
      case 'settings':
        return (
          <SettingsPanel
            speedMode={speedMode}
            onSpeedChange={setSpeedMode}
            onLogout={handleLogout}
          />
        );
      default:
        return <PacketManagement searchQuery={searchQuery} speedMode={speedMode} />;
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
        currentSourceId={currentSourceId}
        onLogout={handleLogout}
      />

      {/* Main container with offset left sidebar width (64 / 16rem ) */}
      <div className="pl-64 flex flex-col min-h-screen">
        {/* Top Header navbar */}
        <Header
          currentView={view}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSpeedToggle={handleSpeedToggle}
          speedMode={speedMode}
        />

        {/* Core content wrapper area with top header offset padding */}
        <main className="flex-1 mt-16 p-6 md:p-8 animate-[fadeIn_0.2s_ease-out] overflow-y-auto max-w-[1600px] w-full mx-auto pb-16">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

