/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSpeedToggle?: () => void;
  speedMode?: 'normal' | 'fast' | 'turbo';
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  onSpeedToggle,
  speedMode = 'normal'
}) => {
  const [showSystemInfo, setShowSystemInfo] = useState(false);

  // Derive title based on current screen
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Network Analyzer';
      case 'reports':
        return 'Network Analyzer';
      case 'logs':
        return 'Logs Explorer';
      case 'users':
        return 'Network Analyzer';
      case 'packets':
        return 'Packet Management';
      case 'settings':
        return 'System Configuration';
      default:
        return 'NetWatch Node';
    }
  };

  // Derive subtitle/badge format based on view
  const getSubBadge = () => {
    if (currentView === 'reports') {
      return (
        <span className="text-[10px] font-mono text-primary font-bold tracking-widest bg-primary-container px-2.5 py-1 rounded-full uppercase border border-[#E2E8F0]">
          Reports Console
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs text-primary font-medium bg-[#F0FDF4] text-[#166534] px-2.5 py-1 rounded-full border border-[#D1FAE5]">
        <span className="w-2 h-2 rounded-full bg-[#166534] glow-pulse" />
        System Operational
      </span>
    );
  };

  // Search input placeholder text helper
  const getSearchPlaceholder = () => {
    switch (currentView) {
      case 'packets':
        return 'Search Packets...';
      case 'reports':
        return 'Search sessions...';
      case 'users':
        return 'Search system resources...';
      case 'logs':
        return 'Search diagnostic logs...';
      default:
        return 'Search resources, files, or tasks...';
    }
  };

  return (
    <header className="fixed top-0 right-0 left-64 h-16 z-30 flex justify-between items-center px-8 bg-white border-b border-[#E2E8F0] font-sans">
      <div className="flex items-center gap-4 select-none">
        <span className="text-base font-bold text-[#0F172A] font-sans leading-none">
          {getHeaderTitle()}
        </span>
        <div className="h-6 w-[1px] bg-[#E2E8F0]" />
        <div className="flex items-center gap-2">
          {getSubBadge()}
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Search Input bar */}
        <div className="relative group select-none">
          <input
            type="text"
            placeholder={getSearchPlaceholder()}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-[#F1F5F9] border-none rounded-full pl-5 pr-10 py-1.5 text-[13px] w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[#1E293B] placeholder-[#94A3B8] font-sans"
          />
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] text-[18px]">
            search
          </span>
        </div>

        {/* Quick Diagnostics Actions */}
        <div className="flex items-center gap-3 relative select-none">
          {/* Hardware CPU Metrics Button */}
          <button 
            onClick={() => {
              setShowSystemInfo(!showSystemInfo);
            }}
            title="Interactive Node Telemetry Dashboard"
            className="material-symbols-outlined text-[#64748B] hover:text-primary transition-all p-1.5 hover:bg-[#F1F5F9] rounded-lg cursor-pointer text-[21px]"
          >
            memory
          </button>

          {/* Speed Toggle simulation */}
          <button 
            onClick={() => {
              if (onSpeedToggle) {
                onSpeedToggle();
              } else {
                alert(`Interactive simulation speed configured to: ${speedMode === 'normal' ? 'FAST' : 'NORMAL'}`);
              }
            }}
            title={`Simulation Cycle Speed (Current: ${speedMode.toUpperCase()})`}
            className={`material-symbols-outlined transition-all p-1.5 hover:bg-[#F1F5F9] rounded-lg cursor-pointer text-[21px] ${
              speedMode === 'turbo' 
                ? 'text-red-500 animate-pulse' 
                : speedMode === 'fast'
                  ? 'text-amber-500'
                  : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            speed
          </button>

          {/* Dev-board Quick Status logs toggle */}
          <button 
            onClick={() => alert("Uplink diagnostics check: Encryption levels optimal, AES-256 enabled, 0 integrity drops detected since heartbeat.")}
            className="material-symbols-outlined text-[#64748B] hover:text-primary transition-all p-1.5 hover:bg-[#F1F5F9] rounded-lg cursor-pointer text-[21px]"
            title="System Handshake Details"
          >
            developer_board
          </button>

          {/* Quick Micro interactive stats overlay panel */}
          {showSystemInfo && (
            <div className="absolute right-0 top-12 bg-white border border-[#E2E8F0] shadow-xl rounded-xl p-4 w-72 z-50 text-xs text-[#1E293B] animate-[bounceIn_0.2s_ease-out]">
              <div className="flex justify-between items-center pb-2 border-b border-[#F1F5F9]">
                <span className="font-bold text-[#0F172A]">Virtual Hardware State</span>
                <button 
                  onClick={() => setShowSystemInfo(false)} 
                  className="text-[#64748B] hover:text-red-500 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="space-y-3 mt-3">
                <div>
                  <div className="flex justify-between text-[11px] text-[#64748B] font-mono mb-1">
                    <span>VIRTUAL ADAPTER CORES</span>
                    <span>8 / 8 ALIVE</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[62%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[#64748B] font-mono mb-1">
                    <span>MEMORY COMMIT INDEX</span>
                    <span>4.18 GB / 16 GB</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[26%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[#64748B] font-mono mb-1">
                    <span>THROUGHPUT RATIO</span>
                    <span>{speedMode === 'turbo' ? '12.4k pkts/s' : speedMode === 'fast' ? '4.8k pkts/s' : '1.2k p/s'}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[45%]" />
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-[#F1F5F9] flex justify-between items-center text-[10px] text-[#64748B] font-mono">
                <span>ENCRYPTION ENGINE: AES-GCM</span>
                <span className="text-green-600 font-bold">STABLE</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
